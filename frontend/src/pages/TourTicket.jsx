import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import Navbar from '../components/layout/Navbar'
import { searchTours } from '../api/tourApi'
import {
  DEFAULT_TOUR_QUERY, SEARCH_PLACEHOLDER,
  POPULAR_DESTS, HEROES, FALLBACK_IMAGES,
  SORT_OPTIONS, FILTER_OPTIONS,
} from '../data/tourData'
import { getStored, storeUnique, getSearchLabel } from '../utils/tourUtils'
import '../styles/tour.css'

export default function TourTicket() {
  const navigate = useNavigate()
  const [query,          setQuery]          = useState(DEFAULT_TOUR_QUERY)
  const [input,          setInput]          = useState('')
  const [displayQuery,   setDisplayQuery]   = useState('')
  const [hasSearched,    setHasSearched]    = useState(false)
  const [tours,          setTours]          = useState([])
  const [recentSearches, setRecentSearches] = useState(() => getStored('tour_recent_searches'))
  const [recentTours,    setRecentTours]    = useState(() => getStored('tour_recent_viewed'))
  const [isSearchOpen,   setIsSearchOpen]   = useState(false)
  const [sortBy,         setSortBy]         = useState('default')
  const [filters,        setFilters]        = useState([])
  const [loading,        setLoading]        = useState(true)
  const [loadingMore,    setLoadingMore]    = useState(false)
  const [nextPageToken,  setNextPageToken]  = useState('')
  const [error,          setError]          = useState('')
  const [loadMoreError,  setLoadMoreError]  = useState('')
  const loadMoreRef   = useRef(null)
  const searchInputRef = useRef(null)

  useEffect(() => {
    setLoading(true)
    setLoadingMore(false)
    setNextPageToken('')
    setError('')
    setLoadMoreError('')
    searchTours(query)
      .then(data => {
        setTours(data.tours || [])
        setNextPageToken(data.nextPageToken || '')
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || '투어 정보를 불러오지 못했습니다')
        setNextPageToken('')
        setLoading(false)
      })
  }, [query])

  const loadMoreTours = useCallback(() => {
    if (!nextPageToken || loading || loadingMore) return
    setLoadingMore(true)
    setLoadMoreError('')
    searchTours(query, nextPageToken)
      .then(data => {
        setTours(prev => {
          const currentIds = new Set(prev.map(tour => tour.id))
          const nextTours = (data.tours || []).filter(tour => tour.id && !currentIds.has(tour.id))
          return [...prev, ...nextTours]
        })
        setNextPageToken(data.nextPageToken || '')
      })
      .catch(err => {
        setLoadMoreError(err.message || '투어 정보를 더 불러오지 못했습니다')
        setNextPageToken('')
      })
      .finally(() => setLoadingMore(false))
  }, [loading, loadingMore, nextPageToken, query])

  useEffect(() => {
    const target = loadMoreRef.current
    if (!target || !nextPageToken || loading || error) return undefined
    const observer = new IntersectionObserver(
      entries => { if (entries[0]?.isIntersecting) loadMoreTours() },
      { rootMargin: '260px 0px' },
    )
    observer.observe(target)
    return () => observer.disconnect()
  }, [error, loadMoreTours, loading, nextPageToken])

  useEffect(() => {
    if (!isSearchOpen) return undefined
    searchInputRef.current?.focus()
    const handleKeyDown = (event) => { if (event.key === 'Escape') setIsSearchOpen(false) }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen])

  const handleSearch = (value = input, label = '') => {
    const next = value.trim()
    if (!next) return
    const nextLabel = (label || getSearchLabel(next)).trim()
    setQuery(next)
    setDisplayQuery(nextLabel)
    setHasSearched(true)
    setInput('')
    setIsSearchOpen(false)
    setRecentSearches(storeUnique('tour_recent_searches', nextLabel, v => v, 8))
  }

  const toggleFilter = (value) => {
    setFilters(prev => prev.includes(value) ? [] : [value])
  }

  const removeRecentSearch = (value) => {
    const next = recentSearches.filter(item => item !== value)
    localStorage.setItem('tour_recent_searches', JSON.stringify(next))
    setRecentSearches(next)
  }

  const handleTourClick = (tour) => {
    setIsSearchOpen(false)
    setRecentTours(storeUnique('tour_recent_viewed', tour, v => v.id, 6))
    navigate(`/tour-ticket/${tour.id}`, { state: { tour } })
  }

  const visibleTours = useMemo(() => {
    const filtered = tours.filter(tour => {
      if (filters.includes('reservation') && !tour.reservationLevel?.includes('권장')) return false
      if (filters.includes('paid')        && !tour.costLevel?.includes('입장료'))      return false
      if (filters.includes('free')        && !tour.costLevel?.includes('무료'))        return false
      if (filters.includes('open')        && tour.openNow !== true)                    return false
      if (filters.includes('rated')       && !tour.rating)                             return false
      return true
    })
    if (sortBy === 'rating')  return [...filtered].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
    if (sortBy === 'reviews') return [...filtered].sort((a, b) => Number(b.reviewCount || 0) - Number(a.reviewCount || 0))
    return filtered
  }, [filters, sortBy, tours])

  const queryLabel = hasSearched ? displayQuery || getSearchLabel(query) : SEARCH_PLACEHOLDER
  const replaceBrokenImage = (event, fallback) => {
    if (event.currentTarget.dataset.fallbackApplied) return
    event.currentTarget.dataset.fallbackApplied = 'true'
    event.currentTarget.src = fallback
  }

  return (
    <div className="tour-page">
      <Navbar />

      <main className="tour-wrap">
        <section className="tour-hero-grid">
          {HEROES.map(hero => (
            <button key={hero.title} className="tour-hero-card" onClick={() => handleSearch(hero.query, hero.label)}>
              <img src={hero.image} alt={hero.title} />
              <span>{hero.sub}</span>
              <strong>{hero.title}</strong>
            </button>
          ))}
        </section>

        <button className="tour-search tour-search-trigger" onClick={() => setIsSearchOpen(true)}>
          <span>🔍</span>
          <strong>{queryLabel}</strong>
          <em>검색</em>
        </button>

        {isSearchOpen && (
          <div className="tour-search-modal" onMouseDown={e => {
            if (e.target === e.currentTarget) setIsSearchOpen(false)
          }}>
            <div className="tour-search-panel" role="dialog" aria-modal="true" aria-label="투어 검색">
              <form className="tour-modal-search" onSubmit={e => { e.preventDefault(); handleSearch() }}>
                <span>🔍</span>
                <input
                  ref={searchInputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder='도시나 명소 검색 예: "Paris museum"'
                />
                <button>검색</button>
              </form>

              <div className="tour-modal-body">
                <div className="tour-modal-recent">
                  <div className="tour-modal-title"><strong>최근검색어</strong></div>
                  {recentSearches.length ? recentSearches.map((item, i) => (
                    <div key={`${item}-modal-${i}`} className="tour-recent-search-row">
                      <button type="button" onClick={() => handleSearch(item)}>{getSearchLabel(item)}</button>
                      <button type="button" aria-label={`${getSearchLabel(item)} 삭제`} onClick={() => removeRecentSearch(item)}>×</button>
                    </div>
                  )) : <p>최근검색어가 없습니다.</p>}
                </div>

                <div className="tour-modal-viewed">
                  <div className="tour-modal-banner">예약 권장 명소를 빠르게 찾아보세요</div>
                  <div className="tour-modal-title"><strong>최근 본 투어</strong></div>
                  {recentTours.length ? (
                    <div className="tour-modal-card-list">
                      {recentTours.map(tour => (
                        <button key={tour.id} onClick={() => handleTourClick(tour)}>
                          <img
                            src={tour.photoUrl || FALLBACK_IMAGES[0]}
                            alt={tour.name}
                            onError={event => replaceBrokenImage(event, FALLBACK_IMAGES[0])}
                          />
                          <strong>{tour.name}</strong>
                          <span>{tour.rating ? `★ ${tour.rating} (${Number(tour.reviewCount || 0).toLocaleString()})` : '평점 정보 없음'}</span>
                        </button>
                      ))}
                    </div>
                  ) : <p>최근 본 투어가 없습니다.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="tour-dashboard">
          <aside className="tour-side">
            <div className="tour-side-panel tour-filter-panel">
              <div className="tour-side-title">필터</div>
              <div className="tour-filter-group">
                <span>정렬</span>
                {SORT_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={sortBy === option.value ? 'is-active' : ''}
                    onClick={() => setSortBy(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="tour-filter-group">
                <span>필터</span>
                {FILTER_OPTIONS.map(option => (
                  <button
                    key={option.value}
                    className={filters.includes(option.value) ? 'is-active' : ''}
                    onClick={() => toggleFilter(option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          <div className="tour-main">
            <section className="tour-region">
              <h2>어디로 떠나시나요?</h2>
              <div className="tour-dest-list">
                {POPULAR_DESTS.map(dest => (
                  <button key={dest.label} onClick={() => handleSearch(dest.query, dest.label)}>
                    <span>{dest.icon}</span>
                    {dest.label}
                  </button>
                ))}
              </div>
            </section>

            <section className="tour-recent-viewed">
              <div className="tour-section-head"><h2>최근 본 투어</h2></div>
              {recentTours.length ? (
                <div className="tour-mini-list">
                  {recentTours.map(tour => (
                    <button key={tour.id} onClick={() => handleTourClick(tour)}>
                      <img
                        src={tour.photoUrl || FALLBACK_IMAGES[0]}
                        alt={tour.name}
                        onError={event => replaceBrokenImage(event, FALLBACK_IMAGES[0])}
                      />
                      <span>{tour.name}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="tour-empty-mini">최근 본 투어가 없습니다.</div>
              )}
            </section>

            <section>
              <div className="tour-section-head">
                <h2>추천 명소</h2>
                <span>{hasSearched ? queryLabel : '기본 추천'} · {visibleTours.length}개</span>
              </div>

              {loading ? (
                <div className="tour-grid">
                  {Array.from({ length: 8 }).map((_, i) => <div key={i} className="tour-card tour-card--skeleton" />)}
                </div>
              ) : error ? (
                <div className="tour-error">{error}</div>
              ) : (
                <>
                  {visibleTours.length ? (
                    <div className="tour-grid">
                      {visibleTours.map((tour, i) => (
                        <button key={tour.id} className="tour-card" onClick={() => handleTourClick(tour)}>
                          <img
                            src={tour.photoUrl || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]}
                            alt={tour.name}
                            onError={event => replaceBrokenImage(event, FALLBACK_IMAGES[i % FALLBACK_IMAGES.length])}
                          />
                          <div className="tour-badges">
                            <span className="tour-badge tour-badge-blue">{tour.reservationLevel}</span>
                            <span className="tour-badge tour-badge-green">{tour.costLevel}</span>
                          </div>
                          <div className="tour-card-body">
                            <strong>{tour.name}</strong>
                            <span>{tour.address}</span>
                            <em>{tour.rating ? `★ ${tour.rating} (${Number(tour.reviewCount || 0).toLocaleString()})` : '평점 정보 없음'}</em>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="tour-error">선택한 필터에 맞는 명소가 없습니다.</div>
                  )}
                  {nextPageToken ? (
                    <div ref={loadMoreRef} className="tour-load-more">
                      {loadingMore ? '명소를 더 불러오는 중...' : '아래로 스크롤하면 더 불러와요'}
                    </div>
                  ) : loadMoreError ? (
                    <div className="tour-load-more tour-load-more--end">{loadMoreError}</div>
                  ) : tours.length ? (
                    <div className="tour-load-more tour-load-more--end">더 불러올 명소가 없습니다.</div>
                  ) : null}
                </>
              )}
            </section>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
