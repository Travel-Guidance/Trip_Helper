export async function getSeatMaps(offerId) {
  const r = await fetch(`/api/seat-maps/${offerId}`)
  const data = await r.json()
  if (data && data.error) throw new Error(data.error)
  return Array.isArray(data) ? data : []
}
