import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import Navbar from '../components/layout/Navbar'
import { formatKrwPrice, toKrw } from '../utils/currency'
import { searchStays } from '../api/accomodationApi'
import { pickHotelImage } from '../data/images'
import '../styles/accommodation.css'

const SORT_OPTIONS = [
  { value: 'recommended', label: '추천순' },
  { value: 'price',       label: '최저가순' },
  { value: 'rating',      label: '별점순' },
]

export default function AccSearchResults() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const countryKey  = searchParams.get('countryKey')  || ''
  const destination = searchParams.get('destination') || countryKey
  const checkIn     = searchParams.get('checkIn')     || ''
  const checkOut    = searchParams.get('checkOut')    || ''
  const guests      = Number(searchParams.get('guests') || 2)

  const [hotels,  setHotels]  = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')

  const [sortBy,      setSortBy]      = useState('recommended')
  const [starFilter,  setStarFilter]  = useState(new Set([1, 2, 3, 4, 5]))
  const [freeCancel,  setFreeCancel]  = useState(false)

  useEffect(() => {
    if (!countryKey) { setError('여행지를 선택해주세요.'); setLoading(false); return }
    searchStays({ country: countryKey, checkIn, checkOut, guests })
      .then(data => { setHotels(data); setLoading(false) })
      .catch(err => { setError(err.message || '검색 중 오류가 발생했습니다.'); setLoading(false) })
  }, [countryKey, checkIn, checkOut, guests])

  const toggleStar = (s) => {
    setStarFilter(prev => {
      const next = new Set(prev)
      next.has(s) ? next.delete(s) : next.add(s)
      return next
    })
  }

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 1

  const filtered = hotels
    .filter(h => !h.rating || starFilter.has(Math.floor(h.rating)))
    .sort((a, b) => {
      if (sortBy === 'price')  return toKrw(a.price, a.currency) - toKrw(b.price, b.currency)
      if (sortBy === 'rating') return (b.rating || 0) - (a.rating || 0)
      return 0
    })

  const activeFilters = (freeCancel ? 1 : 0) + (starFilter.size < 5 ? 1 : 0)

  const goDetail = (hotel) => {
    const params = new URLSearchParams({
      destination,
      countryKey,
      checkIn,
      checkOut,
      guests: String(guests),
    })
    navigate(`/accomodation/${hotel.id}?${params}`, { state: { hotel } })
  }

  return (
    <div className="asr-page">
      <Navbar />

      {/* 검색 요약 바 */}
      <div className="asr-summary-bar">
        <span className="asr-summary-dest">{destination}</span>
        <span className="asr-summary-dot">·</span>
        <span className="asr-summary-info">{checkIn} ~ {checkOut}</span>
        <span className="asr-summary-dot">·</span>
        <span className="asr-summary-info">성인 {guests}명</span>
        <button className="asr-modify-btn" onClick={() => navigate('/accomodation')}>수정</button>
      </div>

      <div className="asr-body">

        {/* ── 왼쪽 필터 사이드바 ── */}
        <aside className="asr-sidebar">
          <div className="asr-filter-panel">
            <div className="asr-filter-hd">
              <span className="asr-filter-hd-icon">⚙</span>
              <span className="asr-filter-hd-title">필터 &amp; 정렬</span>
              {activeFilters > 0 && <span className="asr-filter-badge">{activeFilters}</span>}
            </div>

            {/* 정렬 */}
            <div className="asr-filter-section">
              <p className="asr-section-title">정렬</p>
              {SORT_OPTIONS.map(opt => (
                <label key={opt.value} className="asr-radio-row">
                  <input
                    type="radio"
                    name="sortBy"
                    value={opt.value}
                    checked={sortBy === opt.value}
                    onChange={() => setSortBy(opt.value)}
                    className="asr-radio"
                  />
                  <span className={sortBy === opt.value ? 'asr-radio-label active' : 'asr-radio-label'}>
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>

            {/* 숙소 성급 */}
            <div className="asr-filter-section">
              <p className="asr-section-title">숙소 성급</p>
              {[5, 4, 3, 2, 1].map(s => (
                <label key={s} className="asr-check-row">
                  <input
                    type="checkbox"
                    checked={starFilter.has(s)}
                    onChange={() => toggleStar(s)}
                    className="asr-checkbox"
                  />
                  <span className="asr-stars-label">{'★'.repeat(s)}</span>
                </label>
              ))}
            </div>

            {/* 취소 정책 */}
            <div className="asr-filter-section">
              <p className="asr-section-title">취소 정책</p>
              <label className="asr-check-row">
                <input
                  type="checkbox"
                  checked={freeCancel}
                  onChange={() => setFreeCancel(p => !p)}
                  className="asr-checkbox"
                />
                <span>무료취소 가능만</span>
              </label>
            </div>
          </div>
        </aside>

        {/* ── 오른쪽 결과 영역 ── */}
        <main className="asr-main">
          {loading ? (
            <div className="asr-list">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="asr-skeleton-card">
                  <div className="asr-skeleton-img" />
                  <div className="asr-skeleton-body">
                    <div className="ac-skeleton-line" />
                    <div className="ac-skeleton-line ac-skeleton-line--short" />
                    <div className="ac-skeleton-line ac-skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="asr-error">
              <p className="asr-error-icon">⚠️</p>
              <p className="asr-error-msg">{error}</p>
              <button className="asr-error-btn" onClick={() => navigate('/accomodation')}>돌아가기</button>
            </div>
          ) : (
            <>
              <div className="asr-results-hd">
                <span className="asr-total">총 <b>{filtered.length}</b>개 숙소</span>
              </div>

              {filtered.length === 0 ? (
                <div className="asr-empty">조건에 맞는 숙소가 없습니다.</div>
              ) : (
                <div className="asr-list">
                  {filtered.map(hotel => (
                    <div key={hotel.id} className="asr-card" onClick={() => goDetail(hotel)}>
                      <div className="asr-card-img-wrap">
                        <img
                          src={hotel.image || pickHotelImage(hotel.id)}
                          alt={hotel.name}
                          className="asr-card-img"
                        />
                        {hotel.tag && <span className="asr-card-tag">{hotel.tag}</span>}
                      </div>

                      <div className="asr-card-info">
                        <div className="asr-card-info-top">
                          <p className="asr-card-name">{hotel.name}</p>
                          {hotel.rating != null && (
                            <p className="asr-card-stars">
                              {'★'.repeat(Math.min(5, Math.floor(hotel.rating)))}
                            </p>
                          )}
                          <p className="asr-card-location">📍 {hotel.location}</p>
                        </div>

                        <div className="asr-card-info-bottom">
                          <span className="asr-free-cancel">무료취소</span>
                          <div className="asr-price-block">
                            <span className="asr-price">
                              {formatKrwPrice(hotel.price, hotel.currency)}
                            </span>
                            <span className="asr-price-sub">총 {nights}박 세금 포함</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  )
}
