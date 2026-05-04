import { useParams, useLocation, Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Navbar from '../components/layout/Navbar'
import BottomNav from '../components/layout/BottomNav'
import { formatTime, formatDateShort, formatPrice } from '../utils'
import { getOrder } from '../api/flightApi'
import '../styles/flight.css'

export default function Confirmation() {
  const { orderId } = useParams()
  const { state } = useLocation()
  const [order, setOrder] = useState(state?.order || null)
  const [loading, setLoading] = useState(!state?.order)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (order) return
    getOrder(orderId)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 64 }}>
        <Navbar />
        <div className="loading-box" style={{ maxWidth: 640, margin: '60px auto' }}>
          <div className="spinner" />
          예약 정보를 불러오는 중...
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 64 }}>
        <Navbar />
        <div className="error-box" style={{ maxWidth: 640, margin: '60px auto' }}>
          예약 정보를 불러올 수 없습니다: {error}
        </div>
      </div>
    )
  }

  const pax = order.passengers?.[0]
  const paxName = pax ? `${pax.given_name} ${pax.family_name}` : '-'

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 64 }}>
      <Navbar />

      <div className="confirm-page">
        <div className="confirm-icon">✅</div>
        <div className="confirm-title">예약이 완료되었습니다!</div>
        <div className="confirm-sub">
          예약 확인 이메일이 발송되었습니다. 아래 예약 번호를 저장해주세요.
        </div>

        {/* 예약번호 */}
        <div className="confirm-card">
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>
            예약 번호
          </div>
          <div className="confirm-ref">{order.booking_reference || orderId.slice(0, 8).toUpperCase()}</div>

          {/* 항공편 정보 */}
          {order.slices?.map((slice, i) => {
            const first = slice.segments?.[0]
            const last = slice.segments?.[slice.segments.length - 1]
            return (
              <div key={slice.id || i}>
                {order.slices.length > 1 && (
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)', margin: '12px 0 8px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {i === 0 ? '가는 편' : '오는 편'}
                  </div>
                )}
                <div className="confirm-row">
                  <span className="confirm-row-label">구간</span>
                  <span className="confirm-row-value">
                    {first?.origin?.iata_code} → {last?.destination?.iata_code}
                  </span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-row-label">날짜</span>
                  <span className="confirm-row-value">{formatDateShort(first?.departing_at)}</span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-row-label">시간</span>
                  <span className="confirm-row-value">
                    {formatTime(first?.departing_at)} → {formatTime(last?.arriving_at)}
                  </span>
                </div>
                <div className="confirm-row">
                  <span className="confirm-row-label">항공편</span>
                  <span className="confirm-row-value">
                    {first?.marketing_carrier?.iata_code}{first?.marketing_carrier_flight_number}
                  </span>
                </div>
              </div>
            )
          })}
        </div>

        {/* 승객 및 결제 정보 */}
        <div className="confirm-card">
          <div className="confirm-row">
            <span className="confirm-row-label">승객</span>
            <span className="confirm-row-value">{paxName}</span>
          </div>
          <div className="confirm-row">
            <span className="confirm-row-label">결제 금액</span>
            <span className="confirm-row-value" style={{ color: 'var(--primary)' }}>
              {formatPrice(order.total_amount, order.total_currency)}
            </span>
          </div>
          <div className="confirm-row">
            <span className="confirm-row-label">예약 상태</span>
            <span className="confirm-row-value" style={{ color: '#059669' }}>
              {order.payment_status?.awaiting_payment ? '결제 대기' : '확정'}
            </span>
          </div>
        </div>

        <Link to="/home" className="home-btn">홈으로 돌아가기</Link>
      </div>
      <BottomNav />
    </div>
  )
}
