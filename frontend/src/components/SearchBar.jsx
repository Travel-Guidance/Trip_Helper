import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import AirportModal from './AirportModal'
import { formatDateKo } from '../utils'

const CABIN_LABELS = {
  economy: '일반석',
  premium_economy: '프리미엄 일반석',
  business: '비즈니스석',
  first: '일등석',
}

export default function SearchBar({ initialValues = {} }) {
  const navigate = useNavigate()
  const [tripType, setTripType] = useState(initialValues.trip_type || 'round')
  const [origin, setOrigin] = useState(
    initialValues.origin ? { code: initialValues.origin, name: `${initialValues.origin_name || initialValues.origin}` } : null
  )
  const [destination, setDestination] = useState(
    initialValues.destination ? { code: initialValues.destination, name: `${initialValues.destination_name || initialValues.destination}` } : null
  )
  const [departureDate, setDepartureDate] = useState(initialValues.departure_date || '')
  const [returnDate, setReturnDate] = useState(initialValues.return_date || '')
  const [adults, setAdults] = useState(Number(initialValues.adults) || 1)
  const [cabinClass, setCabinClass] = useState(initialValues.cabin_class || 'economy')
  const [directOnly, setDirectOnly] = useState(false)
  const [showPassenger, setShowPassenger] = useState(false)
  const [originModal, setOriginModal] = useState(false)
  const [destModal, setDestModal] = useState(false)
  const passengerRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (passengerRef.current && !passengerRef.current.contains(e.target)) {
        setShowPassenger(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSwap = () => {
    setOrigin(destination)
    setDestination(origin)
  }

  const handleSearch = () => {
    if (!origin || !destination || !departureDate) {
      alert('출발지, 도착지, 가는날을 입력해주세요.')
      return
    }
    if (tripType === 'round' && !returnDate) {
      alert('오는날을 입력해주세요.')
      return
    }
    const params = new URLSearchParams({
      origin: origin.code,
      destination: destination.code,
      origin_name: origin.name,
      destination_name: destination.name,
      departure_date: departureDate,
      adults,
      cabin_class: cabinClass,
      trip_type: tripType,
    })
    if (tripType === 'round' && returnDate) params.set('return_date', returnDate)
    if (directOnly) params.set('direct_only', '1')
    navigate(`/search?${params.toString()}`)
  }

  const passengerLabel = `승객 ${adults}명, ${CABIN_LABELS[cabinClass]}`

  return (
    <div>
      <div className="search-row">
        {/* 출발지 */}
        <div className="search-field airport-trigger" style={{ minWidth: 160 }} onClick={() => setOriginModal(true)}>
          <span className="search-icon">✈</span>
          {origin
            ? <span className="search-field-value" style={{ fontSize: 13 }}>{origin.name}</span>
            : <span className="search-field-placeholder">출발지를 입력하세요</span>
          }
        </div>

        <button className="swap-btn" onClick={handleSwap} title="출발/도착 변경">⇄</button>

        {/* 도착지 */}
        <div className="search-field airport-trigger" style={{ minWidth: 160 }} onClick={() => setDestModal(true)}>
          <span className="search-icon">🏁</span>
          {destination
            ? <span className="search-field-value" style={{ fontSize: 13 }}>{destination.name}</span>
            : <span className="search-field-placeholder">도착지가 어디인가요?</span>
          }
        </div>

        {/* 가는날 */}
        <div className="search-field" style={{ minWidth: 130 }}>
          <span className="search-icon">📅</span>
          <div style={{ flex: 1, position: 'relative' }}>
            {departureDate
              ? <div className="search-field-value" style={{ fontSize: 13 }}>{formatDateKo(departureDate)}</div>
              : <div className="search-field-placeholder">가는날 선택</div>
            }
            <input
              type="date"
              className="date-input"
              value={departureDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setDepartureDate(e.target.value)}
              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
            />
          </div>
        </div>

        {/* 오는날 */}
        {tripType === 'round' && (
          <div className="search-field" style={{ minWidth: 130 }}>
            <span className="search-icon">📅</span>
            <div style={{ flex: 1, position: 'relative' }}>
              {returnDate
                ? <div className="search-field-value" style={{ fontSize: 13 }}>{formatDateKo(returnDate)}</div>
                : <div className="search-field-placeholder">오는날 선택</div>
              }
              <input
                type="date"
                className="date-input"
                value={returnDate}
                min={departureDate || new Date().toISOString().split('T')[0]}
                onChange={(e) => setReturnDate(e.target.value)}
                style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }}
              />
            </div>
          </div>
        )}

        {/* 승객 */}
        <div className="search-field" style={{ position: 'relative', minWidth: 160, cursor: 'pointer' }} ref={passengerRef}>
          <span className="search-icon">👤</span>
          <div style={{ flex: 1 }} onClick={() => setShowPassenger(!showPassenger)}>
            <div className="search-field-value" style={{ fontSize: 13 }}>{passengerLabel}</div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--text-light)' }}>▼</span>

          {showPassenger && (
            <div className="passenger-dropdown">
              <div className="passenger-row">
                <div>
                  <div className="passenger-label">성인</div>
                  <div className="passenger-sub">만 12세 이상</div>
                </div>
                <div className="passenger-count-ctrl">
                  <button className="count-btn" onClick={() => setAdults(a => Math.max(1, a - 1))} disabled={adults <= 1}>−</button>
                  <span style={{ fontWeight: 700, minWidth: 16, textAlign: 'center' }}>{adults}</span>
                  <button className="count-btn" onClick={() => setAdults(a => Math.min(9, a + 1))} disabled={adults >= 9}>+</button>
                </div>
              </div>
              <select className="cabin-select" value={cabinClass} onChange={(e) => setCabinClass(e.target.value)}>
                <option value="economy">일반석 (Economy)</option>
                <option value="premium_economy">프리미엄 일반석 (Premium Economy)</option>
                <option value="business">비즈니스석 (Business)</option>
                <option value="first">일등석 (First)</option>
              </select>
              <button className="passenger-confirm-btn" onClick={() => setShowPassenger(false)}>확인</button>
            </div>
          )}
        </div>

        <button className="search-btn" onClick={handleSearch}>항공권 검색</button>
      </div>

      <div className="search-options">
        <label className="search-checkbox">
          <input type="checkbox" checked={directOnly} onChange={(e) => setDirectOnly(e.target.checked)} />
          직항만
        </label>
        <label className="search-checkbox">
          <input type="checkbox" />
          무료 수하물 가능
        </label>
        <span className="search-checkbox" style={{ cursor: 'default', color: 'var(--text-light)' }}>
          출발/도착 다른 구간 ⓘ
        </span>
      </div>

      <AirportModal open={originModal} onClose={() => setOriginModal(false)} onSelect={setOrigin} />
      <AirportModal open={destModal} onClose={() => setDestModal(false)} onSelect={setDestination} />
    </div>
  )
}
