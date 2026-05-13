// AiTravelDuration.js - 여행 일정 비즈니스 로직 및 순수 유틸리티 함수 모음

import { EUR_TO_KRW } from '../data/AiTravelDuration'
import { apiGet, apiPost } from '../api/apiClient'
import EMERGENCY_NUMBERS from '../data/emergencyNumbers.json'

/* global google */
export const GOOGLE_MAP_SCRIPT_ID = 'google-maps-travel-duration-script'
export const GOOGLE_MAP_SCRIPT_SRC = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDaVmYg-OdmcaT1qDjLA-J-n5-df0XyWSw&callback=initMap&loading=async'
export const BUDGET_CATEGORIES = [
  { key: 'meal',      label: '식사',   icon: '🍽', color: 'var(--amber)'  },
  { key: 'transport', label: '교통',   icon: '🚇', color: 'var(--blue)'   },
  { key: 'entry',     label: '입장비', icon: '🏛', color: 'var(--green)'  },
  { key: 'shop',      label: '쇼핑',   icon: '🛍', color: 'var(--purple)' },
]
export const EMERGENCY_RADIUS_METERS = 3000

// ── 순수 유틸리티 ──────────────────────────────────────────────

export function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')
}

export function cleanPlaceName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+(체크인|체크아웃|도착|출발|복귀|방문|관광|구경|산책|탐방)$/g, '')
    .replace(/\s+/g, ' ').trim()
}

export function lookupEmergencyNumber(destination) {
  if (!destination) return null
  const dest = destination.trim()
  if (EMERGENCY_NUMBERS[dest]) return { countryName: dest, ...EMERGENCY_NUMBERS[dest] }
  for (const [country, data] of Object.entries(EMERGENCY_NUMBERS)) {
    if (dest.includes(country) || country.includes(dest)) return { countryName: country, ...data }
    if (data.aliases?.some(a => dest.includes(a) || a.includes(dest))) return { countryName: country, ...data }
  }
  return null
}

export function heroImageForDestination(destination) {
  const images = {
    호주: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=80',
    시드니: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=80',
    일본: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1800&q=80',
    도쿄: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1800&q=80',
    오사카: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1800&q=80',
    프랑스: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1800&q=80',
    파리: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1800&q=80',
    태국: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?auto=format&fit=crop&w=1800&q=80',
    베트남: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1800&q=80',
  }
  const found = Object.entries(images).find(([key]) => destination.includes(key))
  return found?.[1] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=80'
}

export function parseBudgetWon(value) {
  const text = String(value ?? '').trim().replace(/,/g, '')
  if (!text) return 0
  const compact = text.replace(/\s+/g, '')
  const units = [
    { pattern: /(\d+(?:\.\d+)?)억/, multiplier: 100000000 },
    { pattern: /(\d+(?:\.\d+)?)만/, multiplier: 10000 },
    { pattern: /(\d+(?:\.\d+)?)천/, multiplier: 1000 },
  ]
  const unitTotal = units.reduce((sum, u) => {
    const m = compact.match(u.pattern)
    return m ? sum + Number(m[1]) * u.multiplier : sum
  }, 0)
  if (unitTotal > 0) return Math.round(unitTotal)
  const number = Number(compact.replace(/[^\d.]/g, ''))
  return Number.isFinite(number) ? Math.round(number) : 0
}

export function haversineMeters(a, b) {
  const R = 6371000
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const lat1 = a.lat * Math.PI / 180, lat2 = b.lat * Math.PI / 180
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export function formatDistance(meters) {
  if (!Number.isFinite(meters)) return ''
  return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(1)}km`
}

export function parseDurationMinutes(text) {
  const hours = text?.match(/(\d+)\s*시간/)
  const mins  = text?.match(/(\d+)\s*분/)
  return (hours ? parseInt(hours[1], 10) * 60 : 0) + (mins ? parseInt(mins[1], 10) : 0)
}

// ── 일정 구조 헬퍼 ─────────────────────────────────────────────

export function getHotelReturnStop(stops) {
  const first = stops[0] || {}
  const hotelName = first.name || '숙소'
  return {
    t: '21:30', name: `${hotelName} 복귀`, badge: '숙소 복귀', kind: 'rest',
    desc: '하루 일정을 마치고 숙소로 돌아옵니다. 다음 날 이동을 위해 복귀 시간을 고정합니다.',
    tags: ['숙소 도착', '일정 종료'], safety: 'safe',
  }
}

export function getDayStops(stops) {
  const last = stops[stops.length - 1] || {}
  const alreadyReturns = /숙소|hotel|Hotel|복귀/i.test(`${last.name || ''} ${last.badge || ''}`)
  return alreadyReturns ? stops : [...stops, getHotelReturnStop(stops)]
}

export function getRouteInfo(stops, stop, i) {
  const stopText = `${stop.name || ''} ${stop.badge || ''}`
  const isReturn = /복귀/i.test(stopText)
  const firstStopName = stops[0]?.name || '숙소'
  const hotelName = isReturn
    ? (stop.name || firstStopName).replace(/\s*복귀$/, '')
    : firstStopName
  const origin      = i === 0 ? hotelName : (stops[i - 1]?.name || '이전 장소')
  const destination = i === 0 ? '일정 시작' : isReturn ? (stop.name || '숙소').replace(/\s*복귀$/, '') : stop.name
  const label       = isReturn ? '복귀 이동' : i === 0 ? '첫 이동' : '장소 간 이동'
  return { origin, destination, label }
}

export function getMapPoints(base, cityData) {
  if (cityData?.[base]?.mapPoints?.length) return cityData[base].mapPoints
  const pts = {
    barcelona: [{lat:41.3932,lng:2.1699},{lat:41.3917,lng:2.1649},{lat:41.3915,lng:2.1686},{lat:41.3852,lng:2.1809},{lat:41.3927,lng:2.1587},{lat:41.3950,lng:2.1702}],
    madrid:    [{lat:40.4128,lng:-3.7002},{lat:40.4138,lng:-3.6921},{lat:40.4154,lng:-3.7089},{lat:40.4153,lng:-3.6844},{lat:40.4169,lng:-3.7035}],
    sevilla:   [{lat:37.3861,lng:-5.9928},{lat:37.3826,lng:-5.9910},{lat:37.3891,lng:-5.9945},{lat:37.3761,lng:-5.9866}],
    granada:   [{lat:37.1773,lng:-3.5986},{lat:37.1760,lng:-3.5880},{lat:37.1808,lng:-3.6003},{lat:37.1722,lng:-3.5967}],
    malaga:    [{lat:36.7213,lng:-4.4217},{lat:36.7196,lng:-4.4189},{lat:36.7253,lng:-4.4176},{lat:36.7115,lng:-4.3923}],
    valencia:  [{lat:39.4699,lng:-0.3763},{lat:39.4539,lng:-0.3688},{lat:39.4736,lng:-0.3790},{lat:39.4560,lng:-0.3214}],
    bilbao:    [{lat:43.2630,lng:-2.9350},{lat:43.2592,lng:-2.9284},{lat:43.2604,lng:-2.9466},{lat:43.2556,lng:-2.9237}],
    sansebastian: [{lat:43.3183,lng:-1.9812},{lat:43.3226,lng:-1.9753},{lat:43.3212,lng:-1.9880},{lat:43.3099,lng:-2.0016}],
    zaragoza:  [{lat:41.6561,lng:-0.8773},{lat:41.6584,lng:-0.8752},{lat:41.6502,lng:-0.8831},{lat:41.6601,lng:-0.8705}],
    return:    [{lat:41.6561,lng:-0.8773},{lat:41.2971,lng:-0.9170}],
  }
  return pts[base] || pts.barcelona
}

export function getRouteSegment(base, stopIdx, cityData) {
  const points = getMapPoints(base, cityData)
  const routePoints = [...points, points[0]]
  const idx = Math.max(0, Math.min(stopIdx, routePoints.length - 1))
  return idx === 0 ? [routePoints[0]] : [routePoints[idx - 1], routePoints[idx]]
}

// ── 이동수단 계산 ──────────────────────────────────────────────

export function transitPanelKey(day, stopIdx)         { return `${day}-${stopIdx}` }
export function modeResultKey(day, stopIdx, mode)      { return `${day}-${stopIdx}-${mode}` }

export function getModeOptions(stop, i, { day, routeModeResults, transitResults }) {
  const walkLive    = routeModeResults[modeResultKey(day, i, 'walk')]
  const taxiLive    = routeModeResults[modeResultKey(day, i, 'taxi')]
  const transitLive = routeModeResults[modeResultKey(day, i, 'transit')]
  const fallbackWalk = i === 0
    ? { time: '0분', desc: '숙소 앞에서 바로 일정 시작', minutes: 0 }
    : stop.kind === 'risk'
      ? { time: '18분', desc: '대로변 우회 · 골목길 회피', minutes: 18 }
      : { time: i % 2 ? '12분' : '15분', desc: '현재 루트 유지 · 골목길 포함', minutes: i % 2 ? 12 : 15 }
  if (i === 0) {
    return [
      { mode: 'walk', icon: '🚶', title: '도보 시작', desc: '숙소 앞에서 바로 일정 시작', time: '0분', minutes: 0 },
      { mode: 'info', icon: '↩', title: '복귀 지점', desc: '일정 종료 후 같은 숙소로 돌아오기', time: '고정', minutes: 999 },
    ]
  }
  if (stop.kind === 'risk') {
    return [
      { mode: 'taxi',    icon: '🚕', title: '택시',    desc: taxiLive?.desc    || '가까운 대로변 승차 · 야간 이동 우선', time: taxiLive?.time    || '조회', minutes: taxiLive?.minutes    ?? 999 },
      { mode: 'walk',    icon: '🚶', title: '도보',    desc: walkLive?.desc    || fallbackWalk.desc,                       time: walkLive?.time    || fallbackWalk.time,   minutes: walkLive?.minutes    ?? fallbackWalk.minutes },
      { mode: 'transit', icon: '🚇', title: '대중교통', desc: transitLive?.desc || '정류장/역 기반 경로 조회',              time: transitLive?.time || '조회',             minutes: transitLive?.minutes ?? 999 },
    ]
  }
  return [
    { mode: 'walk',    icon: '🚶', title: '도보',    desc: walkLive?.desc    || fallbackWalk.desc,                     time: walkLive?.time    || fallbackWalk.time, minutes: walkLive?.minutes    ?? fallbackWalk.minutes },
    { mode: 'transit', icon: '🚇', title: '대중교통', desc: transitLive?.desc || '역/정류장 승하차 정보 조회',            time: transitLive?.time || '조회',           minutes: transitLive?.minutes ?? 999 },
    { mode: 'taxi',    icon: '🚕', title: '택시',    desc: taxiLive?.desc    || '가까운 승차 지점 호출 · 교통 상황 반영 예정', time: taxiLive?.time    || '조회',       minutes: taxiLive?.minutes    ?? 999 },
  ]
}

export function getFastestMode(stop, i, state) {
  return getModeOptions(stop, i, state).reduce((best, opt) => opt.minutes < best.minutes ? opt : best)
}

export function getTransportPlan(stop, i, state) {
  const fastest = getFastestMode(stop, i, state)
  return {
    rec: fastest.title,
    detail: fastest.time,
    options: getModeOptions(stop, i, state).map(opt => `${opt.title} ${opt.time}`),
  }
}

export function getTransitDemoOptions(stop, i, { day, transitResults, transitLoadingKey, routeModeResults }) {
  const key  = transitPanelKey(day, i)
  const live = transitResults[key]
  const state = { day, routeModeResults, transitResults }
  if (transitLoadingKey === key) {
    return getModeOptions(stop, i, state).map(opt =>
      opt.mode === 'transit'
        ? { ...opt, loading: true, detail: [{ icon: '🚇', title: '대중교통 경로 조회 중', desc: 'Google Transit 데이터로 승차 위치와 노선을 확인하고 있습니다.', time: '...' }] }
        : opt
    )
  }
  if (live) return getModeOptions(stop, i, state).map(opt => opt.mode === 'transit' ? { ...opt, detail: live } : opt)
  return getModeOptions(stop, i, state)
}

export function getTransitDetailOptions(stop, i, { day, transitResults, transitLoadingKey }) {
  const key = transitPanelKey(day, i)
  if (transitLoadingKey === key) {
    return [{ icon: '🚇', title: '대중교통 경로 조회 중', desc: 'Google Transit 데이터로 승차 위치와 노선을 확인하고 있습니다.', time: '...' }]
  }
  return transitResults[key] || []
}

// ── 포맷 함수 묶음 ─────────────────────────────────────────────

export function makeFormatters(exchangeRate) {
  const eurToKrw       = (amount) => Math.round(amount * EUR_TO_KRW)
  const formatKrw      = (amount) => '₩' + Math.round(amount).toLocaleString('ko-KR')
  const formatEurAsKrw = (amount) => formatKrw(eurToKrw(amount))
  const formatExpense  = (amount) => formatKrw(amount)
  const localToKrw     = (amount) => Math.round((Number(amount) || 0) * exchangeRate.rateToKrw)
  const formatLocalAmount = (amount) => {
    const value = Number(amount) || 0
    if (!exchangeRate.currency) return value.toLocaleString('ko-KR')
    if (exchangeRate.currency === 'KRW') return formatKrw(value)
    return `${value.toLocaleString('ko-KR')} ${exchangeRate.currency}`
  }
  const formatExpenseLogAmount = (expense) => {
    if (expense.currency === 'KRW') return formatExpense(expense.amountKrw)
    return `${formatLocalAmount(expense.amountLocal)} · ${formatExpense(expense.amountKrw)}`
  }
  const localizeMoneyText = (text) =>
    String(text).replace(/€\s?([\d,.]+)(?:\s?-\s?([\d,.]+))?/g, (_, from, to) => {
      const start = parseFloat(from.replace(/,/g, ''))
      if (!to) return formatEurAsKrw(start)
      const end = parseFloat(to.replace(/,/g, ''))
      return `${formatEurAsKrw(start)}-${formatEurAsKrw(end)}`
    })
  return { eurToKrw, formatKrw, formatEurAsKrw, formatExpense, localToKrw, formatLocalAmount, formatExpenseLogAmount, localizeMoneyText }
}

// ── 예산 계산 ──────────────────────────────────────────────────

export function getTotalSpent(expenses) {
  return expenses.reduce((sum, e) => sum + e.amountKrw, 0)
}

export function getCurrentDayNumber(schedule, activeIdx) {
  return Number(schedule[activeIdx]?.day) || activeIdx + 1
}

export function getDailyBudgetWon(total, schedule) {
  return total > 0 && schedule.length ? Math.floor(total / schedule.length) : 0
}

export function getCurrentDayExpenses(expenses, schedule, activeIdx) {
  const dayNumber = getCurrentDayNumber(schedule, activeIdx)
  return expenses.filter(e => Number(e.day || dayNumber) === dayNumber)
}

export function getCurrentDaySpent(expenses, schedule, activeIdx) {
  return getCurrentDayExpenses(expenses, schedule, activeIdx).reduce((sum, e) => sum + e.amountKrw, 0)
}

export function getSpentThroughDay(expenses, dayNumber) {
  return expenses.filter(e => Number(e.day || 1) <= dayNumber).reduce((sum, e) => sum + e.amountKrw, 0)
}

export function getTodayAvailableBudget(total, expenses, schedule, activeIdx) {
  const dayNumber   = getCurrentDayNumber(schedule, activeIdx)
  const dailyBudget = getDailyBudgetWon(total, schedule)
  if (!dailyBudget) return 0
  return Math.max(0, dailyBudget * dayNumber - getSpentThroughDay(expenses, dayNumber))
}

export function getCategoryBreakdown(expenses, schedule, activeIdx) {
  const dayExpenses = getCurrentDayExpenses(expenses, schedule, activeIdx)
  const spent = dayExpenses.reduce((sum, e) => sum + e.amountKrw, 0)
  return BUDGET_CATEGORIES.map(cat => {
    const amount = dayExpenses.filter(e => e.cat === cat.key).reduce((sum, e) => sum + e.amountKrw, 0)
    return { ...cat, amount, pct: spent > 0 ? Math.round((amount / spent) * 100) : 0 }
  })
}

// ── 데이터 정규화 ──────────────────────────────────────────────

export function normalizeSavedExpense(expense) {
  const amountLocal = Number(expense.amountLocal ?? expense.amount ?? 0)
  const amountKrw   = Number(expense.amountKrw ?? expense.amount_krw ?? amountLocal)
  return {
    id: expense.id,
    name: expense.name || expense.description || '지출',
    cat:  expense.cat  || expense.category    || 'other',
    day:  Number(expense.day ?? expense.dayIndex ?? expense.day_index ?? 1),
    itemIndex: expense.itemIndex ?? expense.item_index ?? null,
    source:    expense.source || 'manual',
    amountLocal, amountKrw,
    currency: expense.currency || 'KRW',
    over: Boolean(expense.over),
  }
}

// ── sessionStorage / URL 헬퍼 ──────────────────────────────────

export function readGeneratedPlanResult() {
  try {
    const stored = sessionStorage.getItem('aiPlanResult')
    return stored ? JSON.parse(stored) : null
  } catch { return null }
}

export function getGeneratedPlanId(result) {
  const params = new URLSearchParams(window.location.search)
  return params.get('planId') || result?.planId || result?.id || result?.plan?.id || null
}

// ── 데이터 빌드 ────────────────────────────────────────────────

function kindFromItem(item) {
  if (item?.isMeal) return 'meal'
  if (item?.isHotel) return 'rest'
  return 'spot'
}

function knownPlaceCoordinates(name) {
  const text = cleanPlaceName(name).toLowerCase()
  if (/four seasons hotel sydney|four seasons sydney|199 george st/.test(text)) return { lat: -33.8615815, lng: 151.2076503 }
  if (/달링하버\s*(레스토랑|식당|맛집)|darling harbour\s*(restaurant|dining)/.test(text)) return { lat: -33.8722257, lng: 151.2020367 }
  return null
}

function displayPlaceName(name) {
  const text = cleanPlaceName(name).toLowerCase()
  if (/달링하버\s*(레스토랑|식당|맛집)|darling harbour\s*(restaurant|dining)/.test(text)) return "Nick's Seafood Restaurant"
  return name
}

function pointFromGeneratedItem(item, index) {
  const known = knownPlaceCoordinates(item?.name)
  if (known) return known
  const lat = Number(item?.lat), lng = Number(item?.lng)
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  return { lat: 37.5665 + index * 0.006, lng: 126.978 + index * 0.006 }
}

async function readPlanResultFromDb(planId) {
  if (!planId || !localStorage.getItem('tripHelperToken')) return null
  const plan = await apiGet(`/ai-travel/plans/${planId}`)
  return {
    planData: plan.plan_data, planId: plan.id,
    tripInfo: { country: plan.destination || '', nights: Number(plan.nights) || 0, budget: plan.budget || '' },
  }
}

export async function buildGeneratedTravelData() {
  const fallbackResult = readGeneratedPlanResult()
  const planId = getGeneratedPlanId(fallbackResult)
  let result = fallbackResult

  if (planId) {
    try { result = await readPlanResultFromDb(planId) || fallbackResult }
    catch (err) { console.warn('Failed to load travel plan from DB.', err) }
  }

  const days = result?.planData?.days
  if (!Array.isArray(days) || days.length === 0) return null

  const tripInfo    = result?.tripInfo || {}
  const destination = tripInfo.country || tripInfo.continent || 'AI 여행'
  const schedule    = days.map((day, index) => ({
    day: index + 1, city: destination, wx: index === 0 ? '☀' : '🌤',
    base: `generated-${index}`, today: index === 0,
  }))
  const cityData = {}

  days.forEach((day, index) => {
    const stops = (day.items || []).map((item, itemIndex) => {
      const known = knownPlaceCoordinates(item?.name)
      return {
        t:     escapeHtml(item.time || (itemIndex === 0 ? '09:00' : '')),
        name:  escapeHtml(displayPlaceName(item.name || `일정 ${itemIndex + 1}`)),
        badge: escapeHtml(item.isMeal ? '식사' : '명소'),
        kind:  kindFromItem(item),
        now:   index === 0 && itemIndex === 0,
        desc:  escapeHtml(item.note || 'AI가 생성한 여행 일정입니다.'),
        cost:  escapeHtml(item.cost || ''),
        tags:  [item.isMeal ? '식사 포인트' : '방문 포인트'].map(escapeHtml),
        safety: 'safe',
        lat: known?.lat ?? Number(item?.lat),
        lng: known?.lng ?? Number(item?.lng),
      }
    })
    cityData[`generated-${index}`] = {
      title: escapeHtml(day.theme || day.title || `${destination} ${index + 1}일차`),
      desc:  escapeHtml(`${destination} 여행 ${index + 1}일차 일정입니다.`),
      stops,
      mapPoints: (day.items || []).map(pointFromGeneratedItem),
    }
  })

  return {
    isGenerated: true, destination, schedule, cityData,
    cityGroups: [{ id: 'generated-trip', name: destination, wx: '✈', range: `Day 1-${days.length}`, indices: days.map((_, i) => i) }],
    activeIdx: 0,
    heroTitle: destination,
    routeText: days.map((day, i) => `${i + 1}일차 ${day.theme || day.title || ''}`.trim()).join(' → '),
    totalBudgetWon: parseBudgetWon(tripInfo?.budgetText || tripInfo?.budget),
  }
}

// ── Google Maps 라우트 URL ──────────────────────────────────────

export function buildGoogleMapsRouteUrl({ schedule, activeIdx, activeStopIdx, cityData, selectedTravelMode, routeModeResults }) {
  const s        = schedule[activeIdx]
  if (!s) return null
  const dayStops = getDayStops(cityData[s.base]?.stops || [])
  const stop     = dayStops[activeStopIdx]
  if (!stop) return null
  const route    = getRouteInfo(dayStops, stop, activeStopIdx)
  const p        = getRouteSegment(s.base, activeStopIdx, cityData)
  const modeMap  = { TRANSIT: 'transit', WALKING: 'walking', TAXI: 'driving' }
  const travelmode = modeMap[selectedTravelMode] || 'transit'
  const origin      = p.length >= 2 ? `${p[0].lat},${p[0].lng}`          : encodeURIComponent(route.origin)
  const destination = p.length >= 2 ? `${p[p.length - 1].lat},${p[p.length - 1].lng}` : encodeURIComponent(route.destination)
  return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelmode}`
}

// ── Google Maps 렌더링 ─────────────────────────────────────────

function latLngLiteral(latLng) {
  if (!latLng) return null
  return { lat: latLng.lat(), lng: latLng.lng() }
}

function cleanStepText(html) {
  const div = document.createElement('div')
  div.innerHTML = html || ''
  return div.textContent.replace(/\s+/g, ' ').trim()
}

function getTransitIcon(vehicleName) {
  if (/버스|bus/i.test(vehicleName))          return '🚌'
  if (/트램|tram|light rail/i.test(vehicleName)) return '🚊'
  if (/기차|train|rail/i.test(vehicleName))   return '🚆'
  return '🚇'
}

function formatTransitFare(route) {
  return route.fare?.text || '요금 정보 없음'
}

export function formatTransitResult(result) {
  const route = result.routes?.[0]
  const leg   = route?.legs?.[0]
  if (!leg) return null
  const fareText = formatTransitFare(route)
  const options  = leg.steps.map((step, idx) => {
    const stepRoute = {
      stepIdx: idx,
      path:  step.path?.map(latLngLiteral).filter(Boolean) || [],
      start: latLngLiteral(step.start_location),
      end:   latLngLiteral(step.end_location),
      mode:  step.travel_mode,
    }
    if (step.travel_mode === 'TRANSIT' && step.transit) {
      const line      = step.transit.line
      const vehicle   = line.vehicle?.name || '대중교통'
      const shortName = line.short_name || line.name || vehicle
      const depart    = step.transit.departure_stop?.name || '승차 정류장'
      const arrive    = step.transit.arrival_stop?.name  || '하차 정류장'
      const meta = [
        step.transit.headsign ? `${step.transit.headsign} 방면` : '',
        step.transit.num_stops ? `${step.transit.num_stops}개 정류장` : '',
        step.transit.departure_time?.text && step.transit.arrival_time?.text
          ? `${step.transit.departure_time.text} → ${step.transit.arrival_time.text}` : '',
        fareText !== '요금 정보 없음' ? fareText : '',
      ].filter(Boolean)
      return { icon: getTransitIcon(vehicle), title: `${vehicle} ${shortName}`, desc: `${depart}에서 승차 · ${arrive}에서 하차`, time: step.duration?.text || '', meta, route: stepRoute }
    }
    return { icon: '🚶', title: '도보 이동', desc: cleanStepText(step.instructions) || '정류장까지 이동', time: step.duration?.text || '', meta: [step.distance?.text || '', step.duration?.text || ''].filter(Boolean), route: stepRoute }
  })
  options.unshift({
    icon: '💳',
    title: `총 ${leg.duration?.text || '시간 정보 없음'}`,
    desc:  `${leg.distance?.text || '거리 정보 없음'} · ${fareText}`,
    time:  leg.departure_time?.text || '출발',
    meta: [
      leg.departure_time?.text && leg.arrival_time?.text ? `${leg.departure_time.text} → ${leg.arrival_time.text}` : '',
      `${options.filter(o => o.route?.mode === 'TRANSIT').length}개 대중교통 구간`,
    ].filter(Boolean),
    route: { stepIdx: null, path: leg.steps.flatMap(s => s.path?.map(latLngLiteral).filter(Boolean) || []), start: latLngLiteral(leg.start_location), end: latLngLiteral(leg.end_location), mode: 'TRANSIT_SUMMARY' },
  })
  return options
}

function formatSimpleRouteResult(result, mode) {
  const leg = result.routes?.[0]?.legs?.[0]
  if (!leg) return null
  const duration = leg.duration?.text || '시간 정보 없음'
  const distance = leg.distance?.text || '거리 정보 없음'
  return {
    mode, icon: mode === 'taxi' ? '🚕' : '🚶', title: mode === 'taxi' ? '택시' : '도보',
    desc: `${duration} · ${distance}`, time: duration, minutes: parseDurationMinutes(duration) || 999,
    route: {
      stepIdx: null,
      path:  leg.steps.flatMap(s => s.path?.map(latLngLiteral).filter(Boolean) || []),
      start: latLngLiteral(leg.start_location), end: latLngLiteral(leg.end_location),
      mode:  mode === 'taxi' ? 'DRIVING' : 'WALKING',
    },
  }
}

export function requestSimpleRoute(stopIdx, mode, { schedule, activeIdx, cityData }, onResult) {
  const s   = schedule[activeIdx]
  if (!s) return
  const key = modeResultKey(s.day, stopIdx, mode)
  const p   = getRouteSegment(s.base, stopIdx, cityData)
  if (!window.google || !google.maps?.DirectionsService || p.length < 2) return
  const svc = new google.maps.DirectionsService()
  svc.route({
    origin: p[0], destination: p[1],
    travelMode: mode === 'taxi' ? google.maps.TravelMode.DRIVING : google.maps.TravelMode.WALKING,
  }, (result, status) => {
    const formatted = status === 'OK' && result ? formatSimpleRouteResult(result, mode) : null
    if (formatted) onResult(key, formatted)
  })
}

export function requestTransitRoute(stopIdx, { schedule, activeIdx, cityData, day }, onResult) {
  const s   = schedule[activeIdx]
  if (!s) return
  const key = transitPanelKey(day, stopIdx)
  const p   = getRouteSegment(s.base, stopIdx, cityData)

  if (!window.google || !google.maps?.DirectionsService || p.length < 2) {
    onResult({ transitKey: key, transitResult: [{ icon: 'ℹ', title: '대중교통 조회 불가', desc: '출발/도착지가 같은 기준점이거나 Google Maps가 아직 준비되지 않았습니다.', time: '-' }] })
    return
  }

  const svc = new google.maps.DirectionsService()
  svc.route({
    origin: p[0], destination: p[1],
    travelMode: google.maps.TravelMode.TRANSIT,
    transitOptions: { departureTime: new Date() },
  }, (result, status) => {
    const formatted = status === 'OK' && result ? formatTransitResult(result) : null
    const transitResult = formatted || [{ icon: 'ℹ', title: '대중교통 경로 없음', desc: `이 구간은 Google Transit 응답이 없습니다. 상태: ${status}`, time: '-' }]
    const summary = formatted?.[0]
    let routeKey, routeValue
    if (summary) {
      routeKey   = modeResultKey(day, stopIdx, 'transit')
      routeValue = { mode: 'transit', icon: '🚇', title: '대중교통', desc: summary.desc, time: summary.title.replace(/^총\s*/, ''), minutes: parseDurationMinutes(summary.title) || 999, route: summary.route }
    }
    onResult({ transitKey: key, transitResult, routeKey, routeValue })
  })
}

export function renderRouteMap(targetId, { schedule, activeIdx, activeStopIdx, selectedTravelMode, activeTransitStepIdx, routeModeResults, cityData, transitResults }) {
  const el = document.getElementById(targetId)
  if (!el || !window.google) return
  el.innerHTML = ''

  const s         = schedule[activeIdx]
  const dayStops  = getDayStops(cityData[s.base]?.stops || [])
  const activeStop = dayStops[activeStopIdx]
  const key        = transitPanelKey(s.day, activeStopIdx)
  const modeKey    = selectedTravelMode === 'TAXI' ? 'taxi' : selectedTravelMode === 'WALKING' ? 'walk' : ''
  const modeRoute  = modeKey ? routeModeResults[modeResultKey(s.day, activeStopIdx, modeKey)]?.route : null
  const liveTransit = transitResults[key]
  const transitStep = activeTransitStepIdx !== null
    ? (liveTransit?.[activeTransitStepIdx]?.route)
    : null
  const selectedRoute = transitStep || modeRoute

  const p     = selectedRoute?.start && selectedRoute?.end ? [selectedRoute.start, selectedRoute.end] : getRouteSegment(s.base, activeStopIdx, cityData)
  const map   = new google.maps.Map(el, { center: p[0], zoom: 13, mapTypeControl: false, streetViewControl: false, fullscreenControl: false })
  const bounds = new google.maps.LatLngBounds()
  const labels = p.length === 1 ? ['숙'] : selectedRoute ? ['S', 'E'] : ['출', '도']
  const colors = p.length === 1 ? ['#0BB97A'] : selectedRoute ? ['#F59E0B', '#29ABE2'] : ['#0BB97A', '#29ABE2']

  p.forEach((pt, i) => {
    bounds.extend(pt)
    new google.maps.Marker({
      position: pt, map,
      label: { text: labels[i], color: '#fff', fontWeight: '800', fontSize: '10px' },
      icon:  { path: google.maps.SymbolPath.CIRCLE, scale: 13, fillColor: colors[i] || '#29ABE2', fillOpacity: 1, strokeColor: '#ffffff', strokeWeight: 3 },
    })
  })
  if (p.length === 1) { map.setCenter(p[0]); map.setZoom(15) } else { map.fitBounds(bounds, 48) }

  const routeFallback = () => {
    const path = selectedRoute?.path?.length ? selectedRoute.path : p
    path.forEach(pt => bounds.extend(pt))
    new google.maps.Polyline({ path, map, strokeColor: selectedRoute ? '#F59E0B' : '#29ABE2', strokeOpacity: 0.82, strokeWeight: 4 })
    if (path.length > 1) map.fitBounds(bounds, 48)
  }

  if (selectedRoute) { routeFallback(); return }
  if (p.length < 2 || !google.maps.DirectionsService || !google.maps.DirectionsRenderer) {
    if (p.length >= 2) routeFallback()
    return
  }

  const svc      = new google.maps.DirectionsService()
  const renderer = new google.maps.DirectionsRenderer({ map, suppressMarkers: true, preserveViewport: false, polylineOptions: { strokeColor: '#29ABE2', strokeOpacity: 0.82, strokeWeight: 5 } })
  svc.route({
    origin: p[0], destination: p[p.length - 1], waypoints: [],
    travelMode: selectedTravelMode === 'TAXI' ? google.maps.TravelMode.DRIVING : google.maps.TravelMode[selectedTravelMode] || google.maps.TravelMode.WALKING,
    transitOptions: selectedTravelMode === 'TRANSIT' ? { departureTime: new Date() } : undefined,
    optimizeWaypoints: false,
  }, (result, status) => {
    if (status === 'OK' && result) renderer.setDirections(result)
    else routeFallback()
  })
}

// ── API 액션 ────────────────────────────────────────────────────

export async function fetchSavedExpenses(planId) {
  if (!planId) return []
  return apiGet(`/ai-travel/plans/${planId}/expenses`)
}

export async function persistExpense(planId, expense) {
  if (!planId) return null
  return apiPost(`/ai-travel/plans/${planId}/expenses`, {
    name: expense.name, cat: expense.cat, day: expense.day,
    itemIndex: expense.itemIndex, source: expense.source || 'manual',
    amountLocal: expense.amountLocal, amountKrw: expense.amountKrw, currency: expense.currency,
  })
}

export async function rebudgetPlanDay(planId, payload) {
  if (!planId) return null
  return apiPost(`/ai-travel/plans/${planId}/rebudget-day`, payload)
}

export async function fetchExchangeRate(destination) {
  if (!destination) return null
  return apiGet(`/exchange-rate?destination=${encodeURIComponent(destination)}`)
}

export async function fetchConsulateInfo(destination) {
  const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
  const res = await fetch(`${apiBase}/api/consulate?destination=${encodeURIComponent(destination)}`)
  if (!res.ok) throw new Error()
  return res.json()
}

export async function fetchEmergencyNearbyInfo(point, radius) {
  return apiGet(`/maps/emergency-places?lat=${point.lat}&lng=${point.lng}&radius=${radius}`)
}
