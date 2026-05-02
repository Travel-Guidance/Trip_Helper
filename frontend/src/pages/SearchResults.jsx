import { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import Header from '../components/Header'
import SearchBar from '../components/SearchBar'
import FlightCard from '../components/FlightCard'
import { parseDuration, formatDateKo } from '../utils'
import { useFlightSearch } from '../hooks/useFlightSearch'

const SORT_OPTIONS = [
  { key: 'price', label: '최저가순' },
  { key: 'duration', label: '소요 시간순' },
  { key: 'depart', label: '출발 시간순' },
  { key: 'arrive', label: '도착 시간순' },
]

export default function SearchResults() {
  const [searchParams] = useSearchParams()
  const [sort, setSort] = useState('price')
  const [directOnly, setDirectOnly] = useState(false)

  const origin = searchParams.get('origin') || ''
  const destination = searchParams.get('destination') || ''
  const originName = searchParams.get('origin_name') || origin
  const destinationName = searchParams.get('destination_name') || destination
  const departureDate = searchParams.get('departure_date') || ''
  const returnDate = searchParams.get('return_date') || ''
  const adults = searchParams.get('adults') || '1'
  const cabinClass = searchParams.get('cabin_class') || 'economy'
  const tripType = searchParams.get('trip_type') || 'round'

  const { offers, loading, error } = useFlightSearch({
    origin, destination, departureDate, returnDate, adults, cabinClass, tripType,
  })

  const sorted = useMemo(() => {
    let list = directOnly
      ? offers.filter((o) => o.slices.every((s) => s.segments.length === 1))
      : [...offers]

    if (sort === 'price') {
      list.sort((a, b) => parseFloat(a.total_amount) - parseFloat(b.total_amount))
    } else if (sort === 'duration') {
      list.sort((a, b) => {
        const da = a.slices.reduce((s, sl) => s + parseDuration(sl.duration), 0)
        const db = b.slices.reduce((s, sl) => s + parseDuration(sl.duration), 0)
        return da - db
      })
    } else if (sort === 'depart') {
      list.sort((a, b) => {
        const ta = a.slices[0]?.segments[0]?.departing_at || ''
        const tb = b.slices[0]?.segments[0]?.departing_at || ''
        return ta.localeCompare(tb)
      })
    } else if (sort === 'arrive') {
      list.sort((a, b) => {
        const getLast = (o) => {
          const segs = o.slices[o.slices.length - 1]?.segments
          return segs?.[segs.length - 1]?.arriving_at || ''
        }
        return getLast(a).localeCompare(getLast(b))
      })
    }
    return list
  }, [offers, sort, directOnly])

  const routeLabel = `${originName} → ${destinationName}`
  const dateLabel = tripType === 'round' && returnDate
    ? `${formatDateKo(departureDate)} - ${formatDateKo(returnDate)}`
    : formatDateKo(departureDate)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />

      <div className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-route">{routeLabel}</div>
          <div className="page-hero-detail">
            {dateLabel} · 성인 {adults}명 · {cabinClass === 'economy' ? '일반석' : cabinClass}
          </div>
        </div>
      </div>

      {/* Re-search bar */}
      <div className="search-section" style={{ padding: '16px 24px' }}>
        <div className="search-card">
          <SearchBar
            initialValues={{
              origin,
              destination,
              origin_name: originName,
              destination_name: destinationName,
              departure_date: departureDate,
              return_date: returnDate,
              adults,
              cabin_class: cabinClass,
              trip_type: tripType,
            }}
          />
        </div>
      </div>

      <div className="results-layout">
        {/* 필터 사이드바 */}
        <aside className="filter-panel">
          <div className="filter-title">필터 &amp; 정렬</div>

          <div className="filter-group">
            <div className="filter-group-title">정렬</div>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                className={`sort-btn${sort === opt.key ? ' active' : ''}`}
                onClick={() => setSort(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <div className="filter-group-title">경유</div>
            <label className="filter-option">
              <input
                type="checkbox"
                checked={directOnly}
                onChange={(e) => setDirectOnly(e.target.checked)}
              />
              직항만
            </label>
          </div>
        </aside>

        {/* 결과 목록 */}
        <main className="results-main">
          <div className="results-header">
            <div className="results-count">
              {loading ? '검색 중...' : `총 ${sorted.length}개 항공편`}
            </div>
          </div>

          {loading && (
            <div className="loading-box">
              <div className="spinner" />
              항공권을 검색하고 있습니다...
            </div>
          )}

          {error && (
            <div className="error-box">
              <strong>오류가 발생했습니다:</strong> {error}
              <br />
              <small>입력하신 구간/날짜를 다시 확인해주세요.</small>
            </div>
          )}

          {!loading && !error && sorted.length === 0 && (
            <div className="loading-box">
              검색 결과가 없습니다. 다른 날짜나 조건으로 검색해보세요.
            </div>
          )}

          <div className="results-list">
            {sorted.map((offer) => (
              <FlightCard key={offer.id} offer={offer} />
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
