export async function purchaseEsim({ email, countries, totalPrice, code }) {
  const r = await fetch('/api/esim/purchase', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, countries, totalPrice, code }),
  })
  return r.json()
}
