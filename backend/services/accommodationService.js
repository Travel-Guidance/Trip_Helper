const { BASE_URL, getHeaders } = require('../config/rapidapi')
const { genStayBookingRef, sendStayBookingEmail } = require('./emailService')
const { normalizeCountryCode } = require('../data/hotelCoords')
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

const HOTEL_DOMAIN = 'KR'
const HOTEL_LOCALE = 'ko_KR'

function getDefaultDates() {
  const ci = new Date()
  ci.setDate(ci.getDate() + 30)
  const co = new Date(ci)
  co.setDate(co.getDate() + 1)
  const fmt = (d) => d.toISOString().slice(0, 10)
  return { checkIn: fmt(ci), checkOut: fmt(co) }
}

const destIdCache = {}

async function searchDestId(cityName) {
  if (destIdCache[cityName]) return destIdCache[cityName]
  const params = new URLSearchParams({
    query: cityName,
    locale: HOTEL_LOCALE,
    domain: HOTEL_DOMAIN,
  })
  const url = `${BASE_URL}/v2/regions?${params}`
  const res = await fetch(url, { method: 'GET', headers: getHeaders() })
  if (!res.ok) {
    const body = await res.text()
    console.error(`[Hotels.com] locations ${res.status}:`, body)
    throw new Error(`Hotels.com location search ${res.status}`)
  }
  const json = await res.json()
  const results = json.data || json.results || json.locations || []
  const dest = results.find(r => r.type === 'CITY') || results[0]
  if (!dest) throw createError(`검색 가능한 여행지가 없습니다: ${cityName}`, 400)
  const result = {
    destId: String(dest.gaiaId || dest.dest_id || dest.destId || dest.essId?.sourceId || ''),
    name: dest.regionNames?.primaryDisplayName || dest.regionNames?.shortName || cityName,
  }
  if (!result.destId) throw createError(`검색 가능한 여행지가 없습니다: ${cityName}`, 400)
  destIdCache[cityName] = result
  return result
}

function firstText(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value[0]) return String(value[0]).trim()
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (value?.text) return String(value.text).trim()
    if (value?.value) return String(value.value).trim()
  }
  return ''
}

function firstNumber(...values) {
  for (const value of values) {
    const num = Number(String(value ?? '').replace(/[^\d.]/g, ''))
    if (Number.isFinite(num) && num > 0) return num
  }
  return 0
}

function pickImage(value) {
  const candidates = [
    value?.mediaSection?.media?.[0]?.url,
    value?.propertyImage?.image?.url,
    value?.propertyImage?.url,
    value?.image?.url,
    value?.image?.source,
    value?.image?.urlTemplate,
    value?.media?.url,
    value?.media?.url,
    value?.cardLink?.resource?.value,
    value?.propertyImage?.fallbackImage?.url,
    value?.propertyGallery?.images?.[0]?.image?.url,
    value?.images?.[0]?.url,
  ]
  return firstText(...candidates)
}

function collectAmenityTexts(items) {
  const result = []
  const visit = (item) => {
    if (!item) return
    if (typeof item === 'string') {
      result.push(item)
      return
    }
    if (Array.isArray(item)) {
      item.forEach(visit)
      return
    }
    const text = firstText(item.text, item.name)
    if (text) result.push(text)
    visit(item.items)
    visit(item.contents)
    visit(item.sections)
  }
  visit(items)
  return [...new Set(result)].filter(Boolean)
}

function extractRating(value) {
  return firstNumber(
    value?.star,
    value?.starRating,
    value?.propertyClass,
    value?.guestRating?.rating,
    value?.reviews?.score,
    value?.reviews?.score?.value,
    value?.guestReviews?.rating,
    value?.reviewInfo?.summary?.overallScoreWithDescriptionA11y?.value,
  )
}

function findDisplayPrice(priceSummary, role) {
  return firstText(
    priceSummary?.displayPrices?.find(item => item.role === role)?.price?.formatted,
  )
}

function findDisplayMessage(priceSummary, state) {
  return firstText(
    priceSummary?.displayPrices?.find(item => item.state === state)?.value,
  )
}

function normalizeHotelCard(card, cityName) {
  const leadPrice = card.price?.priceSummary?.displayPrices?.find(item => item.role === 'LEAD')
  const priceSummary = card.price?.priceSummary
  const id = firstText(
    card.hotelId,
    card.hotel_id,
    card.id,
    card.propertyId,
    card.property_id,
    card.property?.id,
    card.hotel?.id,
    card.cardLink?.resource?.value?.match(/ho(\d+)/)?.[1],
  )
  const name = firstText(
    card.name,
    card.title,
    card.property?.name,
    card.hotel?.name,
    card.nameSection?.heading,
    card.headingSection?.heading,
    card.propertyName,
    card.summary?.name,
  )
  if (!id || !name) return null

  const price = firstNumber(
    priceSummary?.definition?.displayPrice,
    leadPrice?.price?.formatted,
    card.price?.lead?.amount,
    card.price?.lead?.formatted?.replace(/[^\d.]/g, ''),
    card.price?.displayPrice?.amount,
    card.price?.price?.amount,
    card.price?.amount,
    card.price?.current,
    card.priceInfo?.price?.amount,
    card.priceInfo?.displayPrice?.amount,
    card.price?.displayMessages?.[0]?.lineItems?.[0]?.price?.formatted?.replace(/[^\d.]/g, ''),
    card.price?.options?.[0]?.formattedDisplayPrice?.replace(/[^\d.]/g, ''),
  )
  const reviewPhrases = Array.isArray(card.guestRating?.phrases) ? card.guestRating.phrases : []
  const priceMessages = (priceSummary?.priceMessaging || [])
    .map(item => firstText(item?.value))
    .filter(Boolean)

  return {
    id,
    name,
    location: firstText(
      card.messages?.[0],
      card.neighborhood?.name,
      card.location?.text,
      card.location?.address?.city,
      card.destinationInfo?.distanceFromDestination?.unit,
      card.destinationInfo?.distanceFromDestination?.value,
      cityName,
    ),
    rating: null,
    reviewScore: firstNumber(card.guestRating?.rating, card.reviews?.score, card.reviews?.score?.value) || null,
    reviewText: firstText(reviewPhrases[0], card.guestRating?.ratingText),
    reviewCountText: firstText(reviewPhrases[1]),
    starRating: firstNumber(card.star, card.starRating, card.propertyClass) || null,
    price,
    currency: 'KRW',
    displayPrice: findDisplayPrice(priceSummary, 'LEAD') || firstText(priceSummary?.definition?.displayPrice),
    previousPrice: findDisplayPrice(priceSummary, 'STRIKEOUT') || firstText(priceSummary?.definition?.strikeOut),
    totalPriceText: findDisplayMessage(priceSummary, 'BREAKOUT_TYPE_SECONDARY_PRICE'),
    taxText: findDisplayMessage(priceSummary, 'BREAKOUT_TYPE_TAX_AND_FEE_CLARIFY'),
    pricePeriodText: priceMessages.join(' · '),
    priceBadge: firstText(card.price?.badge?.text, card.price?.standardBadge?.text),
    image: pickImage(card),
    amenities: Array.isArray(card.short_amenities) ? card.short_amenities : [],
    tag: null,
  }
}

async function searchStays({ checkIn, checkOut, guests = 2, country, countryCode }) {
  const code = normalizeCountryCode(countryCode || country)
  if (!code) throw createError(`지원하지 않는 여행지입니다: ${countryCode || country}`, 400)

  const cityName = COUNTRY_CITY[code]
  if (!cityName) throw createError(`지원하지 않는 여행지입니다: ${code}`, 400)

  const defaults = getDefaultDates()
  const ci = checkIn || defaults.checkIn
  const co = checkOut || defaults.checkOut

  const { destId } = await searchDestId(cityName)

  const params = new URLSearchParams({
    domain:        HOTEL_DOMAIN,
    locale:        HOTEL_LOCALE,
    region_id:     destId,
    checkin_date:  ci,
    checkout_date: co,
    adults_number: String(guests),
    children_ages: '0',
    sort_order:    'RECOMMENDED',
    page_number:   '1',
  })

  const res = await fetch(`${BASE_URL}/v3/hotels/search?${params}`, {
    method: 'GET',
    headers: getHeaders(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Hotels.com search ${res.status}: ${text}`)
  }

  const json = await res.json()
  const listings = [
    json.data?.hotels,
    json.data?.properties,
    json.data?.propertySearchListings,
    json.hotels,
    json.properties,
    json.propertySearchListings,
    json.results,
  ].find(Array.isArray) || []

  return listings
    .map(card => normalizeHotelCard(card, cityName))
    .filter(Boolean)
    .slice(0, 20)
}

async function getStayDetail(hotelId) {
  const id = String(hotelId || '').trim()
  if (!id) throw createError('호텔 ID가 필요합니다.', 400)

  const params = new URLSearchParams({
    domain:   HOTEL_DOMAIN,
    locale:   HOTEL_LOCALE,
    hotel_id: id,
  })

  const detailRes = await fetch(`${BASE_URL}/v2/hotels/details?${params}`, { method: 'GET', headers: getHeaders() })
  if (!detailRes.ok) {
    const text = await detailRes.text()
    throw new Error(`Hotels.com details ${detailRes.status}: ${text}`)
  }

  const detailJson = await detailRes.json()
  const hotel = detailJson.data || detailJson.summary || detailJson
  const address = hotel.location?.address || hotel.address || {}

  const images = (hotel.propertyGallery?.images || hotel.images || [])
    .map(p => ({ url: p.image?.url || p.url }))
    .filter(p => p.url)
    .slice(0, 12)

  const facilities = collectAmenityTexts([
    ...(hotel.amenities?.topAmenities?.items || []),
    ...(hotel.amenities?.amenities || []),
  ]).slice(0, 18)

  return {
    id:          id,
    name:        firstText(hotel.name, hotel.summary?.name),
    description: firstText(hotel.tagline, hotel.description, hotel.aboutThisProperty?.sections?.[0]?.bodySubSections?.[0]?.elements?.[0]?.items?.[0]?.content?.text),
    address:     firstText(address.addressLine, address.fullAddress, hotel.address),
    city:        firstText(address.city, hotel.location?.city),
    destination: firstText(address.countryName, hotel.location?.countryName),
    zone:        firstText(address.neighborhood, address.city, hotel.location?.city),
    rating:      firstNumber(hotel.starRating, hotel.propertyRating?.rating) || null,
    category:    firstText(hotel.propertyType, hotel.category),
    coordinates: (hotel.location?.coordinates?.latitude && hotel.location?.coordinates?.longitude)
      ? { latitude: hotel.location.coordinates.latitude, longitude: hotel.location.coordinates.longitude }
      : null,
    phones:      hotel.phone ? [hotel.phone] : [],
    emails:      [],
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
