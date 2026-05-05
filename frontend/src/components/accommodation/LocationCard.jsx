export default function LocationCard({ available, loading, error, mapUrls, address }) {
  if (!available) return null

  return (
    <div className="acc-detail-card acc-detail-location-card">
      <h2>숙소 위치</h2>
      <div className="acc-detail-map-panel">
        {loading ? (
          <div className="acc-map-state">
            <div className="spinner" />
            지도를 불러오는 중...
          </div>
        ) : error ? (
          <div className="acc-map-state">
            <strong>{error}</strong>
            <span>Google Maps API 키 설정 또는 숙소 위치 정보를 확인해주세요.</span>
          </div>
        ) : (
          mapUrls?.embedUrl && <iframe title="숙소 위치 지도" src={mapUrls.embedUrl} loading="lazy" allowFullScreen />
        )}
      </div>
      <div className="acc-detail-address-row">
        <span>{address}</span>
        {mapUrls?.externalUrl && (
          <button onClick={() => window.open(mapUrls.externalUrl, '_blank', 'noopener,noreferrer')}>새 탭에서 보기</button>
        )}
      </div>
    </div>
  )
}
