import { apiGet, apiPost } from './apiClient'

export async function searchStays({ country, countryCode, checkIn, checkOut, guests }) {
  const data = await apiPost('/stays/search', { country, countryCode, checkIn, checkOut, guests })
  return Array.isArray(data) ? data : []
}

export async function getStayDetail(hotelId) {
  return apiGet(`/stays/${hotelId}`)
}

export async function getStayOffers({ hotelId, checkIn, checkOut, guests }) {
  const params = new URLSearchParams()
  if (checkIn) params.set('checkIn', checkIn)
  if (checkOut) params.set('checkOut', checkOut)
  if (guests) params.set('guests', String(guests))
  const data = await apiGet(`/stays/${hotelId}/offers?${params}`)
  return Array.isArray(data) ? data : []
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
