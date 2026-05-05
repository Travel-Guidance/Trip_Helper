import { formatDate } from '../../utils/accommodationDetail'

export default function RoomSelection({
  roomOptions,
  selectedRoomId,
  onSelectRoom,
  uniqueGallery,
  roomFacilities,
  hasOffers,
  hasPreviousPrice,
  hotelTaxText,
  checkIn,
  checkOut,
  guests,
}) {
  return (
    <div className="acc-detail-card">
      <div className="acc-detail-section-head">
        <h2>객실 선택</h2>
        <span>{checkIn && checkOut ? `${formatDate(checkIn)} - ${formatDate(checkOut)}` : '선택한 일정'}</span>
      </div>
      <div className="acc-room-list">
        {roomOptions.map(room => (
          <button
            key={room.id}
            className={`acc-room-card${selectedRoomId === room.id ? ' selected' : ''}`}
            onClick={() => onSelectRoom(room.id)}
          >
            <span className="acc-room-selected">선택됨</span>
            <div className="acc-room-media">
              {(room.images?.length ? room.images : uniqueGallery).slice(0, 3).map((src, i) => (
                <img key={`${src}-room-${i}`} src={src} alt={`${room.name} ${i + 1}`} />
              ))}
            </div>
            <div className="acc-room-body">
              <div className="acc-room-copy">
                <strong>{room.name}</strong>
                {room.rateName && <p>{room.rateName}</p>}
                <div className="acc-room-meta">
                  <span>성인 {guests}명</span>
                  {room.periodText && <span>{room.periodText}</span>}
                  {room.badge && <span>{room.badge}</span>}
                  {roomOptions.length === 1 && !hasOffers && <span>검색 결과 기준 객실</span>}
                </div>
                {(room.amenities || roomFacilities).length > 0 && (
                  <div className="acc-room-facilities">
                    {(room.amenities || roomFacilities).map((item, i) => <span key={`${item}-room-${i}`}>{item}</span>)}
                  </div>
                )}
              </div>
              {room.price && (
                <div className="acc-room-price">
                  {hasPreviousPrice && <span className="acc-room-prev">{room.previousPrice}</span>}
                  <div className="acc-room-main-price">
                    <strong>{room.price}</strong>
                    <span>/1박</span>
                  </div>
                  {room.totalText && <em>총 {room.totalText}</em>}
                  {(room.taxText || hotelTaxText) && <small>{room.taxText || hotelTaxText}</small>}
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
