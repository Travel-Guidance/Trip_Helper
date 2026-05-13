// AiTravelDurationView.jsx - 여행 일정 메인 뷰 (상태·렌더링 통합 React 컴포넌트)
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import {
  buildGeneratedTravelData, getDayStops, getRouteInfo, getRouteSegment,
  haversineMeters, formatDistance, lookupEmergencyNumber, heroImageForDestination,
  makeFormatters, getModeOptions, getTransportPlan, getTransitDemoOptions,
  getTransitDetailOptions, transitPanelKey, modeResultKey,
  getTotalSpent, getCurrentDayNumber, getDailyBudgetWon, getCurrentDayExpenses,
  getCurrentDaySpent, getTodayAvailableBudget, getCategoryBreakdown,
  parseBudgetWon,
  normalizeSavedExpense, fetchSavedExpenses, persistExpense, fetchExchangeRate,
  fetchConsulateInfo, fetchEmergencyNearbyInfo, buildGoogleMapsRouteUrl,
  requestSimpleRoute, requestTransitRoute, renderRouteMap,
  getGeneratedPlanId, readGeneratedPlanResult,
  BUDGET_CATEGORIES, GOOGLE_MAP_SCRIPT_ID, GOOGLE_MAP_SCRIPT_SRC, EMERGENCY_RADIUS_METERS,
} from '../../utils/AiTravelDuration'

const FATIGUE_LABELS = {
  1:'최상 컨디션', 2:'컨디션 좋음', 3:'약간 피로', 4:'적당히 피로', 5:'중간 피로',
  6:'카페 휴식 추천', 7:'도보 줄이기', 8:'택시 추천', 9:'숙소 복귀 추천', 10:'일정 조정 필요',
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

function adjustmentText(category) {
  if (category === 'meal') return '저가 식당이나 간단한 식사 옵션으로 낮추기'
  if (category === 'shop') return '쇼핑 시간을 줄이거나 구매 예산 상한 정하기'
  return '무료 전망·산책 코스 또는 저가 입장 옵션으로 대체'
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
  const [albumMemo,     setAlbumMemo]     = useState('')
  const [activeModalKey, setActiveModalKey] = useState('')
  const [modalOpen,     setModalOpen]     = useState(false)
  const [mealRerouteOpen, setMealRerouteOpen] = useState(false)
  const [routeCard, setRouteCard]   = useState({ title: '선택한 이동 구간', desc: '이동수단을 선택하면 실제 시간·거리가 표시됩니다.' })
  const [toast, setToast]           = useState({ show: false, icon: '', title: '', msg: '', type: '', actions: [] })
  const [expName, setExpName]       = useState('')
  const [expAmt,  setExpAmt]        = useState('')
  const [expCat,  setExpCat]        = useState('meal')

  const toastTimerRef        = useRef(null)
  const lastAutoExpNameRef   = useRef('')

  // ── 파생값 ────────────────────────────────────────────────
  const schedule   = travelData?.schedule   || []
  const cityData   = travelData?.cityData   || {}
  const cityGroups = travelData?.cityGroups || []
  const total      = travelData?.totalBudgetWon || 0

  const fmt = makeFormatters(exchangeRate)
  const { formatKrw, formatExpense, formatEurAsKrw, localToKrw, formatLocalAmount, formatExpenseLogAmount, localizeMoneyText } = fmt

  const day             = schedule[activeIdx]
  const currentCityData = cityData[day?.base]
  const dayStops        = currentCityData ? getDayStops(currentCityData.stops || []) : []
  const statusLabel     = day?.today ? 'LIVE' : day?.done ? 'DONE' : 'UPCOMING'

  const currentDayNumber  = getCurrentDayNumber(schedule, activeIdx)
  const dailyBudgetWon    = getDailyBudgetWon(total, schedule)
  const currentDayExpenses = getCurrentDayExpenses(expenses, schedule, activeIdx)
  const totalSpent        = getTotalSpent(expenses)
  const currentDaySpent   = getCurrentDaySpent(expenses, schedule, activeIdx)
  const todayAvailable    = getTodayAvailableBudget(total, expenses, schedule, activeIdx)
  const categoryBreakdown = getCategoryBreakdown(expenses, schedule, activeIdx)
  const budgetPct         = dailyBudgetWon > 0 ? Math.min(100, (currentDaySpent / dailyBudgetWon) * 100) : 0
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
          suggestion: adjustmentText(category),
        }
      })
      .filter(Boolean)
  }, [dayStops, activeStopIdx, exchangeRate])
  const remainingAdjustableCost = adjustmentCandidates.reduce((sum, item) => sum + item.estimateWon, 0)
  const budgetRisk = dailyBudgetWon > 0 && remainingAdjustableCost > 0 && todayAvailable < remainingAdjustableCost

  const fatigueRingCirc   = 2 * Math.PI * 24
  const fatigueRingOffset = fatigueRingCirc - (fatigueVal / 10) * fatigueRingCirc
  const fatigueRingColor  = fatigueVal >= 8 ? 'var(--rose)' : fatigueVal >= 6 ? 'var(--amber)' : 'var(--green)'

  const mapState = useCallback(() => ({
    schedule, activeIdx, activeStopIdx, selectedTravelMode,
    activeTransitStepIdx, routeModeResults, cityData, transitResults,
  }), [schedule, activeIdx, activeStopIdx, selectedTravelMode, activeTransitStepIdx, routeModeResults, cityData, transitResults])

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

  // ── 지출 입력창 자동 채우기 ────────────────────────────────
  useEffect(() => {
    const stop = dayStops[activeStopIdx]
    if (!stop?.name) return
    const nextName = `${stop.name} 지출`
    if (!expName.trim() || expName === lastAutoExpNameRef.current) {
      setExpName(nextName)
      lastAutoExpNameRef.current = nextName
    }
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
  }, [dayStops.length])

  // ── 날 선택 ───────────────────────────────────────────────
  const selectDay = useCallback((idx) => {
    setActiveIdx(idx)
    setActiveStopIdx(0)
    setSelectedTravelMode('WALKING')
    setActiveTransitStepIdx(null)
    setOpenTransitKey('')
  }, [])

  // ── 지출 추가 ─────────────────────────────────────────────
  const handleAddExpense = useCallback(() => {
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
  }, [expName, expAmt, expCat, localToKrw, total, totalSpent, currentDayNumber, activeStopIdx, exchangeRate, dayStops, showToast, formatLocalAmount, formatExpense, todayAvailable])

  // ── 액션 핸들러 ───────────────────────────────────────────
  const handle = useCallback((action) => {
    switch (action) {
      case 'wxReroute':
        showToast('☔', '오후 비 예보 감지', '기존 루트에서 멀지 않은 실내 코스로 재경로할까요?', 'warn', [
          { label: '실내 루트 적용', action: 'applyWx', primary: true }, { label: '무시', action: '_dismiss' },
        ]); break
      case 'applyWx':
        setToast(t => ({ ...t, show: false }))
        setRouteCard({ title: '실내 재경로: 피카소 미술관 우선', desc: '야외 산책 → 실내 코스. +9분' })
        showToast('✓', '실내 루트 적용됨', '기존 관광 순서 유지. 야외 구간만 실내로 전환됩니다.', 'ok'); break
      case 'safeRoute':
        setRouteCard({ title: '안전 우회: Passeig de Gracia', desc: '최단 경로 +6분 · 사고 이력 없음 · 조명 충분' })
        showToast('🛡', '안전 우회 경로 적용', '대로변으로 안내합니다.', 'ok'); break
      case 'restore':
        setMealRerouteOpen(false)
        setToast(t => ({ ...t, show: false })); break
      case 'applyMeal':
        setMealRerouteOpen(false)
        setRouteCard({ title: `식당 변경: 평균 ${formatEurAsKrw(19)} 타파스 바 적용`, desc: '루트 420m 이내 · 관광 순서 유지됨' })
        showToast('✓', '식당 변경 적용', '기존 관광 루트와 크게 벗어나지 않는 대체 식당으로 조정되었습니다.', 'ok'); break
      case 'fatigueReroute':
        showToast('◇', `피로도 ${fatigueVal}/10 — 루트 조정`, '도보를 줄이고 카페 휴식과 택시 구간을 늘린 루트로 바꿀까요?', 'warn', [
          { label: '적용', action: 'applyFatigue', primary: true }, { label: '유지', action: '_dismiss' },
        ]); break
      case 'applyFatigue':
        setToast(t => ({ ...t, show: false }))
        setRouteCard({ title: '휴식 루트: 카페 40분 + 택시 구간', desc: '도보 -2km · 오후 카페 휴식 후 복귀' })
        showToast('✓', '휴식 루트 적용됨', '관광 포인트 유지. 이동 방식과 중간 휴식만 조정됩니다.', 'ok'); break
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
  }, [showToast, fatigueVal, formatEurAsKrw, schedule, activeIdx, activeStopIdx, cityData, selectedTravelMode, routeModeResults, emergencyMapUrl])

  // ── 모달 ──────────────────────────────────────────────────
  const openModal  = useCallback((key) => { setActiveModalKey(key); setModalOpen(true) }, [])
  const closeModal = useCallback(() => { setModalOpen(false); setActiveModalKey('') }, [])

  const saveAlbumMemory = useCallback(() => {
    const token = localStorage.getItem('tripHelperToken')
    if (!token) { closeModal(); return }
    const currentStop = dayStops[activeStopIdx]
    const planResult  = readGeneratedPlanResult()
    const payload = {
      photoUrl: albumPhotoUrl || null, memo: albumMemo || null,
      locationName: currentStop?.name || null, dayNum: day?.day || 1,
      destination: travelData?.destination || '내 여행',
      planId: getGeneratedPlanId(planResult),
    }
    const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')
    fetch(`${apiBase}/api/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    }).finally(closeModal)
  }, [dayStops, activeStopIdx, albumPhotoUrl, albumMemo, day, travelData, closeModal])

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
    requestSimpleRoute(stopIdx, mode, { schedule, activeIdx, cityData }, (k, result) => {
      setRouteModeResults(prev => ({ ...prev, [k]: result }))
    })
  }, [day, schedule, activeIdx, cityData, routeModeResults])

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
    hotel: '숙소 전략', budget: '예산 분석', fatigue: '피로도 상세',
    album: '여행 앨범', safety: '야간 안전 정보',
  }

  return (
    <div className="ai-travel-duration-page">

      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-in">
          <a className="brand" href="#"><span className="brand-icon">📱</span>Trip Helper</a>
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
            </div>
          </div>
          <div className="dest-right">
            <div className="budget-badge">
              <div className="budget-label">예산 소진율</div>
              <div className="budget-bar"><div className="budget-bar-fill" style={{ width: `${budgetPct}%` }}></div></div>
              <div className="budget-nums">
                <span className="budget-spent">{formatExpense(currentDaySpent)}</span>
                <span className="budget-total">/ {dailyBudgetWon ? formatKrw(dailyBudgetWon) : '₩0'}</span>
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
              {[
                { modal: 'translate', icon: '↔', label: '번역'    },
                { modal: 'budget',    icon: '◫', label: '예산'    },
                { modal: 'fatigue',   icon: '◇', label: '피로도'  },
                { modal: 'nearby',    icon: '＋', label: '편의시설' },
                { modal: 'emergency', icon: '🚨', label: '긴급'    },
                { modal: 'safety',    icon: '🛡', label: '야간안전' },
                { modal: 'album',     icon: '▧', label: '사진'    },
                { modal: 'hotel',     icon: '🏨', label: '숙소'    },
              ].map(({ modal, icon, label }) => (
                <button key={modal} className="tool-pad-btn" onClick={() => openModal(modal)}>
                  <span>{icon}</span>{label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* FEED */}
        <section className="feed">

          {/* 타임라인 */}
          <div className="sec">
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
                {dayStops.map((stop, i) => {
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
                                    selectStop(i)
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
                                        if (opt.mode === 'taxi') handleSimpleRouteRequest(i, 'taxi')
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
          <div className="sec">
            <div className="sec-head">
              <div>
                <div className="sec-kicker">Live Budget</div>
                <h2>실시간 지출 관리</h2>
              </div>
              <div className="budget-head-summary">
                <div className="budget-head-card">
                  <span>오늘 사용 가능</span>
                  <strong>{total ? formatExpense(todayAvailable) : '예산 미설정'}</strong>
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
                      <div>
                        <div className="b-block-title">예산 맞춤 조정 후보</div>
                        <p>남은 예산으로 오늘 일정 소화가 어려워요. 저녁 식사를 저가 옵션으로 바꾸거나 쇼핑 일정을 줄이는 걸 추천합니다.</p>
                      </div>
                      <strong>{formatExpense(remainingAdjustableCost)}</strong>
                    </div>
                    <div className="budget-adjust-list">
                      {adjustmentCandidates.slice(0, 4).map(candidate => (
                        <div key={`${candidate.index}-${candidate.stop.name}`} className="budget-adjust-item">
                          <div>
                            <strong>{candidate.stop.name}</strong>
                            <span>{candidate.suggestion}</span>
                          </div>
                          <em>{formatExpense(candidate.estimateWon)}</em>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="b-block">
                  <div className="b-block-title">실시간 지출 입력</div>
                  <div className="exp-form">
                    <input
                      className="exp-input" value={expName} aria-label="지출 내역" placeholder="예: 점심 식사"
                      onChange={e => { setExpName(e.target.value); lastAutoExpNameRef.current = '' }}
                    />
                    <input
                      className="exp-num" value={expAmt} aria-label="지출 금액" type="number" inputMode="decimal"
                      placeholder={exchangeRate.currency ? `금액(${exchangeRate.currency})` : '통화 확인 중'}
                      onChange={e => setExpAmt(e.target.value)}
                    />
                    <select className="exp-cat-sel" value={expCat} aria-label="지출 카테고리" onChange={e => setExpCat(e.target.value)}>
                      <option value="meal">식사</option>
                      <option value="transport">교통</option>
                      <option value="entry">입장비</option>
                      <option value="shop">쇼핑</option>
                    </select>
                    <button className="exp-add" onClick={handleAddExpense}>+</button>
                  </div>
                  <div className="exp-log">
                    {currentDayExpenses.length > 0
                      ? currentDayExpenses.map((e, ei) => (
                          <div key={ei} className="exp-log-item">
                            <div className="exp-log-left">
                              <span className="exp-cat-dot" style={{ background: BUDGET_CATEGORIES.find(c => c.key === e.cat)?.color }}></span>
                              <span className="exp-log-name">{e.name}</span>
                            </div>
                            <span className={`exp-log-amt${e.over ? ' over' : ''}`}>{formatExpenseLogAmount(e)}</span>
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
                <button className="map-icon-btn" onClick={() => handle('openMapModal')} aria-label="지도 확대">⛶</button>
                <button className="map-hd-btn"   onClick={() => handle('routeGuide')}>경로 안내</button>
              </div>
            </div>
            <div className="map-frame" id="liveMap">
              {!mapReady && <div className="map-fallback">Google Maps API 키 연결 시<br />숙소·관광지·식당·야간 안전 경로 표시</div>}
            </div>
            <div className="map-route-card">
              <strong>{routeCard.title}</strong>
              <span>{routeCard.desc}</span>
            </div>
            <div className="map-btns">
              <button className="map-btn primary" onClick={() => handle('safeRoute')}>🛡 안전 우회</button>
              <button className="map-btn sec"     onClick={() => handle('restore')}>원래 루트</button>
            </div>
          </div>

          <div className="wx-card">
            <div className="wx-bg">
              <span className="wx-icon-big">🌦</span>
              <div>
                <div className="wx-num">24°</div>
                <div className="wx-cond">오전 맑음 · 오후 3시 비</div>
              </div>
            </div>
            <div className="wx-outfit">
              <strong>오늘 옷차림</strong>
              <span>얇은 방수 재킷 + 접이식 우산. 미끄럽지 않은 밑창 신발.</span>
            </div>
            <div className="wx-btns">
              <button className="map-btn primary" style={{ flex: 1 }} onClick={() => handle('wxReroute')}>실내 재경로</button>
              <button className="map-btn sec"     style={{ flex: 1 }} onClick={() => handle('restore')}>원래 루트</button>
            </div>
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
            <button className="fc-btn" onClick={() => handle('fatigueReroute')}>휴식 루트 보기</button>
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
        onClick={e => { if (e.target.classList.contains('overlay')) closeModal() }}
      >
        <div className="modal-box">
          <div className="modal-title">{modalTitles[activeModalKey]}</div>
          <div>
            {modalOpen && activeModalKey && (
              <ModalContent
                modalKey={activeModalKey}
                travelData={travelData}
                expenses={expenses}
                schedule={schedule}
                cityData={cityData}
                activeIdx={activeIdx}
                activeStopIdx={activeStopIdx}
                dayStops={dayStops}
                albumPhoto={albumPhoto}
                albumPhotoUrl={albumPhotoUrl}
                albumMemo={albumMemo}
                setAlbumPhoto={setAlbumPhoto}
                setAlbumPhotoUrl={setAlbumPhotoUrl}
                setAlbumMemo={setAlbumMemo}
                formatExpense={formatExpense}
                formatKrw={formatKrw}
                formatEurAsKrw={formatEurAsKrw}
                total={total}
                totalSpent={totalSpent}
                categoryBreakdown={categoryBreakdown}
                emergencyMapUrl={emergencyMapUrl}
                setEmergencyMapUrl={setEmergencyMapUrl}
                getActiveEmergencyPoint={getActiveEmergencyPoint}
                closeModal={closeModal}
              />
            )}
          </div>
          <div className="modal-footer">
            <button className="mf ghost" onClick={closeModal}>닫기</button>
            <button className="mf primary" onClick={() => { if (activeModalKey === 'album') saveAlbumMemory(); else closeModal() }}>확인</button>
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
  modalKey, travelData, expenses, schedule, cityData, activeIdx, activeStopIdx, dayStops,
  albumPhoto, albumPhotoUrl, albumMemo, setAlbumPhoto, setAlbumPhotoUrl, setAlbumMemo,
  formatExpense, formatKrw, formatEurAsKrw, total, totalSpent, categoryBreakdown,
  emergencyMapUrl, setEmergencyMapUrl, getActiveEmergencyPoint, closeModal,
}) {
  const [consulateHtml,  setConsulateHtml]  = useState('')
  const [nearbyHtml,     setNearbyHtml]     = useState('')
  const [consulateLoading, setConsulateLoading] = useState(true)
  const [nearbyLoading,    setNearbyLoading]    = useState(true)

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

  if (modalKey === 'translate') return (
    <div>
      <div className="mi-phrase">
        {['이거 얼마예요?', '화장실 어디예요?', '영수증 주세요', '택시 불러주세요', '병원이 어디예요?', '도와주세요!'].map(p => (
          <button key={p}>{p}</button>
        ))}
      </div>
      <textarea className="mi-textarea" placeholder="번역할 내용을 입력하세요..."></textarea>
      <div className="mi-result">번역 결과가 여기에 표시됩니다.</div>
    </div>
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
      {['💊 약국 — 현재 위치 기준 조회 예정', '🏥 병원 — 현재 위치 기준 조회 예정', '🛒 편의점 — 현재 위치 기준 조회 예정', '💸 ATM — 현재 위치 기준 조회 예정', '🚻 공공 화장실 — 현재 위치 기준 조회 예정'].map(t => {
        const [k, v] = t.split(' — ')
        return <div key={k} className="mi-row"><strong>{k}</strong><span>{v}</span></div>
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
    <div>
      <div className="mi-row"><strong>총 지출</strong><span style={{ fontFamily: "'JetBrains Mono',monospace", color: 'var(--gold)' }}>{formatExpense(spent)} / {total ? formatKrw(total) : '예산 미설정'}</span></div>
      <div className="mi-row"><strong>예산 소진율</strong><span>{pct}%</span></div>
      <div className="mi-row"><strong>남은 예산</strong><span style={{ color: 'var(--green)' }}>{total ? formatExpense(remaining) : '예산을 선택하지 않음'}</span></div>
      <div className="mi-row"><strong>카테고리 비중</strong><span>전체 지출 기준</span></div>
      {categoryBreakdown.length > 0
        ? categoryBreakdown.map(cat => (
            <div key={cat.key} className="mi-row">
              <strong>{cat.icon} {cat.label}</strong>
              <span>{formatExpense(cat.amount)} · {cat.pct}%</span>
            </div>
          ))
        : <div className="mi-row"><strong>지출 내역</strong><span>아직 없음</span></div>
      }
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
        <label className="mi-album-drop">
          <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files[0]; if (f) loadFile(f); e.target.value = '' }} />
          <div className="mi-album-drop-icon">📷</div>
          <div className="mi-album-drop-text">클릭하거나 사진을 드래그하세요</div>
          <div className="mi-album-drop-hint">JPG · PNG · GIF · HEIC 지원</div>
        </label>
      )}
      <div className="mi-album-memo-wrap">
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
      <div className="mi-emergency"><strong>⚠️ Carrer de Sant Pau</strong><span>최근 3년 소매치기 5건 · 야간 단독 비권장</span></div>
      <div className="mi-safe"><strong>✓ Passeig de Gracia</strong><span>+6분 · 조명 충분 · 사고 이력 없음</span></div>
      <div className="mi-row"><strong>권고</strong><span>야간 이동 시 대로변 우선, 스마트폰 노출 최소화</span></div>
    </div>
  )

  return null
}
