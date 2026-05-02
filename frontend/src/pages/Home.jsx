import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import SearchBar from '../components/SearchBar'
import BottomNav from '../components/BottomNav'
import { FLAGS } from '../utils'
import { getPopular } from '../services/flightApi'
import { useSearch } from '../store/SearchContext'

const REGIONS = [
  { key: 'all', label: '추천' },
  { key: 'east_asia', label: '동아시아' },
  { key: 'southeast_asia', label: '동남아시아' },
  { key: 'americas', label: '미주' },
  { key: 'europe', label: '유럽' },
  { key: 'oceania', label: '대양주' },
  { key: 'middle_east', label: '중동' },
  { key: 'africa', label: '아프리카' },
]

export default function Home() {
  const navigate = useNavigate()
  const { tripType, setTripType } = useSearch()
  const [popular, setPopular] = useState([])
  const [region, setRegion] = useState('all')

  useEffect(() => {
    getPopular().then(setPopular).catch(console.error)
  }, [])

  const filtered = region === 'all' ? popular : popular.filter((d) => d.region === region)

  const handlePopularClick = (dest) => {
    const today = new Date()
    const dep = dest.dates.split(' - ')[0]
    navigate(
      `/search?origin=ICN&destination=${dest.code}&destination_name=${encodeURIComponent(dest.city)}&departure_date=${
        new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
      }&adults=1&cabin_class=economy&trip_type=round`
    )
  }

  // Pair popular items into rows of 2
  const rows = []
  for (let i = 0; i < filtered.length; i += 2) {
    rows.push(filtered.slice(i, i + 2))
  }

  return (
    <div className="page-home">
      <Header tripType={tripType} onTripTypeChange={setTripType} />

      <div className="search-section">
        <div className="search-card">
          <SearchBar initialValues={{ trip_type: tripType }} />
        </div>
      </div>

      {/* 프로모 배너 */}
      <div className="promo-banner">
        <div className="promo-card">
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)', marginBottom: 6, letterSpacing: 1 }}>
              My LuckyGlide
            </div>
            <div className="promo-title">내게 맞는 최저가 항공권 찾기</div>
            <div className="promo-sub">원하는 조건에 맞춰 가장 저렴한 항공권을 찾아보세요</div>
          </div>
          <button className="promo-btn">바로 시작하기</button>
        </div>
      </div>

      {/* 인기 여행지 */}
      <div className="popular-section">
        <div className="popular-title">실시간 항공권 최저가</div>
        <div className="popular-subtitle">ⓘ 항공권 가격은 실시간으로 변동될 수 있어요</div>

        <div className="region-tabs">
          {REGIONS.map((r) => (
            <button
              key={r.key}
              className={`region-tab${region === r.key ? ' active' : ''}`}
              onClick={() => setRegion(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            데이터를 불러오는 중...
          </div>
        ) : (
          <div className="popular-grid">
            {rows.map((row, ri) => (
              <div key={ri} className="popular-items-row">
                {row.map((dest) => (
                  <div key={dest.id} className="popular-item" onClick={() => handlePopularClick(dest)}>
                    <div className="popular-flag">{FLAGS[dest.country] || '🌍'}</div>
                    <div>
                      <div className="popular-city">{dest.city}</div>
                      <div className="popular-price">{dest.price.toLocaleString('ko-KR')}원</div>
                      <div className="popular-date">{dest.dates}, {dest.days}일</div>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
