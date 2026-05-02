const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토']

export const FLAGS = {
  JP: '🇯🇵', TH: '🇹🇭', VN: '🇻🇳', SG: '🇸🇬', PH: '🇵🇭',
  ES: '🇪🇸', IT: '🇮🇹', FR: '🇫🇷', GB: '🇬🇧', DE: '🇩🇪',
  US: '🇺🇸', CA: '🇨🇦', MX: '🇲🇽', BR: '🇧🇷', AU: '🇦🇺',
  AE: '🇦🇪', TR: '🇹🇷', IN: '🇮🇳', EG: '🇪🇬', KE: '🇰🇪',
  ZA: '🇿🇦', CN: '🇨🇳', HK: '🇭🇰', TW: '🇹🇼', NZ: '🇳🇿',
}

export function formatTime(isoStr) {
  if (!isoStr) return '--:--'
  const d = new Date(isoStr)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function formatDateShort(isoStr) {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]})`
}

export function formatDateKo(dateStr) {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return `${y}.${m}.${d} (${DAY_NAMES[date.getDay()]})`
}

export function parseDuration(iso) {
  if (!iso) return 0
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return 0
  return parseInt(match[1] || 0) * 60 + parseInt(match[2] || 0)
}

export function formatDuration(minutes) {
  if (!minutes && minutes !== 0) return '-'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h > 0 && m > 0) return `${h}시간 ${m}분`
  if (h > 0) return `${h}시간`
  return `${m}분`
}

export function formatPrice(amount, currency = 'KRW') {
  const num = parseFloat(amount)
  if (isNaN(num)) return '-'
  if (currency === 'KRW') return num.toLocaleString('ko-KR') + '원'
  return num.toLocaleString('en-US', { style: 'currency', currency, minimumFractionDigits: 0 })
}

export function getStopsText(segments) {
  const stops = segments.length - 1
  if (stops === 0) return '직항'
  if (stops === 1) return '1회 경유'
  return `${stops}회 경유`
}

export function getStopsBadgeClass(segments) {
  return segments.length === 1 ? 'badge-direct' : 'badge-stop'
}
