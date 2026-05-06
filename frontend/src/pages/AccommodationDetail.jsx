import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import BookingBox from '../components/accommodation/BookingBox'
import DetailGallery from '../components/accommodation/DetailGallery'
import DetailHeader from '../components/accommodation/DetailHeader'
import FacilitiesCard from '../components/accommodation/FacilitiesCard'
import LocationCard from '../components/accommodation/LocationCard'
import OverviewCard from '../components/accommodation/OverviewCard'
import RoomSelection from '../components/accommodation/RoomSelection'
import {
  buildRoomOptions,
  cleanTotalText,
  formatAmenity,
  getHotelExternalUrl,
  parseKrwText,
  stripHtml,
} from '../utils/accommodationDetail'
import BottomNav from '../components/layout/BottomNav'
import Navbar from '../components/layout/Navbar'
import { formatKrwPrice } from '../utils/currency'
import { createStayBooking, getMapEmbedUrl, getStayDetail, getStayOffers } from '../api/accommodationApi'
import { pickHotelImage } from '../data/images'
import '../styles/accommodation.css'

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
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [guestName, setGuestName] = useState('')
  const [email, setEmail] = useState('')
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState('')
  const [selectedRoomId, setSelectedRoomId] = useState('standard')
  const [facilitiesOpen, setFacilitiesOpen] = useState(false)
  const [mapLoading, setMapLoading] = useState(false)
  const [mapError, setMapError] = useState('')
  const [mapUrls, setMapUrls] = useState(null)

  useEffect(() => {
    setLoading(true)
    getStayDetail(hotelId)
      .then(data => { setDetail(data); setLoading(false) })
      .catch(err => { setError(err.message || '숙소 정보를 불러오지 못했습니다.'); setLoading(false) })
  }, [hotelId])

  useEffect(() => {
    getStayOffers({ hotelId, checkIn, checkOut, guests })
      .then(data => setOffers(data))
      .catch(() => setOffers([]))
  }, [hotelId, checkIn, checkOut, guests])

  const hotel = useMemo(() => ({ ...(detail || {}), ...(stateHotel || {}) }), [detail, stateHotel])
  const nights = checkIn && checkOut ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)) : 1
  const nightlyPrice = Number(hotel.price || 0)
  const currency = hotel.currency || 'KRW'
  const images = detail?.images?.map(img => img.url).filter(Boolean) || []
  const uniqueGallery = [...new Set([hotel.image, ...images, pickHotelImage(hotelId, 900)].filter(Boolean))].slice(0, 5)
  const allFacilities = [...new Set((detail?.facilities?.length ? detail.facilities : hotel.amenities || []).filter(Boolean).map(formatAmenity))]
  const visibleFacilities = facilitiesOpen ? allFacilities : allFacilities.slice(0, 9)
  const roomFacilities = allFacilities.slice(0, 6)
  const displayPrice = hotel.displayPrice || formatKrwPrice(nightlyPrice, currency)
  const hasPreviousPrice = hotel.previousPrice && hotel.previousPrice !== displayPrice
  const totalPriceText = cleanTotalText(hotel.totalPriceText)
  const totalPrice = parseKrwText(totalPriceText) || (nightlyPrice ? nightlyPrice * nights : 0)
  const address = detail?.address || hotel.location || [detail?.zone, detail?.destination].filter(Boolean).join(' · ') || destination
  const description = stripHtml(detail?.description)
  const mapAvailable = Boolean(detail?.coordinates || address)
  const hotelUrl = getHotelExternalUrl(hotel, hotelId)

  const roomOptions = useMemo(() => buildRoomOptions({
    offers,
    hotel,
    detail,
    uniqueGallery,
    roomFacilities,
    currency,
  }), [offers, hotel, detail, uniqueGallery, roomFacilities, currency])
  const selectedRoom = roomOptions.find(room => room.id === selectedRoomId) || roomOptions[0]

  useEffect(() => {
    if (roomOptions.length > 0 && !roomOptions.some(room => room.id === selectedRoomId)) {
      setSelectedRoomId(roomOptions[0].id)
    }
  }, [roomOptions, selectedRoomId])

  useEffect(() => {
    if (!detail || !mapAvailable) return
    let cancelled = false
    setMapLoading(true)
    setMapError('')

    const query = [
      hotel.name || detail?.name,
      detail?.address,
      hotel.location || [detail?.zone, detail?.destination].filter(Boolean).join(' · ') || destination,
    ].filter(Boolean).join(' ')
    const lat = detail?.coordinates?.latitude
    const lng = detail?.coordinates?.longitude

    getMapEmbedUrl({ query, lat, lng })
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
        image: selectedRoom.images?.[0] || uniqueGallery[0],
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
            <DetailHeader hotel={hotel} detail={detail} address={address} destination={destination} hotelUrl={hotelUrl} />
            <DetailGallery images={uniqueGallery} hotelName={hotel.name || detail?.name} />

            <section className="acc-detail-grid">
              <div className="acc-detail-main">
                <OverviewCard description={description} checkIn={checkIn} checkOut={checkOut} nights={nights} guests={guests} />
                <FacilitiesCard
                  allFacilities={allFacilities}
                  visibleFacilities={visibleFacilities}
                  open={facilitiesOpen}
                  onToggle={() => setFacilitiesOpen(open => !open)}
                />
                <LocationCard available={mapAvailable} loading={mapLoading} error={mapError} mapUrls={mapUrls} address={address} />
                <RoomSelection
                  roomOptions={roomOptions}
                  selectedRoomId={selectedRoomId}
                  onSelectRoom={setSelectedRoomId}
                  uniqueGallery={uniqueGallery}
                  roomFacilities={roomFacilities}
                  hasOffers={offers.length > 0}
                  hasPreviousPrice={hasPreviousPrice}
                  hotelTaxText={hotel.taxText}
                  checkIn={checkIn}
                  checkOut={checkOut}
                  guests={guests}
                />
              </div>

              <BookingBox
                selectedRoom={selectedRoom}
                displayPrice={displayPrice}
                totalPrice={totalPrice}
                totalPriceText={totalPriceText}
                currency={currency}
                hotelTaxText={hotel.taxText}
                checkIn={checkIn}
                checkOut={checkOut}
                guests={guests}
                guestName={guestName}
                email={email}
                booking={booking}
                bookingError={bookingError}
                onGuestNameChange={setGuestName}
                onEmailChange={setEmail}
                onBooking={handleBooking}
              />
            </section>
          </main>

          <BottomNav />
        </>
      )}
    </div>
  )
}
