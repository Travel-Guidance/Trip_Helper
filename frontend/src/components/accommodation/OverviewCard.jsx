import { formatDate } from '../../utils/accommodationDetail'

function Stat({ label, value }) {
  return (
    <div className="acc-detail-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function OverviewCard({ description, checkIn, checkOut, nights, guests }) {
  return (
    <div className="acc-detail-card acc-detail-overview">
      <h2>{description ? '숙소 소개' : '숙소 정보'}</h2>
      {description && <p>{description}</p>}
      <div className="acc-detail-stats">
        <Stat label="체크인" value={formatDate(checkIn)} />
        <Stat label="체크아웃" value={formatDate(checkOut)} />
        <Stat label="숙박" value={`${nights}박`} />
        <Stat label="인원" value={`성인 ${guests}명`} />
      </div>
    </div>
  )
}
