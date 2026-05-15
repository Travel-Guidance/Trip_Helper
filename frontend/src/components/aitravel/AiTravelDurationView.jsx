// AiTravelDurationView.jsx - 여행 일정 메인 뷰 (상태·렌더링 통합 React 컴포넌트)
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import TeachersDayEgg from './TeachersDayEgg'
import { Camera, Dumbbell, Hotel, Image, Languages, MapPin, Shield, Siren, Wallet } from 'lucide-react'
import { apiPost, apiGet } from '../../api/apiClient'
import {
  buildGeneratedTravelData, getDayStops, getRouteInfo, getRouteSegment,
  haversineMeters, formatDistance, lookupEmergencyNumber, heroImageForDestination,
  makeFormatters, getTransportPlan, getTransitDemoOptions,
  getTransitDetailOptions, transitPanelKey, modeResultKey,
  getTotalSpent, getCurrentDayNumber, getDailyBudgetWon, getCurrentDayExpenses,
  getCurrentDaySpent, getTodayAvailableBudget, getCategoryBreakdown,
  parseBudgetWon,
  normalizeSavedExpense, fetchSavedExpenses, persistExpense, deleteExpense, fetchExchangeRate,
  rebudgetPlanDay, updatePlanBudget,
  fetchConsulateInfo, fetchEmergencyNearbyInfo, fetchNearbyAmenities, fetchIndoorPlaces, fetchNearbyCafes, fetchDayWeather, translateImageFile, buildGoogleMapsRouteUrl,
  requestSimpleRoute, requestTransitRoute, renderRouteMap, renderSafeRouteMap,
  getGeneratedPlanId, readGeneratedPlanResult,
  BUDGET_CATEGORIES, GOOGLE_MAP_SCRIPT_ID, GOOGLE_MAP_SCRIPT_SRC, EMERGENCY_RADIUS_METERS,
} from '../../utils/AiTravelDuration'

const QUICK_PHRASES = ['이거 얼마예요?', '화장실 어디예요?', '영수증 주세요', '택시 불러주세요', '병원이 어디예요?', '도와주세요!']
const TOOL_ITEMS = [
  { modal: 'translate',      Icon: Languages, label: '번역' },
  { modal: 'budget',         Icon: Wallet,    label: '예산' },
  { modal: 'imageTranslate', Icon: Image,     label: '이미지 번역' },
  { modal: 'nearby',         Icon: MapPin,    label: '편의시설' },
  { modal: 'emergency',      Icon: Siren,     label: '긴급' },
  { modal: 'safety',         Icon: Shield,    label: '야간안전' },
  { modal: 'album',          Icon: Camera,    label: '사진' },
  { modal: 'hotel',          Icon: Hotel,     label: '숙소' },
]

const EASTER_EGG_PHRASE = '박보경 강사님 감사합니다'

const PODCAST_ICON_URL = 'https://cdn-icons-gif.flaticon.com/15748/15748293.gif'
const PODCAST_ICON_STATIC_URL = 'https://cdn-icons-png.flaticon.com/512/15748/15748293.png'

function TranslateModal({ destination }) {
  const [input, setInput]               = useState('')
  const [translated, setTranslated]     = useState('')
  const [pronunciation, setPronunciation] = useState('')
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState('')
  const [showEasterEgg, setShowEasterEgg] = useState(false)

  async function doTranslate(text) {
    if (!text.trim()) return
    if (text.trim() === EASTER_EGG_PHRASE) { setShowEasterEgg(true); return }
    setLoading(true)
    setTranslated('')
    setPronunciation('')
    setError('')
    try {
      const data = await apiPost('/translate', { text: text.trim(), destination })
      setTranslated(data.translated || '번역 결과 없음')
      setPronunciation(data.pronunciation || '')
    } catch {
      setError('번역 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mi-phrase">
        {QUICK_PHRASES.map(p => (
          <button key={p} onClick={() => { setInput(p); doTranslate(p) }}>{p}</button>
        ))}
      </div>
      <textarea
        className="mi-textarea"
        placeholder="번역할 내용을 입력하세요..."
        value={input}
        onChange={e => {
          const val = e.target.value
          setInput(val)
          if (val.trim() === EASTER_EGG_PHRASE) setShowEasterEgg(true)
        }}
        onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); doTranslate(input) } }}
      />
      <button
        className="mi-map-btn mi-translate-btn"
        onClick={() => doTranslate(input)}
        disabled={loading}
      >
        {loading ? '번역 중...' : '번역하기'}
      </button>
      {(translated || error) && (
        <>
          <div className="mi-result">{error || translated}</div>
          {pronunciation && <div className="mi-pronunciation">[ {pronunciation} ]</div>}
        </>
      )}
      {showEasterEgg && <TeachersDayEgg onClose={() => setShowEasterEgg(false)} />}
    </div>
  )
}

function ImageTranslateModal({ destination, podcastEnabled, setPodcastEnabled }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState('')
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview)
    window.speechSynthesis?.cancel()
  }, [preview])

  function pickFile(nextFile) {
    if (!nextFile) return
    if (!nextFile.type?.startsWith('image/')) {
      setError('이미지 파일만 업로드할 수 있습니다.')
      return
    }
    if (preview) URL.revokeObjectURL(preview)
    setFile(nextFile)
    setPreview(URL.createObjectURL(nextFile))
    setProgress(0)
    setStatus('idle')
    setResult(null)
    setError('')
  }

  async function startUpload(nextFile = file) {
    if (!nextFile) {
      fileInputRef.current?.click()
      return
    }
    setStatus('uploading')
    setProgress(8)
    setResult(null)
    setError('')

    let current = 8
    const timer = window.setInterval(() => {
      current = Math.min(92, current + Math.max(2, Math.round((92 - current) * 0.12)))
      setProgress(current)
    }, 240)

    try {
      const data = await translateImageFile(nextFile, destination)
      window.clearInterval(timer)
      setProgress(100)
      setResult(data)
      setStatus('done')
    } catch (err) {
      window.clearInterval(timer)
      setError(err.message || '이미지 번역 중 오류가 발생했습니다.')
      setStatus('error')
    }
  }

  function handleFileChange(e) {
    const nextFile = e.target.files?.[0]
    if (!nextFile) return
    pickFile(nextFile)
    startUpload(nextFile)
    e.target.value = ''
  }

  function stopPodcast() {
    window.speechSynthesis?.cancel()
  }

  const podcastText = result?.podcastScript || result?.summary || result?.translated

  useEffect(() => {
    if (!podcastEnabled) {
      window.speechSynthesis?.cancel()
      return
    }
    if (!podcastText || !window.speechSynthesis) return

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(podcastText)
    utterance.lang = 'ko-KR'
    utterance.rate = 0.92
    utterance.pitch = 1.04
    utterance.onend = () => {
      setPodcastEnabled(false)
    }
    utterance.onerror = () => {
      setPodcastEnabled(false)
    }
    window.speechSynthesis.speak(utterance)
  }, [podcastEnabled, podcastText, setPodcastEnabled])

  const progressStyle = { '--progress': `${progress}%` }
  const titleText = result?.title || '이미지 설명'
  const summaryText = String(result?.summary || result?.translated || '번역 결과가 없습니다.')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, 10)
    .join('\n')

  return (
    <div className="mi-image-translate">
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

      {!file && (
        <button
          type="button"
          className="mi-image-drop"
          onClick={() => fileInputRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const nextFile = e.dataTransfer.files?.[0]
            if (!nextFile) return
            pickFile(nextFile)
            startUpload(nextFile)
          }}
        >
          <span className="mi-image-upload-ring">↑</span>
          <strong>번역을 원하는 사진을 업로드하세요.</strong>
        </button>
      )}

      {file && (
        <div className={`mi-image-processing${status === 'done' ? ' done' : ''}`}>
          {status === 'done' && preview ? (
            <div className="mi-image-preview-card">
              <img src={preview} alt="업로드한 사진" />
              <button type="button" onClick={() => {
                setPodcastEnabled(false)
                stopPodcast()
                setFile(null)
                setPreview('')
                setProgress(0)
                setStatus('idle')
                setResult(null)
                setError('')
              }} aria-label="업로드한 사진 지우기">×</button>
            </div>
          ) : (
            <>
              <div className="mi-image-progress" style={progressStyle}>
                <span>{`${progress}%`}</span>
              </div>
              <div className="mi-image-status">
                {status === 'error' ? '업로드에 실패했습니다.' : '번역중입니다.'}
              </div>
            </>
          )}
        </div>
      )}

      {error && <div className="mi-image-error">{error}</div>}

      {result && (
        <div className="mi-image-result">
          <div className="mi-image-result-title">
            {titleText}
          </div>
          <div className="mi-image-result-box">
            <strong>요약 번역</strong>
            <p>{summaryText}</p>
          </div>
        </div>
      )}
    </div>
  )
}

const FATIGUE_LABELS = {
  1:'최상 컨디션', 2:'컨디션 좋음', 3:'약간 피로', 4:'적당히 피로', 5:'중간 피로',
  6:'카페 휴식 추천', 7:'도보 줄이기', 8:'택시 추천', 9:'숙소 복귀 추천', 10:'일정 조정 필요',
}

const COUNTRY_TIMEZONES = {
  일본: 'Asia/Tokyo', 도쿄: 'Asia/Tokyo', 오사카: 'Asia/Tokyo', 교토: 'Asia/Tokyo', 후쿠오카: 'Asia/Tokyo',
  태국: 'Asia/Bangkok', 방콕: 'Asia/Bangkok', 치앙마이: 'Asia/Bangkok', 푸켓: 'Asia/Bangkok',
  베트남: 'Asia/Ho_Chi_Minh', 호치민: 'Asia/Ho_Chi_Minh', 하노이: 'Asia/Bangkok',
  싱가포르: 'Asia/Singapore',
  인도네시아: 'Asia/Jakarta', 발리: 'Asia/Makassar',
  대만: 'Asia/Taipei',
  홍콩: 'Asia/Hong_Kong',
  말레이시아: 'Asia/Kuala_Lumpur',
  필리핀: 'Asia/Manila',
  프랑스: 'Europe/Paris', 파리: 'Europe/Paris',
  이탈리아: 'Europe/Rome', 로마: 'Europe/Rome', 밀라노: 'Europe/Rome',
  스페인: 'Europe/Madrid', 바르셀로나: 'Europe/Madrid', 마드리드: 'Europe/Madrid',
  영국: 'Europe/London', 런던: 'Europe/London',
  독일: 'Europe/Berlin',
  체코: 'Europe/Prague', 프라하: 'Europe/Prague',
  포르투갈: 'Europe/Lisbon',
  그리스: 'Europe/Athens',
  스위스: 'Europe/Zurich',
  미국: 'America/New_York', 뉴욕: 'America/New_York', 로스앤젤레스: 'America/Los_Angeles', 라스베가스: 'America/Los_Angeles',
  캐나다: 'America/Toronto', 밴쿠버: 'America/Vancouver',
  멕시코: 'America/Mexico_City',
  브라질: 'America/Sao_Paulo',
  페루: 'America/Lima',
  아르헨티나: 'America/Argentina/Buenos_Aires',
  쿠바: 'America/Havana',
  칠레: 'America/Santiago',
  호주: 'Australia/Sydney', 시드니: 'Australia/Sydney', 멜버른: 'Australia/Melbourne',
  골드코스트: 'Australia/Brisbane', 브리즈번: 'Australia/Brisbane',
  케언즈: 'Australia/Brisbane', 퍼스: 'Australia/Perth', 애들레이드: 'Australia/Adelaide',
  뉴질랜드: 'Pacific/Auckland',
  피지: 'Pacific/Fiji',
  괌: 'Pacific/Guam',
  사이판: 'Pacific/Saipan',
  하와이: 'Pacific/Honolulu',
  튀르키예: 'Europe/Istanbul',
  '두바이(UAE)': 'Asia/Dubai', 두바이: 'Asia/Dubai',
  모로코: 'Africa/Casablanca',
  이집트: 'Africa/Cairo',
  케냐: 'Africa/Nairobi',
  남아공: 'Africa/Johannesburg',
  요르단: 'Asia/Amman',
}

function resolveTimezone(dest) {
  if (!dest) return null
  for (const [key, tz] of Object.entries(COUNTRY_TIMEZONES)) {
    if (dest.includes(key)) return tz
  }
  return null
}

function LocalTimeTag({ destination }) {
  const [time, setTime] = useState('')
  const tz = resolveTimezone(destination)

  useEffect(() => {
    if (!tz) return
    const fmt = new Intl.DateTimeFormat('ko-KR', {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    const tick = () => setTime(fmt.format(new Date()))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [tz])

  if (!tz || !time) return null
  return (
    <span className="dest-tag dest-tag-time">
      현지 시간&nbsp;<strong style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '0.03em' }}>{time}</strong>
    </span>
  )
}

function estimateCostWon(costText, exchangeRate) {
  const text = String(costText || '').trim()
  if (!text || /무료|없음|free/i.test(text)) return 0
  if (/[₩원만천억]/.test(text)) return parseBudgetWon(text)

  const numbers = text
    .replace(/,/g, '')
    .match(/\d+(?:\.\d+)?/g)
    ?.map(Number)
    .filter(Number.isFinite) || []
  if (!numbers.length) return 0

  const localAmount = numbers.reduce((sum, value) => sum + value, 0) / numbers.length
  return Math.round(localAmount * (Number(exchangeRate.rateToKrw) || 1))
}

function budgetCategoryForStop(stop) {
  const text = `${stop?.name || ''} ${stop?.badge || ''} ${stop?.tags?.join(' ') || ''}`.toLowerCase()
  if (stop?.kind === 'meal' || /식사|점심|저녁|아침|restaurant|cafe|bar|food/.test(text)) return 'meal'
  if (/쇼핑|shopping|shop|market|mall|기념품/.test(text)) return 'shop'
  if (stop?.kind === 'spot' || /입장|티켓|ticket|museum|gallery|전망대|투어/.test(text)) return 'entry'
  return null
}

function expenseCategoryForStop(stop) {
  const text = `${stop?.name || ''} ${stop?.badge || ''} ${stop?.tags?.join(' ') || ''}`.toLowerCase()
  const budgetCategory = budgetCategoryForStop(stop)
  if (budgetCategory) return budgetCategory
  if (/택시|버스|지하철|기차|공항|이동|교통|taxi|bus|train|metro|subway|airport|transfer/.test(text)) return 'transport'
  return 'other'
}

function adjustmentText(category) {
  if (category === 'meal') return '목적지 근처 더 저렴한 식당으로 교체'
  if (category === 'shop') return '쇼핑 시간을 줄이거나 구매 예산 상한 정하기'
  return '무료 전망·산책 코스 또는 저가 입장 옵션으로 대체'
}

function mustVisitTextFromResult(result) {
  return result?.tripInfo?.mustVisit || (Array.isArray(result?.tripInfo?.places) ? result.tripInfo.places.join(', ') : '')
}

function isMustVisitStop(stop, mustVisitText) {
  const name = String(stop?.name || '').toLowerCase()
  return String(mustVisitText || '')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter(Boolean)
    .some(item => name.includes(item) || item.includes(name))
}

export default function AiTravelDurationView() {
  // ── 데이터 상태 ────────────────────────────────────────────
  const [travelData,  setTravelData]  = useState(null)
  const [expenses,    setExpenses]    = useState([])
  const [exchangeRate, setExchangeRate] = useState({ currency: '', rateToKrw: 1 })

  // ── UI 상태 ────────────────────────────────────────────────
  const [activeIdx,          setActiveIdx]          = useState(0)
  const [activeStopIdx,      setActiveStopIdx]      = useState(0)
  const [fatigueVal,         setFatigueVal]         = useState(6)
  const [openTransitKey,     setOpenTransitKey]     = useState('')
  const [transitLoadingKey,  setTransitLoadingKey]  = useState('')
  const [transitResults,     setTransitResults]     = useState({})
  const [routeModeResults,   setRouteModeResults]   = useState({})
  const [selectedTravelMode, setSelectedTravelMode] = useState('WALKING')
  const [activeTransitStepIdx, setActiveTransitStepIdx] = useState(null)
  const [mapReady,      setMapReady]      = useState(false)
  const [mapModalOpen,  setMapModalOpen]  = useState(false)
  const [emergencyMapUrl, setEmergencyMapUrl] = useState('')
  const [albumPhoto,    setAlbumPhoto]    = useState('')
  const [albumPhotoUrl, setAlbumPhotoUrl] = useState('')
  const [albumTitle,    setAlbumTitle]    = useState('')
  const [albumMemo,     setAlbumMemo]     = useState('')
  const [activeModalKey, setActiveModalKey] = useState('')
  const [modalOpen,     setModalOpen]     = useState(false)
  const [imagePodcastEnabled, setImagePodcastEnabled] = useState(false)
  const [mealRerouteOpen, setMealRerouteOpen] = useState(false)
  const [routeCard, setRouteCard]   = useState({ title: '선택한 이동 구간', desc: '이동수단을 선택하면 실제 시간·거리가 표시됩니다.' })
  const [toast, setToast]           = useState({ show: false, icon: '', title: '', msg: '', type: '', actions: [] })
  const [expName, setExpName]       = useState('')
  const [expAmt,  setExpAmt]        = useState('')
  const [expCat,  setExpCat]        = useState('meal')
  const [catPickerOpen, setCatPickerOpen] = useState(false)
  const [budgetEditMode, setBudgetEditMode] = useState('total')
  const [budgetEditValue, setBudgetEditValue] = useState(null)
  const [budgetSaving, setBudgetSaving] = useState(false)
  const [rebudgeting, setRebudgeting] = useState(false)
  const [selectedAdjustmentIndexes, setSelectedAdjustmentIndexes] = useState([])
  const [adjustmentInsufficient, setAdjustmentInsufficient] = useState(false)
  const [rebudgetChangelog, setRebudgetChangelog] = useState([])
  const [safetyData,    setSafetyData]    = useState(null)
  const [safetyLoading, setSafetyLoading] = useState(false)
  const [safetyBadge,   setSafetyBadge]   = useState(null)
  const safetyAbortRef = useRef(null)

  const [weatherData,       setWeatherData]       = useState(null)
  const [weatherLoading,    setWeatherLoading]     = useState(false)
  const [indoorPlaces,      setIndoorPlaces]       = useState(null)
  const [indoorLoading,     setIndoorLoading]      = useState(false)
  const [indoorPanelOpen,   setIndoorPanelOpen]    = useState(false)

  const [fatigueModalOpen,  setFatigueModalOpen]  = useState(false)
  const [fatigueCafes,      setFatigueCafes]      = useState(null)
  const [fatigueCafeLoading, setFatigueCafeLoading] = useState(false)
  const [selectedCafeKey,   setSelectedCafeKey]   = useState(null)
  const [restStop,          setRestStop]           = useState(null)
  const [fatigueApplied,    setFatigueApplied]    = useState(false)

  const toastTimerRef        = useRef(null)
  const lastAutoExpNameRef   = useRef('')

  // ── 파생값 ────────────────────────────────────────────────
  const schedule   = travelData?.schedule   || []
  const cityData   = travelData?.cityData   || {}
  const cityGroups = travelData?.cityGroups || []
  const total      = travelData?.totalBudgetWon || 0
  const selectedBudgetCategory = BUDGET_CATEGORIES.find(category => category.key === expCat) || BUDGET_CATEGORIES[0]

  const fmt = makeFormatters(exchangeRate)
  const { formatKrw, formatExpense, formatEurAsKrw, localToKrw, formatLocalAmount, formatExpenseLogAmount, localizeMoneyText } = fmt

  const day             = schedule[activeIdx]
  const currentCityData = cityData[day?.base]
  const dayStops        = useMemo(
    () => currentCityData ? getDayStops(currentCityData.stops || []) : [],
    [currentCityData]
  )
  const statusLabel     = day?.today ? 'LIVE' : day?.done ? 'DONE' : 'UPCOMING'

  const currentDayNumber  = getCurrentDayNumber(schedule, activeIdx)
  const dailyBudgetWon    = getDailyBudgetWon(total, schedule)
  const currentDayExpenses = getCurrentDayExpenses(expenses, schedule, activeIdx)
  const totalSpent        = getTotalSpent(expenses)
  const currentDaySpent   = getCurrentDaySpent(expenses, schedule, activeIdx)
  const todayAvailable    = getTodayAvailableBudget(total, expenses, schedule, activeIdx)
  const categoryBreakdown = getCategoryBreakdown(expenses, schedule, activeIdx)
  const budgetPct         = total > 0 ? Math.min(100, (totalSpent / total) * 100) : 0
  const mustVisitText     = mustVisitTextFromResult(readGeneratedPlanResult())
  const adjustmentCandidates = useMemo(() => {
    return dayStops
      .slice(activeStopIdx + 1)
      .map((stop, offset) => {
        const category = budgetCategoryForStop(stop)
        const estimateWon = estimateCostWon(stop.cost, exchangeRate)
        if (!category || estimateWon <= 0) return null
        return {
          stop,
          category,
          estimateWon,
          index: activeStopIdx + 1 + offset,
          mustVisit: isMustVisitStop(stop, mustVisitText),
          suggestion: adjustmentText(category),
        }
      })
      .filter(Boolean)
  }, [dayStops, activeStopIdx, exchangeRate, mustVisitText])
  const remainingAdjustableCost = adjustmentCandidates.reduce((sum, item) => sum + item.estimateWon, 0)
  const budgetRisk = dailyBudgetWon > 0 && remainingAdjustableCost > 0 && todayAvailable < remainingAdjustableCost
  const budgetShortfall = budgetRisk
    ? (todayAvailable < 0 ? -todayAvailable : remainingAdjustableCost - todayAvailable)
    : 0
  const selectedAdjustmentCost = adjustmentCandidates
    .filter(candidate => selectedAdjustmentIndexes.includes(candidate.index))
    .reduce((sum, candidate) => sum + candidate.estimateWon, 0)

  const fatigueRingCirc   = 2 * Math.PI * 24
  const fatigueRingOffset = fatigueRingCirc - (fatigueVal / 10) * fatigueRingCirc
  const fatigueRingColor  = fatigueVal >= 8 ? 'var(--rose)' : fatigueVal >= 6 ? 'var(--amber)' : 'var(--green)'

  const displayStops = useMemo(() => {
    if (!restStop) return dayStops
    const arr = [...dayStops]
    arr.splice(activeStopIdx + 1, 0, restStop)
    return arr
  }, [dayStops, restStop, activeStopIdx])

  const mapState = useCallback(() => ({
    schedule, activeIdx, activeStopIdx, selectedTravelMode,
    activeTransitStepIdx, routeModeResults, cityData, transitResults,
    destination: travelData?.destination,
  }), [schedule, activeIdx, activeStopIdx, selectedTravelMode, activeTransitStepIdx, routeModeResults, cityData, transitResults, travelData?.destination])

  const getActiveEmergencyPoint = useCallback(() => {
    if (!day) return null
    const selectedRoute = getRouteSegment(day.base, activeStopIdx, cityData)
    const points = selectedRoute.filter(pt => Number.isFinite(pt?.lat) && Number.isFinite(pt?.lng))
    if (!points.length) return null
    const center = points.reduce((acc, pt) => ({ lat: acc.lat + pt.lat, lng: acc.lng + pt.lng }), { lat: 0, lng: 0 })
    return {
      lat: center.lat / points.length,
      lng: center.lng / points.length,
      routeLabel: points.length > 1 ? '선택 경로 중간 지점' : '현재 활성 카드 위치',
    }
  }, [day, activeStopIdx, cityData])

  // ── 지도 갱신 ─────────────────────────────────────────────
  const refreshMap = useCallback(() => {
    if (!mapReady || !window.google || !day) return
    renderRouteMap('liveMap', mapState())
    if (mapModalOpen) renderRouteMap('modalMap', mapState())
  }, [mapReady, mapModalOpen, mapState, day])

  // ── 초기화: 여행 데이터 로드 ───────────────────────────────
  useEffect(() => {
    buildGeneratedTravelData().then(data => { if (data) setTravelData(data) })
  }, [])

  // ── 초기화: 저장된 지출 로드 ───────────────────────────────
  useEffect(() => {
    if (!travelData) return
    const planId = getGeneratedPlanId(readGeneratedPlanResult())
    if (!planId) return
    fetchSavedExpenses(planId)
      .then(saved => { if (Array.isArray(saved)) setExpenses(saved.map(normalizeSavedExpense)) })
      .catch(() => {})
  }, [travelData])

  // ── 초기화: 환율 로드 ─────────────────────────────────────
  useEffect(() => {
    if (!travelData) return
    const destination = readGeneratedPlanResult()?.tripInfo?.country || travelData.destination
    fetchExchangeRate(destination)
      .then(data => {
        if (data) setExchangeRate({ currency: data.currency || 'KRW', rateToKrw: Number(data.rateToKrw) || 1 })
      })
      .catch(() => {})
  }, [travelData])

  // ── 날씨: 일정 날짜별 조회 ────────────────────────────────────
  useEffect(() => {
    if (!travelData) return
    const planResult  = readGeneratedPlanResult()
    const destination = planResult?.tripInfo?.country || travelData.destination
    const startDate   = planResult?.tripInfo?.startDate
    if (!destination) return

    let date
    if (startDate) {
      const base = new Date(startDate)
      base.setDate(base.getDate() + activeIdx)
      date = base.toISOString().slice(0, 10)
    } else {
      const today = new Date()
      today.setDate(today.getDate() + activeIdx)
      date = today.toISOString().slice(0, 10)
    }

    setWeatherData(null)
    setIndoorPlaces(null)
    setIndoorPanelOpen(false)
    setFatigueCafes(null)
    setSelectedCafeKey(null)
    setRestStop(null)
    setFatigueApplied(false)
    setWeatherLoading(true)
    fetchDayWeather(destination, date)
      .then(data => setWeatherData(data))
      .catch(() => {})
      .finally(() => setWeatherLoading(false))
  }, [travelData, activeIdx])

  // ── 초기화: Google Maps ────────────────────────────────────
  useEffect(() => {
    function initMap() {
      if (!window.google) return
      setMapReady(true)
    }
    window.initMap = initMap
    if (window.google?.maps) {
      initMap()
    } else if (!document.getElementById(GOOGLE_MAP_SCRIPT_ID)) {
      const script = document.createElement('script')
      script.id = GOOGLE_MAP_SCRIPT_ID
      script.src = GOOGLE_MAP_SCRIPT_SRC
      script.async = true
      script.defer = true
      document.body.appendChild(script)
    }
    return () => { if (window.initMap === initMap) delete window.initMap }
  }, [])

  // ── 지도 갱신 (상태 변경 시) ───────────────────────────────
  useEffect(() => { refreshMap() }, [refreshMap])

  // ── mapReady 시 초기 경로 조회 ────────────────────────────
  useEffect(() => {
    if (!mapReady || !travelData) return
    const state = mapState()
    requestSimpleRoute(activeStopIdx, 'walk', state, (key, result) => {
      setRouteModeResults(prev => ({ ...prev, [key]: result }))
    })
    requestSimpleRoute(activeStopIdx, 'taxi', state, (key, result) => {
      setRouteModeResults(prev => ({ ...prev, [key]: result }))
    })
    renderRouteMap('liveMap', state)
  }, [mapReady, travelData]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 하루 전체 정류장 택시·대중교통 선조회 ────────────────────
  useEffect(() => {
    if (!mapReady || !travelData || !day) return
    const state = { schedule, activeIdx, cityData, destination: travelData.destination }
    dayStops.forEach((_, i) => {
      if (i === 0) return
      requestSimpleRoute(i, 'walk', state, (key, result) => {
        setRouteModeResults(prev => ({ ...prev, [key]: result }))
      })
      requestSimpleRoute(i, 'taxi', state, (key, result) => {
        setRouteModeResults(prev => ({ ...prev, [key]: result }))
      })
      requestTransitRoute(i, { schedule, activeIdx, cityData, day: day.day }, ({ transitKey, transitResult, routeKey, routeValue }) => {
        setTransitResults(prev => ({ ...prev, [transitKey]: transitResult }))
        if (routeKey && routeValue) setRouteModeResults(prev => ({ ...prev, [routeKey]: routeValue }))
      })
    })
  }, [mapReady, travelData, activeIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 지출 입력창 자동 채우기 ────────────────────────────────
  useEffect(() => {
    const stop = dayStops[activeStopIdx]
    if (!stop?.name) return
    const nextName = `${stop.name} 지출`
    if (!expName.trim() || expName === lastAutoExpNameRef.current) {
      setExpName(nextName)
      lastAutoExpNameRef.current = nextName
    }
    setExpCat(expenseCategoryForStop(stop))
  }, [activeIdx, activeStopIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!budgetRisk || adjustmentCandidates.length === 0) {
      setSelectedAdjustmentIndexes([])
      return
    }

    // 커버해야 할 부족분: 이미 초과됐으면 초과액, 아직 초과 전이면 남은 일정비 - 가용예산
    const shortfall = todayAvailable < 0
      ? -todayAvailable
      : remainingAdjustableCost - todayAvailable

    const greedySelect = (pool) => {
      const sorted = [...pool].sort((a, b) => b.estimateWon - a.estimateWon)
      let accumulated = 0
      const indexes = []
      for (const candidate of sorted) {
        indexes.push(candidate.index)
        accumulated += candidate.estimateWon
        if (accumulated >= shortfall) return { indexes, covered: true }
      }
      return { indexes, covered: false }
    }

    const nonMustVisit = adjustmentCandidates.filter(c => !c.mustVisit)
    const mustVisit    = adjustmentCandidates.filter(c => c.mustVisit)

    // 1차: non-mustVisit으로 시도
    const first = greedySelect(nonMustVisit.length ? nonMustVisit : adjustmentCandidates)
    if (first.covered) {
      setAdjustmentInsufficient(false)
      setSelectedAdjustmentIndexes(first.indexes)
      return
    }

    // 2차: non-mustVisit 전부 + mustVisit 추가 시도
    if (nonMustVisit.length && mustVisit.length) {
      const allSorted = [...adjustmentCandidates].sort((a, b) => b.estimateWon - a.estimateWon)
      let accumulated = 0
      const indexes = []
      for (const candidate of allSorted) {
        indexes.push(candidate.index)
        accumulated += candidate.estimateWon
        if (accumulated >= shortfall) break
      }
      const covered = accumulated >= shortfall
      setAdjustmentInsufficient(!covered)
      setSelectedAdjustmentIndexes(indexes)
      return
    }

    // 아무리 해도 커버 불가
    setAdjustmentInsufficient(!first.covered)
    setSelectedAdjustmentIndexes(first.indexes)
  }, [budgetRisk, adjustmentCandidates, todayAvailable, remainingAdjustableCost])

  // ── 구간 이동 시 안전 뱃지 자동 분석 (백그라운드) ────────────
  useEffect(() => {
    const stop = dayStops[activeStopIdx]
    if (!stop?.lat || !stop?.lng) { setSafetyBadge(null); return }

    safetyAbortRef.current?.abort()
    const controller = new AbortController()
    safetyAbortRef.current = controller

    setSafetyBadge(null)
    setSafetyData(null)

    const base = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
    fetch(`${base}/api/safety/incidents?lat=${stop.lat}&lng=${stop.lng}&radius=2&days=90`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        const icon = data.level === 'warn' ? '⚠️' : data.level === 'caution' ? '🔶' : '✅'
        const label = data.level === 'warn' ? '위험 구간' : data.level === 'caution' ? '주의 구간' : '안전 구간'
        setSafetyBadge({ level: data.level, icon, label, desc: data.safeRouteDesc })
        setRouteCard(prev => ({ ...prev, title: `${icon} ${label}: ${stop.name || '현재 구간'}` }))
      })
      .catch(() => {})

    return () => controller.abort()
  }, [activeIdx, activeStopIdx]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── 토스트 ────────────────────────────────────────────────
  const showToast = useCallback((icon, title, msg, type, actions = []) => {
    clearTimeout(toastTimerRef.current)
    setToast({ show: true, icon, title, msg, type, actions })
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 6000)
  }, [])

  // ── 스탑 선택 ─────────────────────────────────────────────
  const selectStop = useCallback((nextIdx) => {
    const clamped = Math.max(0, Math.min(nextIdx, dayStops.length - 1))
    setActiveStopIdx(clamped)
    setSelectedTravelMode('WALKING')
    setActiveTransitStepIdx(null)
    setOpenTransitKey('')
    setCatPickerOpen(false)
  }, [dayStops.length])

  // ── 날 선택 ───────────────────────────────────────────────
  const selectDay = useCallback((idx) => {
    setActiveIdx(idx)
    setActiveStopIdx(0)
    setSelectedTravelMode('WALKING')
    setActiveTransitStepIdx(null)
    setOpenTransitKey('')
    setCatPickerOpen(false)
  }, [])

  // ── 지출 추가 ─────────────────────────────────────────────
  function handleAddExpense() {
    const name = expName.trim()
    const amountLocal = parseFloat(expAmt) || 0
    if (!name || !amountLocal) return
    const amountKrw = localToKrw(amountLocal)
    const over = expCat === 'meal' && total > 0 && totalSpent + amountKrw > total
    const expense = {
      name, cat: expCat, day: currentDayNumber, itemIndex: activeStopIdx,
      source: 'manual', amountLocal: +amountLocal.toFixed(2), amountKrw,
      currency: exchangeRate.currency, over,
    }
    setExpenses(prev => [expense, ...prev])
    setExpAmt('')
    const stop = dayStops[activeStopIdx]
    const nextName = stop?.name ? `${stop.name} 지출` : ''
    setExpName(nextName)
    lastAutoExpNameRef.current = nextName

    const planId = getGeneratedPlanId(readGeneratedPlanResult())
    if (planId) persistExpense(planId, expense).catch(() => {})

    if (over) {
      setMealRerouteOpen(true)
      showToast('⚠️', `${formatLocalAmount(amountLocal)} 식사 초과`, '예산 범위 내 근처 식당으로 재조회할까요?', 'warn', [
        { label: '재조회', action: '_dismiss', primary: true },
        { label: '무시',   action: '_dismiss' },
      ])
    } else {
      const msg = total ? `오늘 남은 예산 ${formatExpense(Math.max(0, todayAvailable - amountKrw))}` : '카테고리 비중이 업데이트되었습니다'
      showToast('✓', `${formatLocalAmount(amountLocal)} 입력됨`, msg, 'ok')
    }
  }

  const handleDeleteExpense = useCallback((expense) => {
    setExpenses(prev => prev.filter(e => e !== expense))
    const planId = getGeneratedPlanId(readGeneratedPlanResult())
    if (planId && expense.id) deleteExpense(planId, expense.id).catch(() => {})
  }, [])

  const handleRebudgetDay = useCallback(async () => {
    const planResult = readGeneratedPlanResult()
    const planId = getGeneratedPlanId(planResult)
    if (!planId) {
      showToast('!', '재조정 불가', '로그인 상태에서 저장된 일정만 재조정할 수 있습니다.', 'warn')
      return
    }

    setRebudgeting(true)
    setRebudgetChangelog([])
    try {
      // 선택하지 않은 항목(유지할 항목)의 KRW 비용 합산
      const lockedCostWon = adjustmentCandidates
        .filter(c => !selectedAdjustmentIndexes.includes(c.index))
        .reduce((sum, c) => sum + c.estimateWon, 0)

      // 재조정 전 스냅샷
      const beforeSnapshot = {}
      adjustmentCandidates.forEach(c => {
        if (selectedAdjustmentIndexes.includes(c.index)) {
          beforeSnapshot[c.index] = { name: c.stop?.name || '', cost: c.stop?.cost || '' }
        }
      })

      const result = await rebudgetPlanDay(planId, {
        dayIndex: activeIdx,
        activeItemIndex: activeStopIdx,
        selectedItemIndexes: selectedAdjustmentIndexes,
        remainingBudgetWon: todayAvailable,
        remainingCostWon: selectedAdjustmentCost || remainingAdjustableCost,
        lockedCostWon,
        exchangeRateToKrw: exchangeRate.rateToKrw || 1,
        mustVisit: mustVisitTextFromResult(planResult),
      })

      if (result?.planData) {
        sessionStorage.setItem('aiPlanResult', JSON.stringify({
          ...planResult,
          planData: result.planData,
          planId,
        }))
        const nextTravelData = await buildGeneratedTravelData()
        if (nextTravelData) setTravelData(nextTravelData)
        setActiveStopIdx(Math.min(activeStopIdx, result.day?.items?.length ? result.day.items.length - 1 : activeStopIdx))

        // 변경 내역 계산
        if (result.day?.items) {
          const changelog = selectedAdjustmentIndexes
            .map(idx => {
              const before = beforeSnapshot[idx]
              const after  = result.day.items[idx]
              if (!before || !after) return null
              const nameChanged = before.name !== (after.name || '')
              const costChanged = before.cost !== (after.cost || '')
              if (!nameChanged && !costChanged) return null
              return { idx, beforeName: before.name, beforeCost: before.cost, afterName: after.name || '', afterCost: after.cost || '' }
            })
            .filter(Boolean)
          setRebudgetChangelog(changelog)
        }
      }
      showToast('✓', '예산 맞춤 재조정 완료', result?.summary || '오늘 남은 일정이 예산에 맞게 조정되었습니다.', 'ok')
    } catch (err) {
      showToast('!', '재조정 실패', err.message || '일정 재조정에 실패했습니다.', 'warn')
    } finally {
      setRebudgeting(false)
    }
  }, [activeIdx, activeStopIdx, selectedAdjustmentIndexes, selectedAdjustmentCost, todayAvailable, remainingAdjustableCost, showToast])

  const handleBudgetSave = useCallback(async () => {
    const nights = schedule.length
    const inputWon = Math.round(parseFloat(budgetEditValue) * 10000)
    if (!inputWon || inputWon <= 0) {
      showToast('⚠', '금액을 입력해주세요', '0보다 큰 금액을 입력해야 합니다.', 'warn')
      return
    }
    const newTotal = budgetEditMode === 'daily' ? inputWon * (nights || 1) : inputWon
    if (newTotal > 100_000_000) {
      const maxMan = budgetEditMode === 'daily'
        ? Math.floor(10000 / (nights || 1)).toLocaleString()
        : '10,000'
      showToast('⚠', '예산이 너무 큽니다', `최대 ${maxMan}만원(1억)까지 입력 가능합니다.`, 'warn')
      return
    }

    setBudgetSaving(true)
    try {
      const planId = getGeneratedPlanId(readGeneratedPlanResult())
      if (planId) await updatePlanBudget(planId, newTotal)

      setTravelData(prev => ({ ...prev, totalBudgetWon: newTotal }))
      const planResult = readGeneratedPlanResult()
      if (planResult) {
        sessionStorage.setItem('aiPlanResult', JSON.stringify({
          ...planResult,
          tripInfo: { ...(planResult.tripInfo || {}), budget: String(newTotal) },
        }))
      }
      setBudgetEditValue(null)
      showToast('✓', '예산 업데이트 완료', `총 예산이 ${Math.round(newTotal / 10000).toLocaleString()}만원으로 변경되었습니다.`, 'ok')
    } catch {
      showToast('!', '저장 실패', '예산 저장에 실패했습니다. 다시 시도해주세요.', 'warn')
    } finally {
      setBudgetSaving(false)
    }
  }, [budgetEditMode, budgetEditValue, schedule, showToast])


  // ── 액션 핸들러 ───────────────────────────────────────────
  const handle = useCallback(async (action) => {
    switch (action) {
      case 'wxReroute': {
        setIndoorPanelOpen(true)
        if (indoorPlaces) break
        const activeStop = dayStops[activeStopIdx]
        const pt = activeStop?.lat && activeStop?.lng
          ? { lat: activeStop.lat, lng: activeStop.lng }
          : getActiveEmergencyPoint()
        if (!pt) {
          setIndoorPanelOpen(false)
          showToast('!', '실내 활동', '현재 위치 정보를 확인할 수 없습니다.', 'warn'); break
        }
        setIndoorLoading(true)
        fetchIndoorPlaces(pt, 2000)
          .then(data => setIndoorPlaces(data))
          .catch(() => showToast('!', '실내 장소 조회 실패', '잠시 후 다시 시도해 주세요.', 'warn'))
          .finally(() => setIndoorLoading(false))
        break
      }
      case 'safeRoute': {
        const currentStop = dayStops[activeStopIdx]
        const lat = currentStop?.lat
        const lng = currentStop?.lng
        if (!lat || !lng) {
          setRouteCard({ title: '안전 우회 경로', desc: '현재 구간 위치 정보가 없습니다.' })
          showToast('🛡', '안전 우회', '위치 정보를 찾을 수 없습니다.', 'warn')
          break
        }
        setSafetyLoading(true)
        setSafetyData(null)
        try {
          const data = await apiGet(`/safety/incidents?lat=${lat}&lng=${lng}&radius=2&days=90`)
          setSafetyData(data)
          const levelIcon = data.level === 'warn' ? '⚠️' : data.level === 'caution' ? '🔶' : '✅'
          setRouteCard({ title: `${levelIcon} 안전 분석: ${currentStop.name || '현재 구간'}`, desc: data.safeRouteDesc })
          if (data.level === 'warn' || data.level === 'caution') {
            renderSafeRouteMap('liveMap', mapState(), ({ extraMin, hasAlternative }) => {
              if (hasAlternative && extraMin !== null) {
                const extraLabel = extraMin > 0 ? ` · 우회 시 +${extraMin}분 추가` : extraMin < 0 ? ` · 우회 시 ${Math.abs(extraMin)}분 단축` : ' · 소요 시간 동일'
                setRouteCard(prev => ({ ...prev, desc: prev.desc + extraLabel }))
              } else if (!hasAlternative) {
                setRouteCard(prev => ({ ...prev, desc: prev.desc + ' · 대안 경로 없음, 주의하며 이동' }))
              }
            })
            showToast('🛡', '안전 우회 경로 적용', '위험 구간(빨강)을 피해 대로변(초록)으로 안내합니다.', 'ok')
          } else {
            showToast('🛡', '안전 구간 확인됨', '현재 경로가 안전합니다.', 'ok')
          }
        } catch {
          setRouteCard({ title: '안전 우회 경로', desc: '안전 데이터를 불러오지 못했습니다.' })
          showToast('🛡', '안전 우회', '데이터 조회 실패, 잠시 후 다시 시도해주세요.', 'warn')
        } finally {
          setSafetyLoading(false)
        }
        break
      }
      case 'restore':
        setMealRerouteOpen(false)
        setToast(t => ({ ...t, show: false }))
        setSafetyData(null)
        setSafetyBadge(null)
        setRouteCard({ title: '현재 구간 경로', desc: '이동 수단을 선택하면 경로가 표시됩니다.' })
        renderRouteMap('liveMap', mapState())
        break
      case 'applyMeal':
        setMealRerouteOpen(false)
        setRouteCard({ title: `식당 변경: 평균 ${formatEurAsKrw(19)} 타파스 바 적용`, desc: '루트 420m 이내 · 관광 순서 유지됨' })
        showToast('✓', '식당 변경 적용', '기존 관광 루트와 크게 벗어나지 않는 대체 식당으로 조정되었습니다.', 'ok'); break
      case 'fatigueReroute': {
        setFatigueModalOpen(true)
        if (fatigueCafes) break
        const fatigueStop = dayStops[activeStopIdx]
        const fatiguePt   = fatigueStop?.lat && fatigueStop?.lng
          ? { lat: fatigueStop.lat, lng: fatigueStop.lng }
          : getActiveEmergencyPoint()
        if (!fatiguePt) break
        setFatigueCafeLoading(true)
        fetchNearbyCafes(fatiguePt, 800)
          .then(data => setFatigueCafes(data))
          .catch(() => {})
          .finally(() => setFatigueCafeLoading(false))
        break
      }
      case 'applyFatigue': {
        setFatigueModalOpen(false)
        setFatigueApplied(true)
        if (fatigueVal >= 7) {
          setSelectedTravelMode('TAXI')
          setRouteCard({ title: '피로도 루트 적용됨', desc: '남은 구간 택시 이동으로 전환됩니다.' })
        }
        if (selectedCafeKey) {
          const allPlaces = (fatigueCafes?.groups || []).flatMap(g => g.places)
          const cafe = allPlaces.find(p => p.id === selectedCafeKey)
          if (cafe) {
            setRestStop({
              t: '휴식', name: cafe.name, badge: '카페 휴식', kind: 'rest',
              desc: `${cafe.distanceText ? cafe.distanceText + ' · ' : ''}피로도 회복을 위한 카페 휴식`,
              cost: '', tags: ['휴식 추가됨', cafe.durationText || ''].filter(Boolean),
              safety: 'safe', lat: cafe.lat, lng: cafe.lng, isInserted: true,
            })
          }
        }
        showToast('✓', '휴식 루트 적용됨', fatigueVal >= 7
          ? '남은 구간 택시 전환 + 카페 휴식이 일정에 추가됩니다.'
          : '카페 휴식이 현재 일정에 추가됩니다.', 'ok')
        break
      }
      case 'openMapModal':
        setMapModalOpen(true); break
      case 'routeGuide': {
        const url = buildGoogleMapsRouteUrl({ schedule, activeIdx, activeStopIdx, cityData, selectedTravelMode, routeModeResults })
        if (url) window.open(url, '_blank', 'noopener'); break
      }
      case 'openEmergencyMap':
        if (emergencyMapUrl) window.open(emergencyMapUrl, '_blank', 'noopener'); break
      case '_dismiss':
        setToast(t => ({ ...t, show: false })); break
    }
  }, [showToast, fatigueVal, formatEurAsKrw, schedule, activeIdx, activeStopIdx, cityData, selectedTravelMode, routeModeResults, emergencyMapUrl, dayStops])

  // ── 모달 ──────────────────────────────────────────────────
  const openModal  = useCallback((key) => {
    if (key === 'album') { setAlbumPhoto(''); setAlbumPhotoUrl(''); setAlbumTitle(''); setAlbumMemo('') }
    setActiveModalKey(key); setModalOpen(true)
  }, [])
  const closeModal = useCallback(() => {
    setImagePodcastEnabled(false)
    setModalOpen(false)
    setActiveModalKey('')
  }, [])

  const saveAlbumMemory = useCallback(() => {
    if (!albumPhoto) { showToast('!', '사진 필요', '사진을 먼저 등록해주세요.', 'warn'); return }
    const token = localStorage.getItem('tripHelperToken')
    if (!token) { closeModal(); return }
    const currentStop = dayStops[activeStopIdx]
    const planResult  = readGeneratedPlanResult()
    const payload = {
      photoUrl: albumPhotoUrl || null, memo: albumMemo || null,
      title: albumTitle || null,
      locationName: currentStop?.name || null, dayNum: day?.day || 1,
      destination: travelData?.destination || '내 여행',
      planId: getGeneratedPlanId(planResult),
    }
    const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
    fetch(`${apiBase}/api/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }).then(r => {
      closeModal()
      if (r.ok) showToast('✓', '등록 완료', '여행 앨범에 사진이 저장되었습니다.', 'ok')
      else showToast('!', '등록 실패', '사진 저장에 실패했습니다. 다시 시도해주세요.', 'warn')
    }).catch(() => {
      closeModal()
      showToast('!', '등록 실패', '네트워크 오류로 저장에 실패했습니다.', 'warn')
    })
  }, [dayStops, activeStopIdx, albumPhotoUrl, albumTitle, albumMemo, day, travelData, closeModal, showToast])

  // ── 트랜짓 경로 요청 ──────────────────────────────────────
  const handleTransitRequest = useCallback((stopIdx) => {
    if (!day) return
    const key = transitPanelKey(day.day, stopIdx)
    setOpenTransitKey(key)
    setActiveTransitStepIdx(null)
    setSelectedTravelMode('TRANSIT')
    setTransitLoadingKey(key)
    requestTransitRoute(stopIdx, { schedule, activeIdx, cityData, day: day.day }, ({ transitKey, transitResult, routeKey, routeValue }) => {
      setTransitLoadingKey('')
      setTransitResults(prev => ({ ...prev, [transitKey]: transitResult }))
      if (routeKey && routeValue) setRouteModeResults(prev => ({ ...prev, [routeKey]: routeValue }))
      setOpenTransitKey(transitKey)
    })
  }, [day, schedule, activeIdx, cityData])

  // ── 택시/도보 경로 요청 ───────────────────────────────────
  const handleSimpleRouteRequest = useCallback((stopIdx, mode) => {
    if (!day) return
    const key = modeResultKey(day.day, stopIdx, mode)
    if (routeModeResults[key]) return
    requestSimpleRoute(stopIdx, mode, { schedule, activeIdx, cityData, destination: travelData.destination }, (k, result) => {
      setRouteModeResults(prev => ({ ...prev, [k]: result }))
    })
  }, [day, schedule, activeIdx, cityData, routeModeResults, travelData?.destination])

  if (!travelData) {
    return (
      <div className="ai-travel-duration-page">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--muted)' }}>
          일정을 불러오는 중...
        </div>
      </div>
    )
  }

  const modalTitles = {
    translate: '실시간 번역', emergency: '긴급 정보', nearby: '주변 편의시설',
    hotel: '숙소 전략', budget: '예산 분석', imageTranslate: '이미지 번역',
    album: '여행 앨범', safety: '야간 안전 정보',
  }

  return (
    <div className="ai-travel-duration-page">

      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-in">
          <a className="brand" href="/home"><span className="brand-icon">✈</span><span>폰가이즈</span></a>
          <div className="topbar-trip">
            <strong>{travelData.destination} 여행</strong>
            <span className="sep">›</span>
            <span>Day {String(day?.day || 1).padStart(2, '0')} · {currentCityData?.title || travelData.routeText}</span>
            <span className="live-pill"><span className="live-dot"></span>LIVE</span>
          </div>
        </div>
      </header>

      {/* HERO */}
      <section
        className="dest-hero"
        style={travelData.isGenerated ? {
          background: `linear-gradient(to bottom, rgba(15,39,68,.08) 0%, rgba(15,39,68,.5) 60%, rgba(15,39,68,.88) 100%), url("${heroImageForDestination(travelData.destination)}") center/cover`,
        } : undefined}
      >
        <div className="dest-hero-inner">
          <div className="dest-left">
            <div className="dest-city">{travelData.heroTitle}</div>
            <div className="dest-meta">
              <span className="dest-tag"><span className="live-dot"></span> Day {String(day?.day || 1).padStart(2, '0')} 진행 중</span>
              <span className="dest-tag">{travelData.isGenerated ? 'AI 생성 일정 기반으로 여행을 진행합니다' : 'AI 생성 일정 기반'}</span>
              <LocalTimeTag destination={travelData.destination} />
            </div>
          </div>
          <div className="dest-right">
            <div className="budget-badge">
              <div className="budget-label">예산 소진율</div>
              <div className="budget-bar"><div className="budget-bar-fill" style={{ width: `${budgetPct}%` }}></div></div>
              <div className="budget-nums">
                <span className="budget-spent">{formatExpense(totalSpent)}</span>
                <span className="budget-total">/ {total ? formatKrw(total) : '₩0'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* WORKSPACE */}
      <div className="workspace">

        {/* LEFT RAIL */}
        <aside className="left-rail">
          <div className="c-card">
            <div className="c-card-title">일정</div>
            <div className="city-list">
              <CityAccordion
                travelData={travelData} schedule={schedule} cityData={cityData}
                cityGroups={cityGroups} activeIdx={activeIdx} onSelectDay={selectDay}
              />
            </div>
          </div>
          <div className="c-card">
            <div className="c-card-title">도구</div>
            <div className="tool-pad">
              {TOOL_ITEMS.map(({ modal, Icon, label }) => (
                <button key={modal} className="tool-pad-btn" onClick={() => openModal(modal)}>
                  <Icon className="tool-pad-icon" aria-hidden="true" />{label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* FEED */}
        <section className="feed">

          {/* 타임라인 */}
          <div className="sec budget-sec">
            <div className="sec-head">
              <div>
                <div className="sec-kicker">DAY {String(day?.day || 1).padStart(2, '0')} · {statusLabel}</div>
                <h2>{currentCityData?.title || '일정을 불러오는 중'}</h2>
                <p className="sec-desc">{currentCityData?.desc || '생성된 여행 일정이 있으면 이곳에 오늘의 동선이 표시됩니다.'}</p>
              </div>
              <button className="sec-action-btn" onClick={() => handle('restore')}>기존 복귀</button>
            </div>
            <div className="sec-body">
              <div className="tl">
                {displayStops.map((stop, i) => {
                  if (stop.isInserted) return (
                    <div key="rest-stop" className="tl-node">
                      <div className="tl-t">{stop.t}</div>
                      <div className="tl-axis">
                        <span className="tl-dot rest inserted"></span>
                      </div>
                      <div className="tl-card tl-card--rest">
                        <div className="tl-card-top">
                          <h3>☕ {stop.name}</h3>
                          <span className="tl-badge rest">{stop.badge}</span>
                        </div>
                        <p>{stop.desc}</p>
                        <div className="tl-tags">
                          {stop.tags.map((t, ti) => <span key={ti} className="tl-tag">{t}</span>)}
                        </div>
                        <div className="tl-card-actions">
                          <button
                            className="tl-next-btn"
                            onClick={e => { e.stopPropagation(); setRestStop(null); setFatigueApplied(false) }}
                          >
                            일정에서 제거
                          </button>
                        </div>
                      </div>
                    </div>
                  )

                  const transitState    = { day: day?.day, routeModeResults, transitResults }
                  const transport       = getTransportPlan(stop, i, transitState)
                  const route           = getRouteInfo(dayStops, stop, i)
                  const transitKey      = transitPanelKey(day?.day, i)
                  const transitOpen     = openTransitKey === transitKey
                  const transitOptions  = getTransitDemoOptions(stop, i, { day: day?.day, transitResults, transitLoadingKey, routeModeResults })
                  const transitDetails  = getTransitDetailOptions(stop, i, { day: day?.day, transitResults, transitLoadingKey })
                  const detailOpen      = i === activeStopIdx && selectedTravelMode === 'TRANSIT' && transitDetails.length > 0
                  const activeDetailStep = i === activeStopIdx ? activeTransitStepIdx : null
                  const activeMode      = i === activeStopIdx ? selectedTravelMode : ''

                  return (
                    <div key={i} className="tl-node">
                      <div className="tl-t">{stop.t}</div>
                      <div className="tl-axis">
                        <span className={`tl-dot ${stop.kind}${i === activeStopIdx ? ' now' : ''}`}></span>
                      </div>
                      <div>
                        <div
                          className={`tl-card${i === activeStopIdx ? ' active' : ''}${transitOpen ? ' transit-open' : ''}`}
                          onClick={e => { if (e.target.closest('button,input,select,textarea')) return; selectStop(i) }}
                        >
                          <div className="tl-card-top">
                            <h3>{stop.name}</h3>
                            <span className={`tl-badge ${stop.kind}`}>{stop.badge}</span>
                          </div>
                          <p>{localizeMoneyText(stop.desc)}</p>
                          <div className="tl-tags">
                            {stop.tags.map((t, ti) => <span key={ti} className="tl-tag">{localizeMoneyText(t)}</span>)}
                            {stop.cost && <span className="tl-tag cost">예상 지출 {localizeMoneyText(stop.cost)}</span>}
                            {stop.safety === 'warn' && <span className="tl-tag warn">⚠ 야간 주의</span>}
                          </div>
                          <div className="tl-transport">
                            <div className="tl-route-flow">
                              <div className="tl-route-place">
                                <span className="tl-route-label">출발</span>
                                <span className="tl-route-name">{route.origin}</span>
                              </div>
                              <div className="tl-route-mid">
                                <div className="tl-route-arrow">→</div>
                                <div className="tl-transport-main">
                                  <span className="tl-transport-label">{route.label}</span>
                                  <div className="tl-transport-rec">{transport.rec} <span>{transport.detail}</span></div>
                                </div>
                                <button
                                  className="tl-transit-toggle"
                                  onClick={e => {
                                    e.stopPropagation()
                                    setActiveStopIdx(i)
                                    setActiveTransitStepIdx(null)
                                    setCatPickerOpen(false)
                                    setOpenTransitKey(prev => prev === transitKey ? '' : transitKey)
                                  }}
                                >
                                  {transitOpen ? '이동수단 접기' : '이동수단 보기'}
                                </button>
                              </div>
                              <div className="tl-route-place dest">
                                <span className="tl-route-label">도착</span>
                                <span className="tl-route-name">{route.destination}</span>
                              </div>
                            </div>
                            <div className="tl-transit-panel">
                              <div className="tl-transit-inner">
                                <div className="tl-transit-list">
                                  {transitOptions.map((opt, oi) => opt.mode === 'transit' ? (
                                    <div
                                      key={oi}
                                      className={`tl-transit-option has-detail${activeMode === 'TRANSIT' ? ' active' : ''}${detailOpen ? ' detail-open' : ''}`}
                                      onClick={e => {
                                        e.stopPropagation()
                                        selectStop(i)
                                        if (!transitResults[transitPanelKey(day?.day, i)]) {
                                          handleTransitRequest(i)
                                        } else {
                                          setSelectedTravelMode('TRANSIT')
                                          setActiveTransitStepIdx(null)
                                          setOpenTransitKey(transitPanelKey(day?.day, i))
                                        }
                                      }}
                                    >
                                      <div className="tl-transit-option-head">
                                        <div className="tl-transit-mode">{opt.icon}</div>
                                        <div className="tl-transit-main">
                                          <strong>{opt.title}</strong>
                                          <span>{opt.desc}</span>
                                        </div>
                                        <div className="tl-transit-time">{opt.time}</div>
                                      </div>
                                      <div className="tl-transit-detail">
                                        <div className="tl-transit-detail-inner">
                                          {transitDetails.map((detail, di) => (
                                            <div
                                              key={di}
                                              className={`tl-transit-step${activeDetailStep === di ? ' active' : ''}`}
                                              onClick={e => {
                                                e.stopPropagation()
                                                setActiveStopIdx(i)
                                                setSelectedTravelMode('TRANSIT')
                                                setActiveTransitStepIdx(di)
                                              }}
                                            >
                                              <div className="tl-transit-mode">{detail.icon}</div>
                                              <div className="tl-transit-main">
                                                <strong>{detail.title}</strong>
                                                <span>{detail.desc}</span>
                                                {detail.meta?.length > 0 && (
                                                  <div className="tl-transit-meta">
                                                    {detail.meta.map((m, mi) => <span key={mi}>{m}</span>)}
                                                  </div>
                                                )}
                                              </div>
                                              <div className="tl-transit-time">{detail.time}</div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  ) : (
                                    <div
                                      key={oi}
                                      className={`tl-transit-option${(activeMode === 'WALKING' && opt.mode === 'walk') || (activeMode === 'TAXI' && opt.mode === 'taxi') ? ' active' : ''}`}
                                      onClick={e => {
                                        e.stopPropagation()
                                        selectStop(i)
                                        const newMode = opt.mode === 'taxi' ? 'TAXI' : 'WALKING'
                                        setSelectedTravelMode(newMode)
                                        setActiveTransitStepIdx(null)
                                        setOpenTransitKey(transitPanelKey(day?.day, i))
                                        handleSimpleRouteRequest(i, opt.mode)
                                      }}
                                    >
                                      <div className="tl-transit-mode">{opt.icon}</div>
                                      <div className="tl-transit-main">
                                        <strong>{opt.title}</strong><span>{opt.desc}</span>
                                      </div>
                                      <div className="tl-transit-time">{opt.time}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                          {i < dayStops.length - 1 && (
                            <div className="tl-card-actions">
                              <button className="tl-next-btn" onClick={e => { e.stopPropagation(); selectStop(i + 1) }}>다음 일정</button>
                            </div>
                          )}
                          {stop.mealReroute && (
                            <div className={`reroute-drop${mealRerouteOpen ? ' open' : ''}`}>
                              <strong>식당 대체 후보</strong>
                              <p>루트 420m 이내, 평균 {formatEurAsKrw(19)} 타파스 바로 변경.</p>
                              <div className="reroute-acts">
                                <button className="rd-yes" onClick={() => handle('applyMeal')}>적용</button>
                                <button className="rd-no"  onClick={() => handle('restore')}>기존 유지</button>
                              </div>
                            </div>
                          )}
                          {stop.safeReroute && (
                            <div className="reroute-drop">
                              <strong>안전 우회 경로</strong>
                              <p>6분 추가. 대로변, 사고 이력 없음.</p>
                              <div className="reroute-acts">
                                <button className="rd-yes" onClick={() => handle('safeRoute')}>우회 적용</button>
                                <button className="rd-no"  onClick={() => handle('restore')}>기존 유지</button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* 예산 */}
          <div className="sec budget-sec">
            <div className="sec-head">
              <div>
                <div className="sec-kicker">Live Budget</div>
                <h2>실시간 지출 관리</h2>
              </div>
              <div className="budget-head-summary">
                <div className={`budget-head-card${total && todayAvailable < 0 ? ' budget-head-card--over' : ''}`}>
                  <span>{total && todayAvailable < 0 ? '오늘 예산 초과' : '오늘 사용 가능'}</span>
                  <strong>{total ? formatExpense(Math.abs(todayAvailable)) : '예산 미설정'}</strong>
                </div>
                <div className="budget-head-card">
                  <span>오늘 환율</span>
                  <strong>
                    {!exchangeRate.currency ? '확인 중'
                      : exchangeRate.currency === 'KRW' ? 'KRW 1 = ₩1'
                      : `${exchangeRate.currency} 1 = ${formatKrw(exchangeRate.rateToKrw)}`}
                  </strong>
                </div>
              </div>
            </div>
            <div className="sec-body">
              <div className="budget-cols">
                <div className="b-block budget-edit-block">
                  <div className="budget-edit-summary">
                    <div className="budget-edit-summary-left">
                      <span className="budget-edit-label">예산 충당</span>
                      <span className="budget-edit-amount">{total ? formatKrw(total) : '미설정'}</span>
                      {total > 0 && schedule.length > 0 && (
                        <span className="budget-edit-daily-hint">· 하루 {formatKrw(Math.round(total / schedule.length))}</span>
                      )}
                    </div>
                    <button
                      type="button"
                      className={`budget-edit-toggle${budgetEditValue !== null ? ' open' : ''}`}
                      onClick={() => setBudgetEditValue(prev => prev === null ? '' : null)}
                    >
                      {budgetEditValue !== null ? '닫기' : '예산 충당하기'}
                    </button>
                  </div>
                  <div className={`budget-edit-panel${budgetEditValue !== null ? ' open' : ''}`}>
                    <div className="budget-edit-inner">
                      <div className="budget-edit-mode-toggle">
                        <button
                          type="button"
                          className={`bet-tab${budgetEditMode === 'total' ? ' active' : ''}`}
                          onClick={() => setBudgetEditMode('total')}
                        >총 예산</button>
                        <button
                          type="button"
                          className={`bet-tab${budgetEditMode === 'daily' ? ' active' : ''}`}
                          onClick={() => setBudgetEditMode('daily')}
                        >하루 예산</button>
                      </div>
                      <div className="budget-edit-row">
                        <div className="budget-edit-input-wrap">
                          <input
                            className="budget-edit-input"
                            type="number"
                            min="1"
                            max={budgetEditMode === 'daily' ? Math.floor(10000 / (schedule.length || 1)) : 10000}
                            placeholder={budgetEditMode === 'total' ? '총 예산 입력 (최대 10,000만원)' : '하루 예산 입력'}
                            value={budgetEditValue || ''}
                            onChange={e => setBudgetEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') handleBudgetSave() }}
                          />
                          <span className="budget-edit-unit">만원</span>
                        </div>
                        {budgetEditMode === 'daily' && budgetEditValue && schedule.length > 0 && (
                          <div className="budget-edit-calc">
                            총 {formatKrw(Math.round(parseFloat(budgetEditValue || 0) * 10000) * schedule.length)}
                          </div>
                        )}
                        <button
                          type="button"
                          className="budget-edit-save"
                          disabled={!budgetEditValue || budgetSaving}
                          onClick={handleBudgetSave}
                        >
                          {budgetSaving ? '저장 중' : '저장'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="b-block">
                  <div className="b-block-title">카테고리별 지출 비중</div>
                  <div>
                    {categoryBreakdown.map(cat => (
                      <div key={cat.key} className="b-row">
                        <span className="b-icon">{cat.icon}</span>
                        <span className="b-name">{cat.label}</span>
                        <div className="b-bar">
                          <div className="b-fill" style={{ width: `${cat.pct}%`, background: cat.color }}></div>
                        </div>
                        <span className="b-val">
                          <span className="b-pct">{cat.pct}%</span>
                          <span className="b-sep">·</span>
                          <span className="b-amt">{formatExpense(cat.amount)}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {budgetRisk && (
                  <div className="b-block budget-adjust-panel">
                    <div className="budget-adjust-head">
                      <div className="b-block-title">예산 맞춤 조정 후보</div>
                      <strong className="budget-adjust-total">{formatExpense(selectedAdjustmentCost)}</strong>
                    </div>
                    <p className="budget-adjust-desc">남은 예산으로 오늘 일정 소화가 어려워요. 저녁 식사를 저가 옵션으로 바꾸거나 쇼핑 일정을 줄이는 걸 추천합니다.</p>
                    <div className="budget-adjust-list">
                      {adjustmentCandidates.map(candidate => (
                        <label key={`${candidate.index}-${candidate.stop.name}`} className={`budget-adjust-item${selectedAdjustmentIndexes.includes(candidate.index) ? ' selected' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selectedAdjustmentIndexes.includes(candidate.index)}
                            onChange={event => {
                              setRebudgetChangelog([])
                              setSelectedAdjustmentIndexes(prev => event.target.checked
                                ? [...new Set([...prev, candidate.index])]
                                : prev.filter(index => index !== candidate.index))
                            }}
                          />
                          <div>
                            <div className="budget-adjust-item-title">
                              <strong>{candidate.stop.name}</strong>
                              {candidate.mustVisit
                                ? <span className="budget-adjust-badge keep">유지 권장</span>
                                : budgetShortfall > 0 && candidate.estimateWon >= budgetShortfall * 0.5
                                  ? <span className="budget-adjust-badge">조정 추천</span>
                                  : null
                              }
                            </div>
                            <span>{candidate.suggestion}</span>
                          </div>
                          <em>{formatExpense(candidate.estimateWon)}</em>
                        </label>
                      ))}
                    </div>
                    {rebudgetChangelog.length > 0 && (
                      <div className="rebudget-changelog">
                        <div className="rcl-title">변경 내역</div>
                        {rebudgetChangelog.map(entry => (
                          <div key={entry.idx} className="rcl-item">
                            <span className="rcl-before">{entry.beforeName}</span>
                            <span className="rcl-arrow">→</span>
                            <span className="rcl-after">{entry.afterName}</span>
                            {entry.beforeCost !== entry.afterCost && (
                              <span className="rcl-cost">{entry.beforeCost || '?'} → {entry.afterCost || '무료'}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    {adjustmentInsufficient && (
                      <div className="budget-adjust-warning">
                        남은 일정을 모두 조정해도 예산 초과를 완전히 해소하기 어렵습니다. 예산을 늘려주세요.
                      </div>
                    )}
                    <div className="budget-adjust-footer">
                      <button type="button" onClick={handleRebudgetDay} disabled={rebudgeting || selectedAdjustmentIndexes.length === 0}>
                        {rebudgeting ? '재조정 중' : '일정 재조정'}
                      </button>
                    </div>
                  </div>
                )}
                <div className="b-block exp-block">
                  <div className="b-block-title">실시간 지출 입력</div>
                  <div className="exp-form">
                    <label className="exp-field exp-field-name">
                      <span>내역</span>
                      <input
                        className="exp-input" value={expName} aria-label="지출 내역" placeholder="예: 점심 식사"
                        onChange={e => { setExpName(e.target.value); lastAutoExpNameRef.current = '' }}
                      />
                    </label>
                    <label className="exp-field exp-field-amount">
                      <span>금액</span>
                      <input
                        className="exp-num" value={expAmt} aria-label="지출 금액" type="number" inputMode="decimal"
                        placeholder="0"
                        onChange={e => setExpAmt(e.target.value)}
                      />
                      <em>{exchangeRate.currency || '...'}</em>
                    </label>
                    <div className={`exp-field exp-field-category${catPickerOpen ? ' open' : ''}`}>
                      <span>분류</span>
                      <button
                        type="button"
                        className="exp-cat-trigger"
                        aria-label="지출 카테고리 선택"
                        aria-expanded={catPickerOpen}
                        onClick={() => setCatPickerOpen(open => !open)}
                      >
                        <span className="exp-cat-icon">{selectedBudgetCategory.icon}</span>
                        <strong>{selectedBudgetCategory.label}</strong>
                        <span className="exp-cat-caret">⌄</span>
                      </button>
                      {catPickerOpen && (
                        <div className="exp-cat-popover">
                          {BUDGET_CATEGORIES.map(category => (
                            <button
                              type="button"
                              key={category.key}
                              className={`exp-cat-option${category.key === expCat ? ' active' : ''}`}
                              onClick={() => {
                                setExpCat(category.key)
                                setCatPickerOpen(false)
                              }}
                            >
                              <span className="exp-cat-option-icon" style={{ background: category.color }}>{category.icon}</span>
                              <span className="exp-cat-option-text">{category.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button className="exp-add" onClick={handleAddExpense} aria-label="지출 추가">+</button>
                  </div>
                  <div className="exp-log">
                    {currentDayExpenses.length > 0
                      ? currentDayExpenses.map((e, ei) => (
                          <div key={ei} className="exp-log-item">
                            <div className="exp-log-left">
                              <span className="exp-cat-dot" style={{ background: BUDGET_CATEGORIES.find(c => c.key === e.cat)?.color }}></span>
                              <span className="exp-log-name">{e.name}</span>
                            </div>
                            <div className="exp-log-right">
                              <span className={`exp-log-amt${e.over ? ' over' : ''}`}>{formatExpenseLogAmount(e)}</span>
                              <button className="exp-log-del" onClick={() => handleDeleteExpense(e)} aria-label="지출 삭제">×</button>
                            </div>
                          </div>
                        ))
                      : <div className="b-empty">아직 입력된 지출이 없습니다</div>
                    }
                  </div>
                  <div className={`meal-reroute-panel${mealRerouteOpen ? ' open' : ''}`}>
                    <strong>예산 초과 — 식당 대체 후보</strong>
                    <p>현재 루트 480m 이내, 평균 ₩26,460-₩32,340 식당으로만 재조회합니다. 관광 순서는 유지됩니다.</p>
                    <div style={{ display: 'flex', gap: '5px' }}>
                      <button className="rd-yes" onClick={() => handle('applyMeal')}>대체 적용</button>
                      <button className="rd-no"  onClick={() => handle('restore')}>기존 유지</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RIGHT COL */}
        <aside className="right-col">
          <div className="map-wrap">
            <div className="map-hd">
              <span className="map-hd-title">라이브 지도</span>
              <div className="map-hd-actions">
                <button className="map-icon-btn" onClick={() => handle('openMapModal')} aria-label="지도 확대">⤢</button>
                <button className="map-hd-btn"   onClick={() => handle('routeGuide')}>경로 안내</button>
              </div>
            </div>
            <div className="map-frame" id="liveMap">
              {!mapReady && <div className="map-fallback">Google Maps API 키 연결 시<br />숙소·관광지·식당·야간 안전 경로 표시</div>}
            </div>
            <div className="map-route-card">
              <strong>{routeCard.title}</strong>
              <span>{routeCard.desc}</span>
              {safetyBadge && !safetyData && (
                <span className={`safety-badge safety-badge--${safetyBadge.level}`}>
                  {safetyBadge.icon} {safetyBadge.label} · 안전 우회 버튼으로 경로 변경 가능
                </span>
              )}
            </div>
            <div className="map-btns">
              <button className="map-btn primary" onClick={() => handle('safeRoute')}>🛡 안전 우회</button>
              <button className="map-btn sec"     onClick={() => handle('restore')}>원래 루트</button>
            </div>
          </div>

          <div className="wx-card">
            {weatherLoading ? (
              <div className="wx-loading">날씨 불러오는 중...</div>
            ) : weatherData ? (
              <>
                <div className="wx-bg">
                  <span className="wx-icon-big">{weatherData.icon}</span>
                  <div>
                    <div className="wx-num">
                      {weatherData.afternoon?.temp != null ? `${weatherData.afternoon.temp}°` : '--°'}
                    </div>
                    <div className="wx-cond">
                      {weatherData.weatherLabel}
                      {weatherData.precipProb > 0 ? ` · 강수 ${weatherData.precipProb}%` : ''}
                    </div>
                  </div>
                </div>
                <div className="wx-temp-row">
                  {[
                    { label: '아침', data: weatherData.morning },
                    { label: '낮',   data: weatherData.afternoon },
                    { label: '저녁', data: weatherData.evening },
                  ].map(({ label, data }) => (
                    <div key={label} className="wx-temp-cell">
                      <span className="wx-temp-label">{label}</span>
                      <span className="wx-temp-val">{data?.temp != null ? `${data.temp}°` : '--'}</span>
                      {data?.feels != null && data.feels !== data.temp && (
                        <span className="wx-temp-feels">체감 {data.feels}°</span>
                      )}
                    </div>
                  ))}
                </div>
                {weatherData.outfit?.summary && (
                  <div className="wx-outfit">
                    <strong>오늘 옷차림</strong>
                    <span className="wx-outfit-summary">{weatherData.outfit.summary}</span>
                    {weatherData.outfit.items?.length > 0 && (
                      <div className="wx-outfit-items">
                        {weatherData.outfit.items.map((item, i) => (
                          <span key={i} className="wx-outfit-tag">{item}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="wx-btns">
                  <button className="map-btn primary" style={{ flex: 1 }} onClick={() => handle('wxReroute')}>
                    🏛 실내 활동 보기
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="wx-bg">
                  <span className="wx-icon-big">🌦</span>
                  <div>
                    <div className="wx-num">--°</div>
                    <div className="wx-cond">날씨 정보 없음</div>
                  </div>
                </div>
                <div className="wx-btns">
                  <button className="map-btn primary" style={{ flex: 1 }} onClick={() => handle('wxReroute')}>
                    🏛 실내 활동 보기
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="fatigue-card">
            <div className="fc-title">피로도 관리</div>
            <div className="fc-body">
              <div className="fc-ring-wrap">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="24" fill="none" stroke="var(--border)" strokeWidth="7"/>
                  <circle cx="32" cy="32" r="24" fill="none" stroke={fatigueRingColor}
                    strokeWidth="7" strokeDasharray="150.8" strokeDashoffset={fatigueRingOffset} strokeLinecap="round"/>
                </svg>
                <div className="fc-ring-center">
                  <span className="fc-ring-num">{fatigueVal}</span>
                  <span className="fc-ring-denom">/10</span>
                </div>
              </div>
              <div className="fc-right">
                <div className="fc-label">{FATIGUE_LABELS[fatigueVal] || ''}</div>
                <input type="range" className="fc-slider" min="1" max="10" value={fatigueVal}
                  onChange={e => setFatigueVal(parseInt(e.target.value))} />
                <div className="fc-hint">높을수록 도보를 줄이고 카페·택시 비중을 늘립니다.</div>
              </div>
            </div>
            <div className="fc-btns">
              <button className="fc-btn" onClick={() => handle('fatigueReroute')}>휴식 루트 보기</button>
              {fatigueApplied && (
                <button
                  className="fc-btn fc-btn--reset"
                  onClick={() => {
                    setRestStop(null)
                    setFatigueApplied(false)
                    setSelectedTravelMode('WALKING')
                    setSelectedCafeKey(null)
                  }}
                >
                  원래대로
                </button>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* TOAST */}
      <div className={`toast${toast.show ? ' show' : ''} ${toast.type}`}>
        <span className="toast-icon">{toast.icon}</span>
        <div className="toast-body">
          <div className="toast-title">{toast.title}</div>
          <div className="toast-msg">{toast.msg}</div>
        </div>
        <div className="toast-actions">
          {toast.actions.map((a, ai) => (
            <button key={ai} className={`ta-btn${a.primary ? ' primary' : ''}`} onClick={() => handle(a.action)}>
              {a.label}
            </button>
          ))}
        </div>
        <button className="ta-close" onClick={() => setToast(t => ({ ...t, show: false }))}>×</button>
      </div>

      {/* OVERLAY MODAL */}
      <div
        className={`overlay${modalOpen ? ' show' : ''}`}
      >
        <div className={`modal-box${activeModalKey === 'imageTranslate' ? ' image-translate-modal' : ''}`}>
          <div className="modal-title">{modalTitles[activeModalKey]}</div>
          <div>
            {modalOpen && activeModalKey && (
              <ModalContent
                modalKey={activeModalKey}
                travelData={travelData}
                schedule={schedule}
                cityData={cityData}
                activeIdx={activeIdx}
                activeStopIdx={activeStopIdx}
                dayStops={dayStops}
                albumPhoto={albumPhoto}
                albumPhotoUrl={albumPhotoUrl}
                albumTitle={albumTitle}
                albumMemo={albumMemo}
                setAlbumPhoto={setAlbumPhoto}
                setAlbumPhotoUrl={setAlbumPhotoUrl}
                setAlbumTitle={setAlbumTitle}
                setAlbumMemo={setAlbumMemo}
                formatExpense={formatExpense}
                formatKrw={formatKrw}
                total={total}
                totalSpent={totalSpent}
                categoryBreakdown={categoryBreakdown}
                emergencyMapUrl={emergencyMapUrl}
                setEmergencyMapUrl={setEmergencyMapUrl}
                getActiveEmergencyPoint={getActiveEmergencyPoint}
                safetyData={safetyData}
                safetyLoading={safetyLoading}
                imagePodcastEnabled={imagePodcastEnabled}
                setImagePodcastEnabled={setImagePodcastEnabled}
              />
            )}
          </div>
          <div className="modal-footer">
            {activeModalKey === 'imageTranslate' && (
              <button
                type="button"
                className={`mi-podcast-toggle${imagePodcastEnabled ? ' on' : ' off'}`}
                onClick={() => setImagePodcastEnabled(enabled => !enabled)}
                aria-pressed={imagePodcastEnabled}
                aria-label={imagePodcastEnabled ? '팟캐스트 읽기 끄기' : '팟캐스트 읽기 켜기'}
              >
                <img
                  src={imagePodcastEnabled ? PODCAST_ICON_URL : PODCAST_ICON_STATIC_URL}
                  alt=""
                  aria-hidden="true"
                />
              </button>
            )}
            <button className="mf ghost" onClick={closeModal}>닫기</button>
            <button className="mf primary" onClick={() => { if (activeModalKey === 'album') saveAlbumMemory(); else closeModal() }}>확인</button>
          </div>
        </div>
      </div>

      {/* FATIGUE MODAL */}
      <div
        className={`overlay${fatigueModalOpen ? ' show' : ''}`}
        onClick={e => { if (e.target.classList.contains('overlay')) setFatigueModalOpen(false) }}
      >
        <div className="modal-box fatigue-modal-box">
          <div className="modal-title">💪 피로도 루트 조정</div>
          <div className="fatigue-modal-body">

            {/* 택시 전환 안내 */}
            <div className="fm-section">
              <div className="fm-section-title">🚕 이동수단 조정</div>
              {fatigueVal >= 7 ? (
                <div className="fm-taxi-desc">
                  피로도 <strong>{fatigueVal}/10</strong> — 남은 {dayStops.length - activeStopIdx - 1}개 구간을 <strong>전부 택시</strong>로 전환합니다.
                  <span className="fm-badge high">강력 권장</span>
                </div>
              ) : fatigueVal >= 5 ? (
                <div className="fm-taxi-desc">
                  피로도 <strong>{fatigueVal}/10</strong> — 남은 구간 중 도보 이동을 <strong>택시로 전환</strong>을 권장합니다.
                  <span className="fm-badge mid">권장</span>
                </div>
              ) : (
                <div className="fm-taxi-desc fm-taxi-ok">
                  피로도 <strong>{fatigueVal}/10</strong> — 현재 컨디션은 양호합니다. 이동수단 변경이 필요하지 않아요.
                </div>
              )}
            </div>

            {/* 카페 선택 */}
            <div className="fm-section">
              <div className="fm-section-title">☕ 카페 휴식 추가</div>
              <p className="fm-section-desc">현재 일정 바로 다음에 카페 휴식을 추가합니다. 하나를 선택하거나 건너뛰세요.</p>
              {fatigueCafeLoading ? (
                <div className="fm-cafe-loading">근처 카페 검색 중...</div>
              ) : fatigueCafes?.groups?.length > 0 ? (
                fatigueCafes.groups.filter(g => g.places.length > 0).map(group => (
                  <div key={group.key}>
                    <div className="fm-cafe-group-title">{group.icon} {group.label}</div>
                    {group.places.map(place => (
                      <div
                        key={place.id}
                        className={`fm-cafe-item${selectedCafeKey === place.id ? ' selected' : ''}`}
                        onClick={() => setSelectedCafeKey(prev => prev === place.id ? null : place.id)}
                      >
                        <div className="fm-cafe-check">{selectedCafeKey === place.id ? '✓' : ''}</div>
                        <div className="fm-cafe-info">
                          <div className="fm-cafe-name">{place.name}</div>
                          <div className="fm-cafe-meta">
                            {place.distanceText && <span>{place.distanceText}</span>}
                            {place.durationText && <span>{place.durationText}</span>}
                            {place.rating      && <span>★ {place.rating}</span>}
                            {place.openNow === true  && <span className="wx-open">영업 중</span>}
                            {place.openNow === false && <span className="wx-closed">영업 종료</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="fm-cafe-empty">800m 내 카페를 찾지 못했어요.</div>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button className="mf ghost"   onClick={() => setFatigueModalOpen(false)}>취소</button>
            <button className="mf primary" onClick={() => handle('applyFatigue')}>
              {fatigueVal >= 5 ? '택시 전환' : ''}{selectedCafeKey ? (fatigueVal >= 5 ? ' + 카페 추가' : '카페 추가') : ''}{fatigueVal < 5 && !selectedCafeKey ? '확인' : ''}
            </button>
          </div>
        </div>
      </div>

      {/* INDOOR MODAL */}
      <div
        className={`overlay${indoorPanelOpen ? ' show' : ''}`}
        onClick={e => { if (e.target.classList.contains('overlay')) setIndoorPanelOpen(false) }}
      >
        <div className="modal-box indoor-modal-box">
          <div className="modal-title">🏛 주변 실내 활동</div>
          <div className="indoor-modal-body">
            {indoorLoading ? (
              <div className="wx-indoor-loading">근처 실내 장소 검색 중...</div>
            ) : indoorPlaces?.groups?.length > 0 ? (
              indoorPlaces.groups
                .filter(g => g.places.length > 0)
                .map(group => (
                  <div key={group.key} className="wx-indoor-group">
                    <div className="wx-indoor-group-title">{group.icon} {group.label}</div>
                    {group.places.map(place => (
                      <a
                        key={place.id}
                        className="wx-indoor-place"
                        href={place.googleMapsUri}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <div className="wx-indoor-place-name">{place.name}</div>
                        <div className="wx-indoor-place-meta">
                          {place.distanceText && <span>{place.distanceText}</span>}
                          {place.durationText && <span>{place.durationText}</span>}
                          {place.rating && <span>★ {place.rating}</span>}
                          {place.openNow === true  && <span className="wx-open">영업 중</span>}
                          {place.openNow === false && <span className="wx-closed">영업 종료</span>}
                        </div>
                      </a>
                    ))}
                  </div>
                ))
            ) : (
              <div className="wx-indoor-empty">주변 2km 내 실내 장소를 찾지 못했어요.</div>
            )}
          </div>
          <div className="modal-footer">
            <button className="mf primary" onClick={() => setIndoorPanelOpen(false)}>닫기</button>
          </div>
        </div>
      </div>

      {/* MAP OVERLAY */}
      <div
        className={`overlay${mapModalOpen ? ' show' : ''}`}
        onClick={e => { if (e.target.classList.contains('overlay')) setMapModalOpen(false) }}
      >
        <div className="map-modal-box">
          <div className="map-modal-head">
            <div className="map-modal-title">라이브 지도</div>
            <button className="map-modal-close" onClick={() => setMapModalOpen(false)} aria-label="지도 닫기">×</button>
          </div>
          <div className="map-modal-frame" id="modalMap"></div>
        </div>
      </div>
    </div>
  )
}

// ── 도시 아코디언 ─────────────────────────────────────────────

function CityAccordion({ travelData, schedule, cityData, cityGroups, activeIdx, onSelectDay }) {
  const day      = schedule[activeIdx]
  const totalDays = schedule.length
  const activeDay = day?.day || 1
  const progress  = Math.round((activeDay / totalDays) * 100)

  if (travelData?.isGenerated) {
    return (
      <>
        <div className="city-summary">
          <div className="city-summary-top">
            <div className="city-summary-day">D{String(activeDay).padStart(2, '0')} <span>/ {totalDays}</span></div>
            <div className="city-summary-copy">전체 일정</div>
          </div>
          <div className="city-progress" aria-label={`여행 진행률 ${progress}%`}>
            <div className="city-progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
        <div className="day-nav-list">
          {schedule.map((s, idx) => {
            const d   = cityData[s.base]
            const cls = ['day-nav-btn', idx === activeIdx ? 'active' : '', s.done ? 'done' : '', s.today ? 'today' : ''].filter(Boolean).join(' ')
            return (
              <button key={idx} className={cls} onClick={() => onSelectDay(idx)}>
                <span className="day-nav-num">D{String(s.day).padStart(2, '0')}</span>
                <span className="day-nav-info">
                  <strong>{d?.title}</strong>
                  <span>{d?.stops.length}개 일정</span>
                </span>
              </button>
            )
          })}
        </div>
      </>
    )
  }

  const activeGroup = cityGroups.find(g => g.indices.includes(activeIdx))
  return (
    <>
      <div className="city-summary">
        <div className="city-summary-top">
          <div className="city-summary-day">D{String(activeDay).padStart(2, '0')} <span>/ {totalDays}</span></div>
          <div className="city-summary-copy">{cityGroups.length}개 구간</div>
        </div>
        <div className="city-progress" aria-label={`여행 진행률 ${progress}%`}>
          <div className="city-progress-fill" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
      {cityGroups.map((g, gi) => {
        const isOpen   = g === activeGroup
        const stayDays = g.indices.length
        return (
          <div key={g.id} className="city-group">
            <button
              className={`city-row${isOpen ? ' active' : ''}`}
              onClick={() => {
                const todayIdx = g.indices.find(i => schedule[i].today)
                onSelectDay(todayIdx !== undefined ? todayIdx : g.indices[0])
              }}
            >
              <div className="city-num">{String(gi + 1).padStart(2, '0')}</div>
              <div className="city-info"><strong>{g.name}</strong><span>{g.range}</span></div>
              <div className="city-meta">
                <span className="city-duration">{stayDays}일</span>
                <span className="city-wx">{g.wx}</span>
              </div>
            </button>
            <div className={`city-days${isOpen ? ' open' : ''}`}>
              {g.indices.map(idx => {
                const s   = schedule[idx]
                const cls = ['city-day', idx === activeIdx ? 'active' : '', s.done ? 'done' : '', s.today ? 'today' : ''].filter(Boolean).join(' ')
                return (
                  <button key={idx} className={cls} onClick={e => { e.stopPropagation(); onSelectDay(idx) }}>
                    D{String(s.day).padStart(2, '0')}
                  </button>
                )
              })}
            </div>
          </div>
        )
      })}
    </>
  )
}

// ── 모달 콘텐츠 ───────────────────────────────────────────────

function ModalContent({
  modalKey, travelData, schedule, cityData, activeIdx, activeStopIdx, dayStops,
  albumPhoto, albumPhotoUrl, albumTitle, albumMemo, setAlbumPhoto, setAlbumPhotoUrl, setAlbumTitle, setAlbumMemo,
  formatExpense, formatKrw, total, totalSpent, categoryBreakdown,
  emergencyMapUrl, setEmergencyMapUrl, getActiveEmergencyPoint,
  safetyData, safetyLoading,
  imagePodcastEnabled, setImagePodcastEnabled,
}) {
  const [consulateHtml,  setConsulateHtml]  = useState('')
  const [nearbyHtml,     setNearbyHtml]     = useState('')
  const [consulateLoading, setConsulateLoading] = useState(true)
  const [nearbyLoading,    setNearbyLoading]    = useState(true)
  const [amenitiesLoading, setAmenitiesLoading] = useState(false)
  const [amenitiesData, setAmenitiesData] = useState(null)
  const [amenitiesError, setAmenitiesError] = useState('')


  useEffect(() => {
    if (modalKey !== 'emergency') return
    const info        = lookupEmergencyNumber(travelData?.destination)
    const destination = info?.countryName || travelData?.destination
    const point       = getActiveEmergencyPoint()

    if (point) {
      fetchEmergencyNearbyInfo(point, EMERGENCY_RADIUS_METERS)
        .then(data => {
          setEmergencyMapUrl(data.mapUrl || `https://www.google.com/maps/search/emergency+services/@${point.lat},${point.lng},14z`)
          const groups = data.groups || []
          const summary = groups.map(g => `${g.label} ${g.places?.length || 0}`).join(' · ')
          const rows = groups
            .flatMap(g => (g.places || []).slice(0, 2))
            .slice(0, 5)
            .map(place => {
              const dist = formatDistance(haversineMeters(point, { lat: Number(place.lat), lng: Number(place.lng) }))
              const mapLink = place.googleMapsUri ? ` · <a href="${place.googleMapsUri}" target="_blank" rel="noopener" class="mi-map-link">연결</a>` : ''
              return `<div class="mi-row"><strong>${place.categoryLabel} · ${place.name}</strong><span>${dist}${mapLink}</span></div>`
            }).join('')
          const total = groups.reduce((s, g) => s + (g.places?.length || 0), 0)
          setNearbyHtml(`
            <div class="mi-safe"><strong>${point.routeLabel} 반경 ${(EMERGENCY_RADIUS_METERS/1000).toFixed(0)}km</strong><span>${total ? `${summary} 있습니다` : '조회된 경찰서·소방서·병원이 없습니다'}</span></div>
            ${rows || '<div class="mi-row"><strong>응급시설</strong><span class="mi-muted">근처 시설 없음</span></div>'}
            <button class="mi-map-btn" id="emergencyMapBtn">지도보기</button>
          `)
          setNearbyLoading(false)
        })
        .catch(() => { setNearbyHtml('<div class="mi-row"><strong>📍 주변 응급시설</strong><span class="mi-muted">정보를 불러올 수 없습니다</span></div>'); setNearbyLoading(false) })
    } else {
      setNearbyHtml('<div class="mi-row"><strong>📍 주변 응급시설</strong><span class="mi-muted">현재 위치 좌표가 없습니다</span></div>')
      setNearbyLoading(false)
    }

    if (destination) {
      fetchConsulateInfo(destination)
        .then(data => {
          const mapsUrl = data.lat && data.lng ? `https://www.google.com/maps?q=${data.lat},${data.lng}` : null
          const mapLink = mapsUrl ? ` · <a href="${mapsUrl}" target="_blank" rel="noopener" class="mi-map-link">지도 연결</a>` : ''
          setConsulateHtml(`
            <div class="mi-row"><strong>🏛 ${data.name}</strong><span>${data.phone}${mapLink}</span></div>
            ${data.emergencyPhone ? `<div class="mi-row"><strong>🚨 긴급 영사</strong><span>${data.emergencyPhone} (24h)</span></div>` : ''}
            ${data.callCenter    ? `<div class="mi-row"><strong>📞 영사콜센터</strong><span>${data.callCenter}</span></div>` : ''}
          `)
        })
        .catch(() => { setConsulateHtml('<div class="mi-row"><strong>🏛 한국 영사관</strong><span class="mi-muted">정보를 불러올 수 없습니다</span></div>') })
        .finally(() => setConsulateLoading(false))
    } else {
      setConsulateLoading(false)
    }
  }, [modalKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // 사진 업로드 처리
  function loadFile(file) {
    const reader = new FileReader()
    reader.onload = ev => setAlbumPhoto(ev.target.result)
    reader.readAsDataURL(file)
    const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
    const formData = new FormData()
    formData.append('photo', file)
    const token = localStorage.getItem('tripHelperToken')
    fetch(`${apiBase}/api/memories/upload`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(r => r.json()).then(data => setAlbumPhotoUrl(data.url || '')).catch(() => setAlbumPhotoUrl(''))
  }

  const spent     = totalSpent
  const remaining = Math.max(0, total - spent)
  const pct       = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0
  const info      = lookupEmergencyNumber(travelData?.destination)
  const currentStop = dayStops[activeStopIdx]
  const dayNum      = String(schedule[activeIdx]?.day || 1).padStart(2, '0')
  const currentDay = schedule[activeIdx]
  const selectedSegment = currentDay
    ? getRouteSegment(currentDay.base, activeStopIdx, cityData)
    : []

  const selectedAmenityPoint = selectedSegment[selectedSegment.length - 1]

  useEffect(() => {
    if (modalKey !== 'nearby') return

    if (!selectedAmenityPoint) {
      setAmenitiesData(null)
      setAmenitiesError('선택한 일정의 좌표가 없습니다.')
      setAmenitiesLoading(false)
      return
    }

    setAmenitiesLoading(true)
    setAmenitiesError('')
    setAmenitiesData(null)

    fetchNearbyAmenities(selectedAmenityPoint, 1500)
      .then(data => setAmenitiesData(data))
      .catch(() => setAmenitiesError('주변 편의시설을 불러오지 못했습니다.'))
      .finally(() => setAmenitiesLoading(false))
  }, [modalKey, selectedAmenityPoint?.lat, selectedAmenityPoint?.lng])

  if (modalKey === 'translate') return (
    <TranslateModal destination={travelData?.destination || ''} />
  )

  if (modalKey === 'imageTranslate') return (
    <ImageTranslateModal
      destination={travelData?.destination || ''}
      podcastEnabled={imagePodcastEnabled}
      setPodcastEnabled={setImagePodcastEnabled}
    />
  )

  if (modalKey === 'emergency') {
    const emergencyRow = info
      ? <div className="mi-emergency"><strong>🚑 {info.number}</strong><span>{info.countryName} {info.desc}</span></div>
      : <div className="mi-emergency"><strong>🚑 112</strong><span>국제 통합 긴급번호</span></div>
    return (
      <div>
        {emergencyRow}
        <div>{nearbyLoading
          ? <div className="mi-row"><strong>📍 주변 응급시설</strong><span className="mi-muted">조회 중...</span></div>
          : <div dangerouslySetInnerHTML={{ __html: nearbyHtml }} onClick={e => { if (e.target.id === 'emergencyMapBtn' && emergencyMapUrl) window.open(emergencyMapUrl, '_blank', 'noopener') }} />
        }</div>
        <div>{consulateLoading
          ? <><div className="mi-row"><strong>🏛 한국 영사관</strong><span className="mi-muted">조회 중...</span></div>
              <div className="mi-row"><strong>🚨 긴급 영사</strong><span className="mi-muted">조회 중...</span></div></>
          : <div dangerouslySetInnerHTML={{ __html: consulateHtml }} />
        }</div>
      </div>
    )
  }

  if (modalKey === 'nearby') return (
    <div>
      <div className="mi-row">
        <strong>기준 위치</strong>
        <span>{currentStop?.name || '선택한 일정'}</span>
      </div>

      {amenitiesLoading && (
        <div className="mi-row">
          <strong>조회 중</strong>
          <span className="mi-muted">선택한 일정 주변 편의시설을 찾고 있습니다.</span>
        </div>
      )}

      {amenitiesError && (
        <div className="mi-row">
          <strong>조회 실패</strong>
          <span className="mi-muted">{amenitiesError}</span>
        </div>
      )}

      {!amenitiesLoading && !amenitiesError && amenitiesData?.groups?.map(group => {
        const first = group.places?.[0]
        return (
          <div key={group.key} className="mi-row">
            <strong>{group.icon} {group.label}</strong>
            <span>
              {first
                ? `${first.name} · ${first.distanceText}`
                : '주변 결과 없음'}
            </span>
          </div>
        )
      })}
    </div>
  )

  if (modalKey === 'hotel') return (
    <div>
      <p style={{ fontSize: '13px', color: 'var(--muted)', marginBottom: '12px', lineHeight: 1.6 }}>생성된 일정의 숙소 정보와 이동 동선을 기준으로 숙소 전략을 표시합니다.</p>
      <div className="mi-row"><strong>숙소 정보</strong><span className="mi-muted">일정 데이터에서 확인 중</span></div>
    </div>
  )

  if (modalKey === 'budget') return (
    <div className="bm-wrap">
      <div className="bm-hero">
        <span className="bm-hero-label">총 지출</span>
        <div className="bm-hero-amounts">
          <strong className="bm-hero-spent">{formatExpense(spent)}</strong>
          {total > 0 && <span className="bm-hero-total">/ {formatKrw(total)}</span>}
        </div>
        {total > 0 && (
          <div className="bm-progress-wrap">
            <div className="bm-progress-track">
              <div className="bm-progress-fill" style={{
                width: `${pct}%`,
                background: pct >= 90 ? 'var(--rose)' : pct >= 70 ? 'var(--amber)' : 'var(--green)',
              }} />
            </div>
            <span className="bm-progress-pct">{pct}%</span>
          </div>
        )}
      </div>

      <div className="bm-stats">
        <div className="bm-stat-card">
          <span>남은 예산</span>
          <strong style={{ color: remaining > 0 ? 'var(--green)' : 'var(--muted)' }}>
            {total ? formatKrw(remaining) : '미설정'}
          </strong>
        </div>
        <div className="bm-stat-card">
          <span>소진율</span>
          <strong>{total ? `${pct}%` : '—'}</strong>
        </div>
      </div>

      <div className="bm-cats">
        <p className="bm-cats-title">카테고리별 지출</p>
        {categoryBreakdown.length > 0 && categoryBreakdown.some(c => c.amount > 0)
          ? categoryBreakdown.map(cat => (
              <div key={cat.key} className="bm-cat-row">
                <span className="bm-cat-icon">{cat.icon}</span>
                <div className="bm-cat-info">
                  <div className="bm-cat-top">
                    <span className="bm-cat-name">{cat.label}</span>
                    <span className="bm-cat-amount">{formatExpense(cat.amount)}</span>
                  </div>
                  <div className="bm-cat-track">
                    <div className="bm-cat-fill" style={{ width: `${cat.pct}%`, background: cat.color }} />
                  </div>
                </div>
                <span className="bm-cat-pct">{cat.pct}%</span>
              </div>
            ))
          : <p className="bm-cats-empty">아직 지출 내역이 없습니다.</p>
        }
      </div>
    </div>
  )

  if (modalKey === 'fatigue') return (
    <div>
      {[['🦶 오늘 도보','8.4km (목표 10km)'],['🚇 이동 횟수','4회'],['☕ 휴식 후보','카페 40분 추가 가능'],['📊 입력 피로도','6/10 · 카페 휴식 추천']].map(([k, v]) => (
        <div key={k} className="mi-row"><strong>{k}</strong><span>{v}</span></div>
      ))}
    </div>
  )

  if (modalKey === 'album') return (
    <div>
      {currentStop?.name && (
        <div className="mi-album-location-header">
          <div className="mi-album-location-day">Day {dayNum}</div>
          <div className="mi-album-location-name">{currentStop.name}</div>
        </div>
      )}
      <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '10px 0 12px', lineHeight: 1.6 }}>여행 중 저장한 사진과 메모. 종료 후 날짜별 타임라인으로 정리됩니다.</p>
      {albumPhoto ? (
        <div className="mi-album-preview">
          <img src={albumPhoto} alt="업로드된 사진" />
          <button className="mi-album-preview-del" onClick={() => { setAlbumPhoto(''); setAlbumPhotoUrl('') }}>× 사진 삭제</button>
        </div>
      ) : (
        <label
          className="mi-album-drop"
          onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('drag-over') }}
          onDragLeave={e => e.currentTarget.classList.remove('drag-over')}
          onDrop={e => {
            e.preventDefault()
            e.currentTarget.classList.remove('drag-over')
            const f = e.dataTransfer.files[0]
            if (f && f.type.startsWith('image/')) loadFile(f)
          }}
        >
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) loadFile(f); e.target.value = '' }} />
          <div className="mi-album-drop-icon">📷</div>
          <div className="mi-album-drop-text">클릭하거나 사진을 드래그하세요</div>
          <div className="mi-album-drop-hint">JPG · PNG · GIF · HEIC 지원</div>
        </label>
      )}
      <div className="mi-album-memo-wrap">
        <input
          className="mi-album-title-input" maxLength={50} placeholder="제목을 입력하세요..."
          value={albumTitle} onChange={e => setAlbumTitle(e.target.value)}
        />
        <textarea
          className="mi-album-memo" maxLength={300} placeholder="오늘 여행 소감을 간단히 적어보세요..."
          value={albumMemo} onChange={e => setAlbumMemo(e.target.value)}
        />
        <div className="mi-album-memo-counter"><span>{albumMemo.length}</span> / 300</div>
      </div>
    </div>
  )

  if (modalKey === 'safety') return (
    <div>
      {safetyLoading && (
        <div className="mi-row"><span>NSW 사고 데이터 조회 중...</span></div>
      )}
      {!safetyLoading && safetyData && (
        <>
          <div className={safetyData.level === 'warn' ? 'mi-emergency' : 'mi-safe'}>
            <strong>
              {safetyData.level === 'warn' ? '⚠️' : safetyData.level === 'caution' ? '🔶' : '✅'} 현재 구간 분석
            </strong>
            <span>{safetyData.safeRouteDesc}</span>
          </div>
          {safetyData.rawIncidents?.length > 0 && (
            <div className="mi-row">
              <strong>최근 사고 이력</strong>
              <span>
                {safetyData.rawIncidents.map((inc, i) => (
                  <span key={i} style={{ display: 'block', fontSize: '0.85em' }}>
                    • {inc.title}{inc.date ? ` (${inc.date.slice(0, 10)})` : ''}
                  </span>
                ))}
              </span>
            </div>
          )}
          <div className="mi-row">
            <strong>권고</strong>
            <span>
              {safetyData.level === 'warn'
                ? '해당 구간 야간 이동 자제, 대로변 우회 경로 사용 권장'
                : safetyData.level === 'caution'
                ? '야간 이동 시 대로변 우선, 스마트폰 노출 최소화'
                : '비교적 안전한 구간입니다. 야간에도 주의는 유지하세요.'}
            </span>
          </div>
        </>
      )}
      {!safetyLoading && !safetyData && (
        <div className="mi-row"><span>안전 우회 버튼을 눌러 실시간 사고 데이터를 조회하세요.</span></div>
      )}
    </div>
  )

  return null
}
