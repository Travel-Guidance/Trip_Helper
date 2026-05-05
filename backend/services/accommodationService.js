const { BASE_URL, getHeaders } = require('../config/rapidapi')
const { genStayBookingRef, sendStayBookingEmail } = require('./emailService')
const { normalizeCountryCode } = require('../data/hotelCoords')
const { getFallbackHotelImage } = require('./hotelImageService')
const { createError } = require('../utils/errors')

const COUNTRY_CITY = {
  JP: 'Tokyo',          TH: 'Bangkok',        FR: 'Paris',         ID: 'Bali',
  SG: 'Singapore',      US: 'New York',        GB: 'London',        CN: 'Beijing',
  HK: 'Hong Kong',      TW: 'Taipei',          VN: 'Hanoi',         MY: 'Kuala Lumpur',
  PH: 'Manila',         IN: 'Mumbai',          KH: 'Siem Reap',     NP: 'Kathmandu',
  LK: 'Colombo',        MM: 'Yangon',          LA: 'Vientiane',     MN: 'Ulaanbaatar',
  AE: 'Dubai',          QA: 'Doha',            TR: 'Istanbul',      IL: 'Tel Aviv',
  JO: 'Amman',          IT: 'Rome',            ES: 'Barcelona',     DE: 'Berlin',
  NL: 'Amsterdam',      CH: 'Zurich',          AT: 'Vienna',        PT: 'Lisbon',
  GR: 'Athens',         CZ: 'Prague',          HU: 'Budapest',      PL: 'Warsaw',
  HR: 'Dubrovnik',      NO: 'Oslo',            SE: 'Stockholm',     DK: 'Copenhagen',
  FI: 'Helsinki',       IS: 'Reykjavik',       IE: 'Dublin',        BE: 'Brussels',
  RU: 'Moscow',         CA: 'Vancouver',       MX: 'Cancun',        CU: 'Havana',
  PE: 'Lima',           BR: 'Rio de Janeiro',  AR: 'Buenos Aires',  AU: 'Sydney',
  NZ: 'Auckland',       EG: 'Cairo',           MA: 'Marrakech',     ZA: 'Cape Town',
  KE: 'Nairobi',        TZ: 'Zanzibar',
}

function getDefaultDates() {
  const ci = new Date()
  ci.setDate(ci.getDate() + 30)
  const co = new Date(ci)
  co.setDate(co.getDate() + 1)
  const fmt = (d) => d.toISOString().slice(0, 10)
  return { checkIn: fmt(ci), checkOut: fmt(co) }
}

async function searchDestId(cityName) {
  const url = `${BASE_URL}/api/v1/hotels/searchDestination?query=${encodeURIComponent(cityName)}`
  const res = await fetch(url, { method: 'GET', headers: getHeaders() })
  if (!res.ok) throw new Error(`Booking.com dest search ${res.status}`)
  const json = await res.json()
  const results = json.data || []
  const dest = results.find(r => r.search_type === 'city') || results[0]
  if (!dest) throw createError(`검색 가능한 여행지가 없습니다: ${cityName}`, 400)
  return { dest_id: dest.dest_id, search_type: dest.search_type }
}

async function searchStays({ checkIn, checkOut, guests = 2, country, countryCode }) {
  const code = normalizeCountryCode(countryCode || country)
  if (!code) throw createError(`지원하지 않는 여행지입니다: ${countryCode || country}`, 400)

  const cityName = COUNTRY_CITY[code]
  if (!cityName) throw createError(`지원하지 않는 여행지입니다: ${code}`, 400)

  const defaults = getDefaultDates()
  const ci = checkIn || defaults.checkIn
  const co = checkOut || defaults.checkOut

  const { dest_id, search_type } = await searchDestId(cityName)

  const params = new URLSearchParams({
    dest_id,
    search_type,
    arrival_date:   ci,
    departure_date: co,
    adults:         String(guests),
    room_qty:       '1',
    currency_code:  'USD',
    languagecode:   'en-us',
    page_number:    '1',
  })

  const res = await fetch(`${BASE_URL}/api/v1/hotels/searchHotels?${params}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Booking.com search ${res.status}: ${text}`)
  }

  const json = await res.json()
  const hotels = (json.data?.hotels || []).slice(0, 20)

  return hotels.map(h => {
    const p = h.property || {}
    return {
      id:       String(h.hotel_id),
      name:     p.name || '',
      location: [p.wishlistName, cityName].filter(Boolean).join(' · '),
      rating:   p.accuratePropertyClass || p.propertyClass || null,
      price:    p.priceBreakdown?.grossPrice?.value || 0,
      currency: p.priceBreakdown?.grossPrice?.currency || 'USD',
      image:    (p.photoUrls || [])[0] || getFallbackHotelImage(h.hotel_id),
      tag:      null,
    }
  })
}

async function getStayDetail(hotelId) {
  const id = String(hotelId || '').trim()
  if (!id) throw createError('호텔 ID가 필요합니다.', 400)

  const defaults = getDefaultDates()
  const params = new URLSearchParams({
    hotel_id:       id,
    arrival_date:   defaults.checkIn,
    departure_date: defaults.checkOut,
    adults:         '2',
    room_qty:       '1',
    currency_code:  'USD',
    languagecode:   'en-us',
  })

  const [detailRes, photosRes, facilitiesRes] = await Promise.all([
    fetch(`${BASE_URL}/api/v1/hotels/getHotelDetails?${params}`, { method: 'GET', headers: getHeaders() }),
    fetch(`${BASE_URL}/api/v1/hotels/getHotelPhotos?hotel_id=${id}`, { method: 'GET', headers: getHeaders() }),
    fetch(`${BASE_URL}/api/v1/hotels/getHotelFacilities?hotel_id=${id}`, { method: 'GET', headers: getHeaders() }),
  ])

  const detailJson = detailRes.ok ? await detailRes.json() : {}
  const photosJson = photosRes.ok ? await photosRes.json() : {}
  const facilitiesJson = facilitiesRes.ok ? await facilitiesRes.json() : {}

  const hotel = detailJson.data || {}

  const images = (photosJson.data || [])
    .flatMap(cat => cat.photos || [])
    .map(p => ({ url: p.url_original || p.url_max || p.url_square60 }))
    .filter(p => p.url)
    .slice(0, 12)

  const facilities = (facilitiesJson.data || [])
    .flatMap(cat => cat.facilities || [])
    .map(f => f.name)
    .filter(Boolean)
    .slice(0, 18)

  return {
    id:          id,
    name:        hotel.hotel_name || '',
    description: hotel.description || hotel.hotel_description || '',
    address:     hotel.address || '',
    city:        hotel.city || '',
    destination: hotel.country || '',
    zone:        hotel.district || hotel.city || '',
    rating:      hotel.stars ? parseInt(hotel.stars) : null,
    category:    hotel.accommodation_type_name || '',
    coordinates: (hotel.latitude && hotel.longitude)
      ? { latitude: hotel.latitude, longitude: hotel.longitude }
      : null,
    phones:      hotel.phone ? [hotel.phone] : [],
    emails:      hotel.email ? [hotel.email] : [],
    images,
    facilities,
  }
}

async function createMockStayBooking({ hotelCode, checkIn, checkOut, guests = 1, guestName, email, hotelName, location, image }) {
  if (!hotelCode || !checkIn || !checkOut || !email || !guestName) {
    throw createError('숙소 예약에 필요한 값이 누락되었습니다.', 400)
  }

  const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
  const bookingRef = genStayBookingRef()

  const booking = {
    id:                `stay_demo_${Math.random().toString(36).slice(2, 14)}`,
    booking_reference: bookingRef,
    status:            'confirmed',
    test_mode:         true,
    guest_name:        guestName,
    email,
    hotel: {
      id:       String(hotelCode),
      name:     hotelName || '',
      location: location || '',
      image,
    },
    check_in:       checkIn,
    check_out:      checkOut,
    nights,
    guests:         Number(guests),
    total_amount:   0,
    total_currency: 'USD',
    created_at:     new Date().toISOString(),
  }

  try {
    booking.email_sent = await sendStayBookingEmail({
      to: email,
      guestName,
      bookingRef,
      hotelName:  hotelName || '',
      location:   location || '',
      checkIn,
      checkOut,
      nights,
      guests,
      totalPrice: 0,
      currency:   'USD',
      image,
    })
  } catch (err) {
    console.error('Stay email error:', err.message)
    booking.email_sent = false
  }

  return booking
}

module.exports = { searchStays, getStayDetail, createMockStayBooking }
