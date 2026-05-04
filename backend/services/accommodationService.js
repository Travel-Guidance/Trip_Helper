const { BASE_URL, getHeaders } = require('../config/hotelbeds')
const { genStayBookingRef, sendStayBookingEmail } = require('./emailService')
const { getHotelCoords } = require('../data/hotelCoords')
const {
  buildHotelImages,
  fetchHotelImages,
  getFallbackHotelImage,
} = require('./hotelImageService')
const { createError } = require('../utils/errors')

function getDefaultDates() {
  const ci = new Date()
  ci.setDate(ci.getDate() + 30)
  const co = new Date(ci)
  co.setDate(co.getDate() + 1)
  const fmt = (d) => d.toISOString().slice(0, 10)
  return { checkIn: fmt(ci), checkOut: fmt(co) }
}

async function searchStays({ checkIn, checkOut, guests = 2, country, countryCode }) {
  const coords = getHotelCoords(countryCode || country)
  if (!coords) throw createError(`지원하지 않는 여행지입니다: ${countryCode || country}`, 400)

  const defaults = getDefaultDates()
  const ci = checkIn || defaults.checkIn
  const co = checkOut || defaults.checkOut

  const body = JSON.stringify({
    stay: { checkIn: ci, checkOut: co },
    occupancies: [{ rooms: 1, adults: Number(guests), children: 0 }],
    geolocation: {
      latitude:  coords.latitude,
      longitude: coords.longitude,
      radius:    coords.radius,
      unit:      'km',
    },
    filter: { maxHotels: 20 },
  })

  const res = await fetch(`${BASE_URL}/hotel-api/1.0/hotels`, {
    method:  'POST',
    headers: getHeaders(),
    body,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Hotelbeds ${res.status}: ${text}`)
  }

  const json = await res.json()
  const hotels = (json.hotels?.hotels || []).slice(0, 20)
  if (!hotels.length) return []

  const codes = hotels.map(h => String(h.code))
  const imageMap = await fetchHotelImages(codes)

  return hotels.map((hotel) => ({
    id:       String(hotel.code),
    name:     hotel.name,
    location: [hotel.zoneName, hotel.destinationName].filter(Boolean).join(' · '),
    rating:   hotel.categoryCode ? parseInt(hotel.categoryCode) : null,
    price:    parseFloat(hotel.minRate || 0),
    currency: hotel.currency || 'USD',
    image:    imageMap[String(hotel.code)] || getFallbackHotelImage(hotel.code),
    tag:      null,
  }))
}

function buildAvailabilityBody({ checkIn, checkOut, guests = 2, country, countryCode, hotelCode }) {
  const defaults = getDefaultDates()
  const ci = checkIn || defaults.checkIn
  const co = checkOut || defaults.checkOut
  const body = {
    stay: { checkIn: ci, checkOut: co },
    occupancies: [{ rooms: 1, adults: Number(guests), children: 0 }],
    filter: { maxHotels: 20 },
  }

  if (hotelCode) {
    body.hotels = { hotel: [Number(hotelCode)] }
    body.filter.maxHotels = 1
    return body
  }

  const coords = getHotelCoords(countryCode || country)
  if (!coords) throw createError(`지원하지 않는 여행지입니다: ${countryCode || country}`, 400)
  body.geolocation = {
    latitude:  coords.latitude,
    longitude: coords.longitude,
    radius:    coords.radius,
    unit:      'km',
  }
  return body
}

async function fetchAvailableHotels({ checkIn, checkOut, guests = 2, country, countryCode, hotelCode }) {
  const res = await fetch(`${BASE_URL}/hotel-api/1.0/hotels`, {
    method:  'POST',
    headers: getHeaders(),
    body:    JSON.stringify(buildAvailabilityBody({ checkIn, checkOut, guests, country, countryCode, hotelCode })),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Hotelbeds ${res.status}: ${text}`)
  }

  const json = await res.json()
  return json.hotels?.hotels || []
}

async function createMockStayBooking({ hotelCode, checkIn, checkOut, guests = 1, country, countryCode, guestName, email, hotelName, location, image }) {
  if (!hotelCode || !checkIn || !checkOut || !email || !guestName) {
    throw createError('숙소 예약에 필요한 값이 누락되었습니다.', 400)
  }

  const hotels = await fetchAvailableHotels({ checkIn, checkOut, guests, country, countryCode, hotelCode })
  const availableHotel = hotels.find(h => String(h.code) === String(hotelCode))

  if (!availableHotel) throw createError('선택한 일정에는 예약 가능한 객실이 없습니다.', 409)

  const nights = Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
  const bookingRef = genStayBookingRef()
  const price = parseFloat(availableHotel.minRate || 0)
  const currency = availableHotel.currency || 'USD'
  const resolvedHotelName = availableHotel.name || hotelName || ''
  const resolvedLocation = [availableHotel.zoneName, availableHotel.destinationName].filter(Boolean).join(' · ') || location || ''

  const booking = {
    id: `stay_demo_${Math.random().toString(36).slice(2, 14)}`,
    booking_reference: bookingRef,
    status: 'confirmed',
    test_mode: true,
    guest_name: guestName,
    email,
    hotel: {
      id:       String(availableHotel.code || hotelCode),
      name:     resolvedHotelName,
      location: resolvedLocation,
      image,
    },
    check_in:       checkIn,
    check_out:      checkOut,
    nights,
    guests:         Number(guests),
    total_amount:   price,
    total_currency: currency,
    created_at:     new Date().toISOString(),
  }

  try {
    booking.email_sent = await sendStayBookingEmail({
      to: email,
      guestName,
      bookingRef,
      hotelName: resolvedHotelName,
      location: resolvedLocation,
      checkIn,
      checkOut,
      nights,
      guests,
      totalPrice: price,
      currency,
      image,
    })
  } catch (err) {
    console.error('Stay email error:', err.message)
    booking.email_sent = false
  }

  return booking
}

async function getStayDetail(hotelCode) {
  const code = String(hotelCode || '').trim()
  if (!code) throw createError('호텔 코드가 필요합니다.', 400)

  const qs = new URLSearchParams({ language: 'ENG', useSecondaryLanguage: 'false' })

  let res = await fetch(
    `${BASE_URL}/hotel-content-api/1.0/hotels/${encodeURIComponent(code)}/details?${qs}`,
    { method: 'GET', headers: getHeaders() }
  )

  if (!res.ok) {
    const listQs = new URLSearchParams({ codes: code, language: 'ENG', from: '1', to: '1' })
    res = await fetch(
      `${BASE_URL}/hotel-content-api/1.0/hotels?${listQs}`,
      { method: 'GET', headers: getHeaders() }
    )
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`Hotelbeds ${res.status}: ${text}`)
    }
  }

  const json = await res.json()
  const hotel = json.hotel || json.hotels?.[0] || json
  const facilities = (hotel.facilities || [])
    .map(f => f.description?.content || f.facilityName || f.facilityCode)
    .filter(Boolean)
    .slice(0, 18)

  return {
    id:          String(hotel.code || code),
    name:        hotel.name?.content || hotel.name || '',
    description: hotel.description?.content || '',
    address:     hotel.address?.content || '',
    city:        hotel.city?.content || hotel.city || '',
    destination: hotel.destinationName || hotel.destination?.name?.content || '',
    zone:        hotel.zoneName || '',
    rating:      hotel.categoryCode ? parseInt(hotel.categoryCode) : null,
    category:    hotel.categoryName || hotel.categoryCode || '',
    coordinates: hotel.coordinates || null,
    phones:      (hotel.phones || []).map(p => p.phoneNumber).filter(Boolean),
    emails:      (hotel.emails || []).map(e => e.email).filter(Boolean),
    images:      buildHotelImages(hotel, code),
    facilities,
  }
}

module.exports = { searchStays, getStayDetail, createMockStayBooking }
