import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import Navbar from '../components/layout/Navbar'
import { formatKrwPrice } from '../utils/currency'
import { createStayBooking, getStayDetail, getMapEmbedUrl } from '../api/accommodationApi'
import { pickHotelImage } from '../data/images'
import '../styles/accommodation.css'

function formatDate(value) {
  if (!value) return '날짜 미정'
  const date = new Date(`${value}T00:00:00`)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

const AMENITY_LABELS = {
  spa: '스파',
  'parking available': '주차 가능',
  'free wifi': '무료 WiFi',
  restaurant: '레스토랑',
  'air conditioning': '에어컨',
  gym: '피트니스 센터',
  'pet friendly': '반려동물 동반 가능',
  pool: '수영장',
  bar: '바',
  'bar/lounge': '바/라운지',
  breakfast: '아침 식사',
  '24-hour front desk': '24시간 프런트 데스크',
  'non-smoking rooms': '금연 객실',
  'luggage storage': '짐 보관',
}

function formatAmenity(value) {
  const text = String(value || '').trim()
  return AMENITY_LABELS[text.toLowerCase()] || text
}

function cleanTotalText(value) {
  return String(value || '').replace(/^총\s*요금:\s*/i, '').trim()
}

function Stat({ label, value }) {
  return (
    <div className="acc-detail-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function AccommodationDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hotelId } = useParams()
  const [searchParams] = useSearchParams()
  const stateHotel = location.state?.hotel || null

  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = Number(searchParams.get('guests') || 1)
  const countryKey = searchParams.get('countryKey') || ''
  const countryCode = searchParams.get('countryCode') || countryKey
  const destination = searchParams.get('destination') || stateHotel?.location || countryKey || '여행지'

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guestName, setGuestName] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('standard')
  const [mapLoading, setMapLoading] = useState(false)
  const [mapError, setMapError] = useState('')
  const [mapUrls, setMapUrls] = useState(null)

  useEffect(() => {
    setLoading(true)
    getStayDetail(hotelId)
      .then(data => { setDetail(data); setLoading(false) })
      .catch(err => { setError(err.message || '숙소 정보를 불러오지 못했습니다.'); setLoading(false) })
  }, [hotelId])

  const hotel = useMemo(() => ({ ...(detail || {}), ...(stateHotel || {}) }), [detail, stateHotel])
  const nights = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 1
  const nightlyPrice = Number(hotel.price || 0)
  const totalPrice = nightlyPrice ? nightlyPrice * nights : 0
  const currency = hotel.currency || 'KRW'
  const images = detail?.images?.map(img => img.url).filter(Boolean) || []
  const gallery = [hotel.image, ...images, pickHotelImage(hotelId, 900)].filter(Boolean)
  const uniqueGallery = [...new Set(gallery)].slice(0, 5)
  const facilities = detail?.facilities?.length
    ? detail.facilities
    : hotel.amenities || []
  const visibleFacilities = facilities.filter(Boolean).map(formatAmenity).slice(0, 8)
  const roomFacilities = visibleFacilities.slice(0, 6)
  const displayPrice = hotel.displayPrice || formatKrwPrice(nightlyPrice, currency)
  const hasPreviousPrice = hotel.previousPrice && hotel.previousPrice !== displayPrice
  const totalPriceText = cleanTotalText(hotel.totalPriceText)
  const address = detail?.address || hotel.location || [detail?.zone, detail?.destination].filter(Boolean).join(' · ') || destination
  const description = stripHtml(detail?.description)
  const mapAvailable = Boolean(detail?.coordinates || address)
  const roomOptions = [{
    id: 'standard',
    name: hotel.name || detail?.name || '객실',
    price: displayPrice,
    previousPrice: hotel.previousPrice,
    totalText: totalPriceText,
    taxText: hotel.taxText,
    periodText: hotel.pricePeriodText,
  }]
  const selectedRoom = roomOptions.find(room => room.id === selectedRoomId) || roomOptions[0]

  const getMapQuery = () => {
    return [
      hotel.name || detail?.name,
      detail?.address,
      hotel.location || [detail?.zone, detail?.destination].filter(Boolean).join(' · ') || destination,
    ].filter(Boolean).join(' ')
  }

  useEffect(() => {
    if (!detail || !mapAvailable) return
    let cancelled = false
    setMapLoading(true)
    setMapError('')
    const lat = detail?.coordinates?.latitude
    const lng = detail?.coordinates?.longitude

    getMapEmbedUrl({ query: getMapQuery(), lat, lng })
      .then(data => { if (!cancelled) setMapUrls(data) })
      .catch(err => { if (!cancelled) setMapError(err.message || '지도를 불러오지 못했습니다.') })
      .finally(() => { if (!cancelled) setMapLoading(false) })

    return () => { cancelled = true }
  }, [detail, mapAvailable, hotel.name, hotel.location, destination])

  const handleBooking = async () => {
    if (!guestName.trim() || !email.trim()) {
      setBookingError('예약자 이름과 이메일을 입력해주세요.')
      return
    }
    setBooking(true)
    setBookingError('')
    try {
      const data = await createStayBooking({
        hotelCode: hotelId,
        hotelName: hotel.name || detail?.name,
        location: hotel.location || [detail?.zone, detail?.destination].filter(Boolean).join(' · ') || destination,
        country: countryKey,
        countryCode,
        checkIn,
        checkOut,
        guests,
        roomName: selectedRoom.name,
        guestName: guestName.trim(),
        email: email.trim(),
        image: uniqueGallery[0],
      })
      sessionStorage.setItem('stay_booking', JSON.stringify(data))
      navigate(`/accommodation/confirmation/${data.booking_reference}`, { state: { booking: data } })
    } catch (err) {
      setBookingError(err.message || '숙소 예약 처리 중 오류가 발생했습니다.')
    } finally {
      setBooking(false)
    }
  }

  return (
    <div className="acc-detail-page">
      <Navbar />

      {loading ? (
        <div className="acc-detail-loading">
          <div className="spinner" />
          숙소 상세 정보를 불러오는 중...
        </div>
      ) : error && !stateHotel ? (
        <div className="acc-detail-error">
          <strong>숙소 정보를 불러올 수 없습니다.</strong>
          <span>{error}</span>
          <button onClick={() => navigate('/accommodation')}>숙소 검색으로 돌아가기</button>
        </div>
      ) : (
        <>
          <main className="acc-detail-wrap">
            <section className="acc-detail-head">
              <div>
                <div className="acc-detail-kicker">{hotel.location || [detail?.zone, detail?.destination].filter(Boolean).join(' · ') || destination}</div>
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
            </section>

            <section className={`acc-detail-gallery acc-detail-gallery--count-${uniqueGallery.length}`}>
              {uniqueGallery.map((src, i) => (
                <img key={`${src}-${i}`} src={src} alt={`${hotel.name || 'hotel'} ${i + 1}`} className={i === 0 ? 'main' : ''} />
              ))}
            </section>

            <section className="acc-detail-grid">
              <div className="acc-detail-main">
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

                {visibleFacilities.length > 0 && (
                <div className="acc-detail-card">
                  <div className="acc-detail-section-head">
                    <h2>편의시설</h2>
                    <span>주요 제공 항목</span>
                  </div>
                  <div className="acc-detail-facilities">
                    {visibleFacilities.map((item, i) => (
                      <span key={`${item}-${i}`}>{item}</span>
                    ))}
                  </div>
                </div>
                )}

                {mapAvailable && (
                <div className="acc-detail-card acc-detail-location-card">
                  <h2>숙소 위치</h2>
                  <div className="acc-detail-map-panel">
                    {mapLoading ? (
                      <div className="acc-map-state">
                        <div className="spinner" />
                        지도를 불러오는 중...
                      </div>
                    ) : mapError ? (
                      <div className="acc-map-state">
                        <strong>{mapError}</strong>
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
                )}

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
                        onClick={() => setSelectedRoomId(room.id)}
                      >
                        <span className="acc-room-selected">선택됨</span>
                        <div className="acc-room-media">
                          {uniqueGallery.slice(0, 3).map((src, i) => (
                            <img key={`${src}-room-${i}`} src={src} alt={`${room.name} ${i + 1}`} />
                          ))}
                        </div>
                        <div className="acc-room-body">
                          <div className="acc-room-copy">
                            <strong>{room.name}</strong>
                            <div className="acc-room-meta">
                              <span>성인 {guests}명</span>
                              {room.periodText && <span>{room.periodText}</span>}
                            </div>
                            {roomFacilities.length > 0 && (
                              <div className="acc-room-facilities">
                                {roomFacilities.map((item, i) => <span key={`${item}-room-${i}`}>{item}</span>)}
                              </div>
                            )}
                          </div>
                          {nightlyPrice > 0 && (
                            <div className="acc-room-price">
                              {hasPreviousPrice && <span className="acc-room-prev">{room.previousPrice}</span>}
                              <div className="acc-room-main-price">
                                <strong>{room.price}</strong>
                                <span>/1박</span>
                              </div>
                              {room.totalText && <em>총 {room.totalText}</em>}
                              {room.taxText && <small>{room.taxText}</small>}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <aside className="acc-detail-side">
                <div className="acc-detail-bookbox">
                  <div className="acc-detail-book-price">
                    <span>최저가</span>
                    <strong>{displayPrice}</strong>
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
                  {totalPrice > 0 && (
                    <div className="acc-detail-total">
                      <span>총 결제 예상금액</span>
                      <strong>{totalPriceText || formatKrwPrice(totalPrice, currency)}</strong>
                    </div>
                  )}
                  <div className="acc-detail-book-form">
                    <label>
                      예약자 이름
                      <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="홍길동" />
                    </label>
                    <label>
                      이메일
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="guest@example.com" />
                    </label>
                  </div>
                  {bookingError && <div className="acc-detail-book-error">{bookingError}</div>}
                  <button disabled={booking} onClick={handleBooking}>
                    {booking ? '예약 처리 중...' : '예약하기'}
                  </button>
                  <p>{hotel.taxText || '세금 및 수수료는 실제 예약 단계에서 달라질 수 있습니다.'}</p>
                </div>
              </aside>
            </section>
          </main>

          <BottomNav />
        </>
      )}
    </div>
  )
}




