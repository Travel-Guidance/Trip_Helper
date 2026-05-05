import { formatDate } from '../../utils/accommodationDetail'
import { formatKrwPrice } from '../../utils/currency'

export default function BookingBox({
  selectedRoom,
  displayPrice,
  totalPrice,
  totalPriceText,
  currency,
  hotelTaxText,
  checkIn,
  checkOut,
  guests,
  guestName,
  email,
  booking,
  bookingError,
  onGuestNameChange,
  onEmailChange,
  onBooking,
}) {
  return (
    <aside className="acc-detail-side">
      <div className="acc-detail-bookbox">
        <div className="acc-detail-book-price">
          <span>최저가</span>
          <strong>{selectedRoom?.price || displayPrice}</strong>
          <em>/1박</em>
        </div>
        <div className="acc-detail-book-row">
          <span>일정</span>
          <strong>{formatDate(checkIn)} - {formatDate(checkOut)}</strong>
        </div>
        <div className="acc-detail-book-row">
          <span>인원</span>
          <strong>성인 {guests}명</strong>
        </div>
        {(selectedRoom?.totalText || totalPrice > 0) && (
          <div className="acc-detail-total">
            <span>총 결제 예상금액</span>
            <strong>{selectedRoom?.totalText || totalPriceText || formatKrwPrice(totalPrice, currency)}</strong>
          </div>
        )}
        <div className="acc-detail-book-form">
          <label>
            예약자 이름
            <input value={guestName} onChange={e => onGuestNameChange(e.target.value)} placeholder="홍길동" />
          </label>
          <label>
            이메일
            <input type="email" value={email} onChange={e => onEmailChange(e.target.value)} placeholder="guest@example.com" />
          </label>
        </div>
        {bookingError && <div className="acc-detail-book-error">{bookingError}</div>}
        <button disabled={booking} onClick={onBooking}>
          {booking ? '예약 처리 중...' : '예약하기'}
        </button>
        <p>{hotelTaxText || '세금 및 수수료는 실제 예약 단계에서 달라질 수 있습니다.'}</p>
      </div>
    </aside>
  )
}
