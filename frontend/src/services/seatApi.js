// 백엔드: https://travel-generation.onrender.com
// 프론트: https://travel-generation-ten.vercel.app
export async function getSeatMaps(offerId) {
  // const r = await fetch(`/api/seat-maps/${offerId}`) // 로컬 개발용
  const r = await fetch(`https://travel-generation.onrender.com/api/seat-maps/${offerId}`) // 배포용
  const data = await r.json()
  if (data && data.error) throw new Error(data.error)
  return Array.isArray(data) ? data : []
}
