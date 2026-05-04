import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import Navbar from '../components/layout/Navbar'
import { formatKrwPrice } from '../utils/currency'
import { createStayBooking, getStayDetail, getMapEmbedUrl } from '../api/accomodationApi'
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

function Stat({ label, value }) {
  return (
    <div className="acc-detail-stat">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default function AccomodationDetail() {
  const navigate = useNavigate()
  const location = useLocation()
  const { hotelId } = useParams()
  const [searchParams] = useSearchParams()
  const stateHotel = location.state?.hotel || null

  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = Number(searchParams.get('guests') || 1)
  const countryKey = searchParams.get('countryKey') || ''
  const destination = searchParams.get('destination') || stateHotel?.location || countryKey || '여행지'

  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeRoom, setActiveRoom] = useState(0)
  const [guestName, setGuestName] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [mapOpen, setMapOpen] = useState(false)
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
  const totalPrice = Number(hotel.price || 0)
  const nightlyPrice = totalPrice ? totalPrice / nights : 0
  const currency = hotel.currency || 'USD'
  const images = detail?.images?.map(img => img.url).filter(Boolean) || []
  const gallery = [hotel.image, ...images, pickHotelImage(hotelId, 900)].filter(Boolean)
  const uniqueGallery = [...new Set(gallery)].slice(0, 5)
  const facilities = detail?.facilities?.length
    ? detail.facilities
    : ['Free Wi-Fi', '24-hour front desk', 'Non-smoking rooms', 'Air conditioning', 'Luggage storage', 'Restaurant']

  const rooms = [
    {
      name: 'Standard Room',
      desc: '기본 객실 · 성인 투숙객에게 적합한 객실입니다.',
      price: nightlyPrice,
      policy: '무료취소 가능',
    },
    {
      name: 'Superior Room',
      desc: '여유 있는 공간과 업그레이드된 침구 구성을 제공합니다.',
      price: nightlyPrice ? Math.round(nightlyPrice * 1.18) : 0,
      policy: '조식 옵션',
    },
  ]

  const getMapQuery = () => {
    return [
      hotel.name || detail?.name,
      detail?.address,
      hotel.location || [detail?.zone, detail?.destination].filter(Boolean).join(' · ') || destination,
    ].filter(Boolean).join(' ')
  }

  const handleOpenMap = async () => {
    setMapOpen(true)
    setMapLoading(true)
    setMapError('')
    try {
      const lat = detail?.coordinates?.latitude
      const lng = detail?.coordinates?.longitude
      const data = await getMapEmbedUrl({ query: getMapQuery(), lat, lng })
      setMapUrls(data)
    } catch (err) {
      setMapError(err.message || '지도를 불러오지 못했습니다.')
    } finally {
      setMapLoading(false)
    }
  }

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
        checkIn,
        checkOut,
        guests,
        guestName: guestName.trim(),
        email: email.trim(),
        image: uniqueGallery[0],
      })
      sessionStorage.setItem('stay_booking', JSON.stringify(data))
      navigate(`/accomodation/confirmation/${data.booking_reference}`, { state: { booking: data } })
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
          <button onClick={() => navigate('/accomodation')}>숙소 검색으로 돌아가기</button>
        </div>
      ) : (
        <>
          <main className="acc-detail-wrap">
            <section className="acc-detail-head">
              <div>
                <div className="acc-detail-kicker">{hotel.location || [detail?.zone, detail?.destination].filter(Boolean).join(' · ') || destination}</div>
                <h1>{hotel.name || detail?.name || '숙소 상세'}</h1>
                <div className="acc-detail-meta">
                  {hotel.rating != null && <span className="acc-detail-stars">{'★'.repeat(Math.min(5, Math.floor(hotel.rating)))}</span>}
                  {detail?.category && <span>{detail.category}</span>}
                  {detail?.address && <span>{detail.address}</span>}
                </div>
              </div>
              <div className="acc-detail-actions">
                <button className="acc-detail-map-btn" onClick={handleOpenMap}>지도 확인</button>
                <button className="acc-detail-share">공유</button>
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
                  <h2>숙소 정보</h2>
                  <p>
                    {stripHtml(detail?.description) ||
                      '검색한 일정에 예약 가능한 숙소입니다. 객실 옵션과 요금은 Hotelbeds API에서 받은 검색 결과를 기준으로 표시됩니다.'}
                  </p>
                  <div className="acc-detail-stats">
                    <Stat label="체크인" value={formatDate(checkIn)} />
                    <Stat label="체크아웃" value={formatDate(checkOut)} />
                    <Stat label="숙박" value={`${nights}박`} />
                    <Stat label="인원" value={`성인 ${guests}명`} />
                  </div>
                </div>

                <div className="acc-detail-card">
                  <div className="acc-detail-section-head">
                    <h2>편의시설</h2>
                    <span>주요 제공 항목</span>
                  </div>
                  <div className="acc-detail-facilities">
                    {facilities.map((item, i) => (
                      <span key={`${item}-${i}`}>{item}</span>
                    ))}
                  </div>
                </div>

                <div className="acc-detail-card">
                  <div className="acc-detail-section-head">
                    <h2>객실 선택</h2>
                    <span>{checkIn && checkOut ? `${formatDate(checkIn)} - ${formatDate(checkOut)}` : '선택한 일정'}</span>
                  </div>
                  <div className="acc-detail-room-list">
                    {rooms.map((room, i) => (
                      <button
                        key={room.name}
                        className={`acc-detail-room${activeRoom === i ? ' active' : ''}`}
                        onClick={() => setActiveRoom(i)}
                      >
                        <div>
                          <strong>{room.name}</strong>
                          <span>{room.desc}</span>
                          <em>{room.policy}</em>
                        </div>
                        <div className="acc-detail-room-price">
                          {formatKrwPrice(room.price, currency)}
                          <span>/1박</span>
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
                    <strong>{formatKrwPrice(nightlyPrice, currency)}</strong>
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
                      <strong>{formatKrwPrice(totalPrice, currency)}</strong>
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
                  <p>세금 및 수수료는 실제 예약 단계에서 달라질 수 있습니다.</p>
                </div>
              </aside>
            </section>
          </main>

          {mapOpen && (
            <div className="acc-map-overlay" onClick={() => setMapOpen(false)}>
              <div className="acc-map-modal" onClick={e => e.stopPropagation()}>
                <div className="acc-map-head">
                  <div>
                    <strong>지도 확인</strong>
                    <span>{hotel.name || detail?.name || '숙소 위치'}</span>
                  </div>
                  <button onClick={() => setMapOpen(false)}>×</button>
                </div>
                <div className="acc-map-body">
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
                <div className="acc-map-footer">
                  <span>{detail?.address || hotel.location || destination}</span>
                  {mapUrls?.externalUrl && (
                    <button onClick={() => window.open(mapUrls.externalUrl, '_blank', 'noopener,noreferrer')}>새 탭에서 보기</button>
                  )}
                </div>
              </div>
            </div>
          )}

          <BottomNav />
        </>
      )}
    </div>
  )
}
