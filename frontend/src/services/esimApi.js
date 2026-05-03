// 백엔드: https://travel-generation.onrender.com
// 프론트: https://travel-generation-jj45.vercel.app
export async function purchaseEsim({ email, countries, totalPrice, code }) {
  // const r = await fetch('/api/esim/purchase', { // 로컬 개발용
  const r = await fetch('https://travel-generation-3.onrender.com/api/esim/purchase', { // 배포용
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, countries, totalPrice, code }),
  })
  return r.json()
}
