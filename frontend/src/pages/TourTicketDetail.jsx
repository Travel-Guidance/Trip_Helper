import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import Navbar from '../components/layout/Navbar'
import { API_BASE } from '../api/config'
import { getTourDetail } from '../api/tourApi'
import '../styles/tour.css'

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1533105079780-92b9be482077?w=1000&q=80',
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=1000&q=80',
  'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1000&q=80',
]

function typeLabel(type) {
  return String(type || '')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
}

export default function TourTicketDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { placeId } = useParams()
  const stateTour = location.state?.tour || null
  const [detail, setDetail] = useState(stateTour)
  const [loading, setLoading] = useState(!stateTour)
  const [error, setError] = useState('')
  const [mapUrls, setMapUrls] = useState(null)
  const [mapError, setMapError] = useState('')

  useEffect(() => {
    if (!placeId) return
    setLoading(!stateTour)
    getTourDetail(placeId)
      .then(data => {
        setDetail(prev => ({ ...(prev || {}), ...data }))
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || '상세 정보를 불러오지 못했습니다')
        setLoading(false)
      })
  }, [placeId, stateTour])

  const tour = useMemo(() => detail || stateTour || {}, [detail, stateTour])
  const photos = (tour.photos?.length ? tour.photos : [tour.photoUrl, ...FALLBACK_IMAGES]).filter(Boolean).slice(0, 4)
  const openLabel = tour.openNow === true ? '현재 운영 중' : tour.openNow === false ? '현재 운영 종료' : '운영시간 확인 필요'
  const types = (tour.types || []).filter(type => !['point_of_interest', 'establishment'].includes(type)).slice(0, 5)
  const reviews = (tour.reviews || []).slice(0, 10)

  useEffect(() => {
    const query = [tour.name, tour.address].filter(Boolean).join(' ')
    if (!query) return undefined

    const controller = new AbortController()
    const params = new URLSearchParams({ query })
    const lat = tour.coordinates?.latitude
    const lng = tour.coordinates?.longitude
    if (lat && lng) {
      params.set('lat', String(lat))
      params.set('lng', String(lng))
    }

    setMapError('')
    fetch(`${API_BASE}/maps/embed-url?${params.toString()}`, { signal: controller.signal })
      .then(r => r.json().then(data => {
        if (!r.ok || data.error) throw new Error(data.error || '지도를 불러오지 못했습니다')
        setMapUrls(data)
      }))
      .catch(err => {
        if (err.name !== 'AbortError') setMapError(err.message || '지도를 불러오지 못했습니다')
      })

    return () => controller.abort()
  }, [tour.address, tour.coordinates?.latitude, tour.coordinates?.longitude, tour.name])

  if (loading) {
    return (
      <div className="tour-detail-page">
        <div className="tour-detail-loading">투어 상세 정보를 불러오는 중...</div>
      </div>
    )
  }

  if (error && !tour.name) {
    return (
      <div className="tour-detail-page">
        <div className="tour-detail-loading">
          <strong>{error}</strong>
          <button onClick={() => navigate('/tour-ticket')}>목록으로 돌아가기</button>
        </div>
      </div>
    )
  }

  return (
    <div className="tour-detail-page">
      <Navbar />

      <main className="tour-detail-wrap">
        <section className="tour-detail-title">
          <div>
            <span>{tour.address || '해외 인기 명소'}</span>
            <h1>{tour.name}</h1>
            <p>{tour.rating ? `★ ${tour.rating} · 리뷰 ${Number(tour.reviewCount || 0).toLocaleString()}개` : '평점 정보 없음'}</p>
          </div>
          <button onClick={() => navigator.share?.({ title: tour.name, url: window.location.href })}>공유</button>
        </section>

        <section className={`tour-detail-gallery tour-detail-gallery--${photos.length}`}>
          {photos.map((src, i) => (
            <img key={`${src}-${i}`} src={src} alt={`${tour.name} ${i + 1}`} className={i === 0 ? 'main' : ''} />
          ))}
        </section>

        <section className="tour-detail-chip-grid">
          <div><strong>{tour.reservationLevel || '예약 권장'}</strong><span>방문 전 예약 상태 확인</span></div>
          <div><strong>{tour.costLevel || '입장료 가능성 있음'}</strong><span>금액은 공식 사이트 확인</span></div>
          <div><strong>{openLabel}</strong><span>Google Places 기준</span></div>
          <div><strong>{tour.reviewCount ? `${Number(tour.reviewCount).toLocaleString()}개 리뷰` : '리뷰 정보 없음'}</strong><span>방문자 반응 참고</span></div>
        </section>

        <section className="tour-detail-layout">
          <div className="tour-detail-main">
            <div className="tour-detail-card">
              <h2>상품 소개</h2>
              <p>
                {tour.editorialSummary ||
                  `${tour.name}은(는) 여행자가 많이 찾는 명소입니다. 방문 전 운영시간과 예약 필요 여부를 확인하면 더 안정적으로 일정을 잡을 수 있습니다.`}
              </p>
              <div className="tour-detail-tags">
                {types.map(type => <span key={type}>{typeLabel(type)}</span>)}
              </div>
            </div>

            <div className="tour-detail-card">
              <h2>방문 전 확인</h2>
              <div className="tour-detail-info-list">
                <div><span>주소</span><strong>{tour.address || '-'}</strong></div>
                <div><span>전화</span><strong>{tour.phoneNumber || '정보 없음'}</strong></div>
                <div><span>운영</span><strong>{openLabel}</strong></div>
                <div><span>티켓</span><strong>{tour.costLevel || '입장료 가능성 있음'}</strong></div>
                <div><span>공식 사이트</span><strong>{tour.websiteUri ? '제공됨' : '정보 없음'}</strong></div>
              </div>
              <div className="tour-detail-link-actions">
                <button
                  className="tour-detail-site-link"
                  disabled={!tour.websiteUri}
                  onClick={() => tour.websiteUri && window.open(tour.websiteUri, '_blank', 'noopener,noreferrer')}
                >
                  공식 사이트 보기
                </button>
                {tour.googleMapsUri && (
                  <button className="tour-detail-map-link" onClick={() => window.open(tour.googleMapsUri, '_blank', 'noopener,noreferrer')}>
                    Google Maps 보기
                  </button>
                )}
              </div>
            </div>

            <div className="tour-detail-card">
              <div className="tour-detail-map-head">
                <div>
                  <h2>위치 확인</h2>
                  <span>{tour.address || 'Google Maps 기준 위치'}</span>
                </div>
                {(mapUrls?.externalUrl || tour.googleMapsUri) && (
                  <button onClick={() => window.open(mapUrls?.externalUrl || tour.googleMapsUri, '_blank', 'noopener,noreferrer')}>
                    새 탭에서 보기
                  </button>
                )}
              </div>
              <div className="tour-detail-map">
                {mapError ? (
                  <div className="tour-detail-map-state">
                    <strong>{mapError}</strong>
                    <span>Google Maps API 키 설정 또는 명소 위치 정보를 확인해주세요.</span>
                  </div>
                ) : mapUrls?.embedUrl ? (
                  <iframe title={`${tour.name || '투어'} 위치 지도`} src={mapUrls.embedUrl} loading="lazy" allowFullScreen />
                ) : (
                  <div className="tour-detail-map-state">지도를 불러오는 중...</div>
                )}
              </div>
            </div>

            {!!tour.openingHours?.length && (
              <div className="tour-detail-card">
                <h2>운영시간</h2>
                <div className="tour-detail-hours">
                  {tour.openingHours.map(row => <span key={row}>{row}</span>)}
                </div>
              </div>
            )}
          </div>

          <aside className="tour-detail-side">
            <div className="tour-detail-book">
              <div className="tour-review-head">
                <span>Google 리뷰</span>
                <strong>{tour.rating ? `★ ${tour.rating}` : '리뷰'}</strong>
                <p>{tour.reviewCount ? `총 ${Number(tour.reviewCount).toLocaleString()}개 리뷰 중 일부입니다.` : '리뷰 정보가 부족합니다.'}</p>
              </div>
              {reviews.length ? (
                <div className="tour-review-list">
                  {reviews.map((review, i) => (
                    <article key={`${review.authorName}-${review.publishTime}-${i}`} className="tour-review-item">
                      <div>
                        {review.authorPhotoUri && <img src={review.authorPhotoUri} alt="" />}
                        <div>
                          {review.authorUri ? (
                            <a href={review.authorUri} target="_blank" rel="noreferrer">{review.authorName}</a>
                          ) : (
                            <b>{review.authorName}</b>
                          )}
                          <span>{review.rating ? `★ ${review.rating}` : '평점 없음'}{review.relativeTime ? ` · ${review.relativeTime}` : ''}</span>
                        </div>
                      </div>
                      <p>{review.text}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="tour-review-empty">표시할 리뷰가 없습니다.</div>
              )}
              {(tour.googleMapsUri || mapUrls?.externalUrl) && (
                <button
                  className="tour-review-more"
                  onClick={() => window.open(tour.googleMapsUri || mapUrls.externalUrl, '_blank', 'noopener,noreferrer')}
                >
                  더 많은 리뷰 보러가기
                </button>
              )}
            </div>
          </aside>
        </section>
      </main>

      <BottomNav />
    </div>
  )
}
