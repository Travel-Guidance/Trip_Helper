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

export default function AccomodationConfirmation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { bookingRef } = useParams()
  const [booking, setBooking] = useState(location.state?.booking || null)

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
          <button onClick={() => navigate('/accomodation')}>숙소 검색으로 돌아가기</button>
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

        <button className="acc-confirm-home" onClick={() => navigate('/home')}>홈으로 돌아가기</button>
        <div className="acc-confirm-note">테스트 모드 - 실제 Hotelbeds 예약 및 결제가 이루어지지 않습니다</div>
      </main>
      <BottomNav />
    </div>
  )
}
