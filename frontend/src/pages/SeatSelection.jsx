import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import BottomNav from '../components/layout/BottomNav'
import { formatTime, formatDateShort, formatPrice } from '../utils'
import { useOffer } from '../hooks/useOffer'
import { useSeatMaps } from '../hooks/useSeatMaps'
import '../styles/seat.css'

const SEAT_COLORS = {
  unavailable: { bg: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed' },
  free:        { bg: '#dbeafe', color: '#1e40af', cursor: 'pointer' },
  paid:        { bg: '#fef3c7', color: '#92400e', cursor: 'pointer' },
  selected:    { bg: '#1A56DB', color: '#ffffff', cursor: 'pointer' },
}

function SeatElement({ element, passengerId, isSelected, onSelect }) {
  if (element.type !== 'seat') {
    return <div className="seat-cell seat-empty" />
  }

  const service = element.available_services?.find(s => s.passenger_id === passengerId)
    || element.available_services?.[0]

  const unavailable = !element.available_services?.length
  const style = isSelected
    ? SEAT_COLORS.selected
    : unavailable
    ? SEAT_COLORS.unavailable
    : parseFloat(service?.total_amount) > 0
    ? SEAT_COLORS.paid
    : SEAT_COLORS.free

  return (
    <button
      className="seat-cell seat-btn"
      style={{ background: style.bg, color: style.color, cursor: style.cursor }}
      disabled={unavailable}
      onClick={() => !unavailable && service && onSelect(service, element.designator)}
      title={
        unavailable
          ? '선택 불가'
          : parseFloat(service?.total_amount) > 0
          ? `${element.designator} — ${formatPrice(service.total_amount, service.total_currency)}`
          : `${element.designator} — 무료`
      }
    >
      {element.designator?.replace(/\d+/, '')}
    </button>
  )
}

function SeatMap({ seatMap, offer, selected, onSelect }) {
  const segment = offer?.slices
    ?.flatMap(s => s.segments)
    ?.find(seg => seg.id === seatMap.segment_id)

  const cabin = seatMap.cabins?.[0]
  if (!cabin) return null

  const passengerId = offer?.passengers?.[0]?.id

  // 열 헤더 뽑기 (첫 번째 row의 sections에서)
  const firstRow = cabin.rows?.[0]
  const colHeaders = firstRow?.sections?.flatMap(section =>
    section.elements.map(el => el.type === 'seat' ? el.designator?.replace(/\d+/, '') : '')
  ) || []

  return (
    <div className="seat-map-wrap">
      {segment && (
        <div className="seat-segment-label">
          {segment.origin?.iata_code} → {segment.destination?.iata_code}&nbsp;&nbsp;
          <span style={{ fontWeight: 400, color: 'var(--text-muted)' }}>
            {formatDateShort(segment.departing_at)} {formatTime(segment.departing_at)}
          </span>
        </div>
      )}

      <div className="seat-map-scroll">
        <div className="seat-map-inner">
          {/* 열 헤더 */}
          <div className="seat-row">
            <div className="seat-row-num" />
            {firstRow?.sections?.map((section, si) => (
              <div key={si} className="seat-section-header">
                {section.elements.map((el, ei) => (
                  <div key={ei} className="seat-cell seat-header">
                    {el.type === 'seat' ? el.designator?.replace(/\d+/, '') : ''}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 좌석 행 */}
          {cabin.rows.map((row, ri) => {
            const rowNum = row.sections?.[0]?.elements?.find(e => e.type === 'seat')?.designator?.match(/\d+/)?.[0]
            return (
              <div key={ri} className="seat-row">
                <div className="seat-row-num">{rowNum || ''}</div>
                {row.sections.map((section, si) => (
                  <div key={si} className="seat-section">
                    {section.elements.map((el, ei) => {
                      const selKey = `${seatMap.id}_${passengerId}`
                      const isSelected = selected[selKey]?.designator === el.designator
                      return (
                        <SeatElement
                          key={ei}
                          element={el}
                          passengerId={passengerId}
                          isSelected={isSelected}
                          onSelect={(service, designator) =>
                            onSelect(seatMap.id, passengerId, service, designator,
                              isSelected ? null : service)
                          }
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function SeatSelection() {
  const { offerId } = useParams()
  const navigate = useNavigate()
  const { offer, loading: offerLoading, error: offerError } = useOffer(offerId)
  const { seatMaps, loading: mapsLoading, error: mapsError } = useSeatMaps(offerId)
  const [selected, setSelected] = useState({})
  const [activeIdx, setActiveIdx] = useState(0)

  const loading = offerLoading || mapsLoading
  const error = offerError || mapsError

  useEffect(() => {
    if (!mapsLoading && seatMaps.length === 0 && !mapsError) {
      navigate(`/booking/${offerId}`, { replace: true })
    }
  }, [mapsLoading, seatMaps, mapsError, offerId, navigate])

  const handleSelect = (seatMapId, passengerId, service, designator, isDeselect) => {
    const key = `${seatMapId}_${passengerId}`
    setSelected(prev => {
      if (isDeselect === null) {
        const next = { ...prev }
        delete next[key]
        return next
      }
      return { ...prev, [key]: { serviceId: service.id, designator, amount: service.total_amount, currency: service.total_currency } }
    })
  }

  const handleNext = () => {
    const services = Object.values(selected).map(s => ({ id: s.serviceId, quantity: 1 }))
    sessionStorage.setItem('selected_services', JSON.stringify(services))
    navigate(`/booking/${offerId}`)
  }

  const totalSeatCost = Object.values(selected).reduce((sum, s) => sum + parseFloat(s.amount || 0), 0)
  const seatCostCurrency = Object.values(selected)[0]?.currency || 'KRW'
  const selectedCount = Object.keys(selected).length

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 64 }}>
        <Navbar />
        <div className="loading-box" style={{ maxWidth: 900, margin: '40px auto' }}>
          <div className="spinner" />
          좌석 배치도를 불러오는 중...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 64 }}>
        <Navbar />
        <div className="error-box" style={{ maxWidth: 900, margin: '40px auto' }}>{error}</div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="select-btn" style={{ width: 'auto', padding: '10px 24px' }}
            onClick={() => navigate(`/booking/${offerId}`)}>
            좌석 없이 계속하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 64 }}>
      <Navbar />

      <div className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-route">좌석 선택</div>
          <div className="page-hero-detail">원하는 좌석을 선택해주세요 (선택 안 해도 계속 진행 가능)</div>
        </div>
      </div>

      <div className="seat-page-layout">
        <div className="seat-main">
          {/* 세그먼트 탭 */}
          {seatMaps.length > 1 && (
            <div className="seat-tabs">
              {seatMaps.map((sm, i) => {
                const seg = offer?.slices?.flatMap(s => s.segments)?.find(s => s.id === sm.segment_id)
                return (
                  <button
                    key={sm.id}
                    className={`seat-tab${activeIdx === i ? ' active' : ''}`}
                    onClick={() => setActiveIdx(i)}
                  >
                    {i === 0 ? '가는 편' : '오는 편'}&nbsp;
                    {seg && `${seg.origin?.iata_code} → ${seg.destination?.iata_code}`}
                  </button>
                )
              })}
            </div>
          )}

          {/* 범례 */}
          <div className="seat-legend">
            <span><span className="legend-box" style={{ background: '#dbeafe' }} />무료</span>
            <span><span className="legend-box" style={{ background: '#fef3c7' }} />유료</span>
            <span><span className="legend-box" style={{ background: '#1A56DB' }} />선택됨</span>
            <span><span className="legend-box" style={{ background: '#e5e7eb' }} />선택 불가</span>
          </div>

          {seatMaps[activeIdx] && (
            <SeatMap
              seatMap={seatMaps[activeIdx]}
              offer={offer}
              selected={selected}
              onSelect={handleSelect}
            />
          )}
        </div>

        {/* 오른쪽 요약 */}
        <aside>
          <div className="order-summary">
            <div className="summary-title">선택한 좌석</div>

            {selectedCount === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', padding: '8px 0' }}>
                아직 선택한 좌석이 없습니다
              </div>
            ) : (
              Object.entries(selected).map(([key, s]) => {
                const mapIdx = seatMaps.findIndex(sm => key.startsWith(sm.id))
                const label = seatMaps.length > 1
                  ? (mapIdx === 0 ? '가는 편' : '오는 편')
                  : '좌석'
                return (
                  <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 14 }}>
                    <span>{label} <strong>{s.designator}</strong></span>
                    <span style={{ color: 'var(--primary)' }}>
                      {parseFloat(s.amount) > 0 ? formatPrice(s.amount, s.currency) : '무료'}
                    </span>
                  </div>
                )
              })
            )}

            {totalSeatCost > 0 && (
              <>
                <div className="summary-divider" />
                <div className="summary-price-row">
                  <span>좌석 추가 요금</span>
                  <span>{formatPrice(totalSeatCost.toFixed(2), seatCostCurrency)}</span>
                </div>
              </>
            )}

            <div className="summary-divider" />

            <button className="book-btn" onClick={handleNext}>
              다음 — 승객 정보 입력
            </button>
            <button
              style={{ width: '100%', marginTop: 8, padding: '10px', fontSize: 13, color: 'var(--text-muted)', textAlign: 'center' }}
              onClick={() => { sessionStorage.removeItem('selected_services'); navigate(`/booking/${offerId}`) }}
            >
              좌석 선택 건너뛰기
            </button>
          </div>
        </aside>
      </div>
      <BottomNav />
    </div>
  )
}
