import { apiGet, apiPost } from './apiClient'

const CACHE_TTL_MS = 5 * 60 * 1000
const cache = new Map()

function getCached(key) {
  const item = cache.get(key)
  if (!item || item.expiresAt < Date.now()) {
    cache.delete(key)
    return null
  }
  return item.value
}

function setCached(key, value) {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS })
  return value
}

export async function searchStays({ country, countryCode, checkIn, checkOut, guests }) {
  const key = `search:${country || ''}:${countryCode || ''}:${checkIn || ''}:${checkOut || ''}:${guests || ''}`
  const cached = getCached(key)
  if (cached) return cached
  const data = await apiPost('/stays/search', { country, countryCode, checkIn, checkOut, guests })
  return setCached(key, Array.isArray(data) ? data : [])
}

export async function getStayDetail(hotelId) {
  const key = `detail:${hotelId}`
  const cached = getCached(key)
  if (cached) return cached
  return setCached(key, await apiGet(`/stays/${hotelId}`))
}

export async function getStayOffers({ hotelId, checkIn, checkOut, guests }) {
  const key = `offers:${hotelId}:${checkIn || ''}:${checkOut || ''}:${guests || ''}`
  const cached = getCached(key)
  if (cached) return cached
  const params = new URLSearchParams()
  if (checkIn) params.set('checkIn', checkIn)
  if (checkOut) params.set('checkOut', checkOut)
  if (guests) params.set('guests', String(guests))
  const data = await apiGet(`/stays/${hotelId}/offers?${params}`)
  return setCached(key, Array.isArray(data) ? data : [])
}

export async function getMapEmbedUrl({ query, lat, lng }) {
  const params = new URLSearchParams({ query })
  if (lat != null) params.set('lat', String(lat))
  if (lng != null) params.set('lng', String(lng))
  return apiGet(`/maps/embed-url?${params}`, {
    errorMessage: '지도를 불러오지 못했습니다.',
  })
}

export async function createStayBooking(payload) {
  return apiPost('/stays/bookings', payload, {
    errorMessage: '숙소 예약 처리 중 오류가 발생했습니다',
  })
}
