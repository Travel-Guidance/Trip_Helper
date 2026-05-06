export default function DetailHeader({ hotel, detail, address, destination, hotelUrl }) {
  return (
    <section className="acc-detail-head">
      <div>
        <div className="acc-detail-kicker">
          {hotel.location || [detail?.zone, detail?.destination].filter(Boolean).join(' · ') || destination}
        </div>
        <h1>{hotel.name || detail?.name || '숙소 상세'}</h1>
        <div className="acc-detail-meta">
          {hotel.reviewScore != null && (
            <span className="acc-detail-review">
              {Number(hotel.reviewScore).toFixed(1)}/10
              {hotel.reviewText && <b>{hotel.reviewText}</b>}
              {hotel.reviewCountText && <em>{hotel.reviewCountText}</em>}
            </span>
          )}
          {detail?.category && <span>{detail.category}</span>}
          {address && <span>{address}</span>}
        </div>
      </div>
      {hotelUrl && (
        <button className="acc-detail-link-btn" onClick={() => window.open(hotelUrl, '_blank', 'noopener,noreferrer')}>
          숙소 페이지 보기
        </button>
      )}
    </section>
  )
}
