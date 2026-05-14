import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Navbar from '../components/layout/Navbar'
import BottomNav from '../components/layout/BottomNav'
import { formatKrwPrice } from '../utils/currency'
import '../styles/accommodation.css'

function formatDate(value) {
  if (!value) return '-'
  const date = new Date(`${value}T00:00:00`)
  return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })
}

function Row({ label, value, strong }) {
  return (
    <div className="acc-confirm-row">
      <span>{label}</span>
      <strong className={strong ? 'strong' : ''}>{value}</strong>
    </div>
  )
}

function readQueueFromStorage() {
  try {
    const queue = JSON.parse(sessionStorage.getItem('accom_booking_queue') || 'null')
    const idx = Number(sessionStorage.getItem('accom_booking_index') || '0')
    return queue ? { items: queue, index: idx } : null
  } catch { return null }
}

export default function AccommodationConfirmation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { bookingRef } = useParams()
  const [booking, setBooking] = useState(location.state?.booking || null)
  const [bookingQueue, setBookingQueue] = useState(() => readQueueFromStorage())

  const remainingItems = bookingQueue
    ? bookingQueue.items.slice(bookingQueue.index + 1)
    : []

  const goNextBooking = () => {
    const current = readQueueFromStorage()
    if (!current) return
    const nextIndex = current.index + 1
    if (nextIndex >= current.items.length) {
      const returnUrl = sessionStorage.getItem('accom_return_url') || '/accommodation'
      sessionStorage.removeItem('accom_booking_queue')
      sessionStorage.removeItem('accom_booking_index')
      sessionStorage.removeItem('accom_return_url')
      sessionStorage.removeItem('accom_booking_source')
      navigate(returnUrl)
      return
    }
    sessionStorage.setItem('accom_booking_index', String(nextIndex))
    setBookingQueue({ items: current.items, index: nextIndex })
    const { name: _n, ...next } = current.items[nextIndex]
    navigate(`/accommodation/results?${new URLSearchParams(next)}`)
  }

  useEffect(() => {
    setBookingQueue(readQueueFromStorage())
  }, [bookingRef])

  useEffect(() => {
    if (booking) return
    try {
      const saved = JSON.parse(sessionStorage.getItem('stay_booking') || 'null')
      if (saved?.booking_reference === bookingRef) setBooking(saved)
    } catch {}
  }, [booking, bookingRef])

  if (!booking) {
    return (
      <div className="acc-confirm-page">
        <Navbar />
        <div className="acc-confirm-empty">
          <strong>예약 정보를 찾을 수 없습니다.</strong>
          <button onClick={() => navigate('/accommodation')}>숙소 검색으로 돌아가기</button>
        </div>
      </div>
    )
  }

  return (
    <div className="acc-confirm-page">
      <Navbar />
      <main className="acc-confirm-wrap">
        <div className="acc-confirm-icon">✓</div>
        <h1>예약이 완료되었습니다!</h1>
        <p className="acc-confirm-sub">
          {booking.email_sent
            ? '예약 확인 이메일이 발송되었습니다. 아래 예약 번호를 저장해주세요.'
            : '예약번호가 발급되었습니다. 메일 설정을 확인하면 확인 이메일도 발송됩니다.'}
        </p>

        <section className="acc-confirm-card">
          {booking.hotel?.image && <img className="acc-confirm-img" src={booking.hotel.image} alt={booking.hotel.name} />}
          <div className="acc-confirm-ref-label">예약 번호</div>
          <div className="acc-confirm-ref">{booking.booking_reference}</div>

          <div className="acc-confirm-section-title">숙소 정보</div>
          <Row label="숙소" value={booking.hotel?.name || '-'} strong />
          <Row label="지역" value={booking.hotel?.location || '-'} strong />
          <Row label="일정" value={`${formatDate(booking.check_in)} - ${formatDate(booking.check_out)}`} strong />
          <Row label="숙박" value={`${booking.nights}박 · 성인 ${booking.guests}명`} strong />
        </section>

        <section className="acc-confirm-card">
          <Row label="예약자" value={booking.guest_name} strong />
          <Row label="이메일" value={booking.email} strong />
          <Row label="결제 금액" value={formatKrwPrice(booking.total_amount, booking.total_currency)} strong />
          <Row label="예약 상태" value="확정" strong />
        </section>

        {remainingItems.length > 0 && (
          <div className="acc-confirm-queue">
            <p className="acc-confirm-queue-title">아직 예약하지 않은 숙소 ({remainingItems.length}곳)</p>
            <ul className="acc-confirm-queue-list">
              {remainingItems.map((item, i) => (
                <li key={i}>{item.name}</li>
              ))}
            </ul>
            <button className="acc-confirm-next-booking" onClick={goNextBooking}>
              다음 숙소 예약하기 → {remainingItems[0]?.name}
            </button>
          </div>
        )}

        <button className="acc-confirm-home" onClick={() => navigate('/home')}>홈으로 돌아가기</button>
        <div className="acc-confirm-note">테스트 모드 - 실제 Hotelbeds 예약 및 결제가 이루어지지 않습니다</div>
      </main>
      <BottomNav />
    </div>
  )
}
