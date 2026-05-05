export default function FacilitiesCard({ allFacilities, visibleFacilities, open, onToggle }) {
  if (allFacilities.length === 0) return null

  return (
    <div className="acc-detail-card">
      <div className="acc-detail-section-head">
        <h2>편의시설</h2>
        <span>{open ? `전체 ${allFacilities.length}개` : '주요 제공 항목'}</span>
      </div>
      <div className="acc-detail-facilities">
        {visibleFacilities.map((item, i) => (
          <span key={`${item}-${i}`}>{item}</span>
        ))}
      </div>
      {allFacilities.length > 9 && (
        <button className="acc-facilities-more" onClick={onToggle}>
          {open ? '접기' : `더보기 ${allFacilities.length - 9}개`}
        </button>
      )}
    </div>
  )
}
