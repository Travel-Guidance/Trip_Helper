// 백엔드: https://travel-generation.onrender.com
// 프론트: https://travel-generation-ten.vercel.app
// const BASE = '/api' // 로컬 개발용 (Vite proxy 사용)
const BASE = 'https://travel-generation.onrender.com/api' // 배포용

export async function getPlaces(query) {
  if (!query || query.length < 2) return []
  const r = await fetch(`${BASE}/places?query=${encodeURIComponent(query)}`)
  return r.json()
}

export async function searchFlights({ origin, destination, departureDate, returnDate, adults, cabinClass, tripType }) {
  const r = await fetch(`${BASE}/search`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      origin,
      destination,
      departure_date: departureDate,
      return_date: returnDate || undefined,
      adults: Number(adults),
      cabin_class: cabinClass,
      trip_type: tripType,
    }),
  })
  const data = await r.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function getOffer(offerId) {
  const r = await fetch(`${BASE}/offers/${offerId}`)
  const data = await r.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function createOrder({ offerId, passengers, services = [] }) {
  const r = await fetch(`${BASE}/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offer_id: offerId, passengers, services }),
  })
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || '예약 처리 중 오류가 발생했습니다')
  return data
}

export async function getOrder(orderId) {
  const r = await fetch(`${BASE}/orders/${orderId}`)
  const data = await r.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function getPopular() {
  const r = await fetch(`${BASE}/popular`)
  return r.json()
}
