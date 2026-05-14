// AI 여행 일정 생성 입력 폼 뷰 컴포넌트
import { useState, useEffect, useCallback, useMemo } from 'react'
import CalendarPicker from '../common/CalendarPicker'
import { validateBudget } from '../../utils/budgetValidation'
import {
  CONTINENTS,
  INTENSITY_LABELS,
  STEP_DONE_GUIDES,
  STEP_GUIDES,
  STYLE_SUGGESTIONS
} from '../../data/AiGenerationInputForm'

// ── SVG 아이콘 (Lucide 스타일 stroke 아이콘, 이모지 없음) ──
const Icons = {
  Globe: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Wallet: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
      <path d="M18 12a2 2 0 0 0 0 4h4v-4h-4z"/>
    </svg>
  ),
  Zap: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Tag: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
      <line x1="7" y1="7" x2="7.01" y2="7"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
      <circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Users: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  MessageSquare: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  Check: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: () => (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Plane: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21 4 19.5 2.5S18 2 16.5 3.5L13 7 4.8 5.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12H6l-1.5 1.5 1.5 2 2 1.5L9.5 18l2-1.5V21l1.5-1 .9-4.3L17 19.8c.4.2.8.1 1-.2l.8-1c.3-.3.3-.8 0-1.4z"/>
    </svg>
  ),
}

function readDraft() {
  try {
    const stored = sessionStorage.getItem('aiTripDraft')
    return stored ? JSON.parse(stored) : null
  } catch { return null }
}

const DRAFT_RESTORE_KEY = 'aiTripDraftRestore'

export default function AiGenerationInputFormView() {
  // ── 상태 관리 ──
  const [currentStep, setCurrentStep] = useState(0)
  const [continent, setContinent] = useState('')
  const [destinations, setDestinations] = useState([])
  const [dates, setDates] = useState({ startDate: '', endDate: '' })
  const [travelMode, setTravelMode] = useState('personal')
  const [counts, setCounts] = useState({ adults: 1, teens: 0, children: 0, infants: 0 })
  const [budgetText, setBudgetText] = useState('')
  const [budgetError, setBudgetError] = useState('')
  const [intensity, setIntensity] = useState(0)
  const [intensityTouched, setIntensityTouched] = useState(false)
  const [travelPreference, setTravelPreference] = useState('')
  const [places, setPlaces] = useState([])
  const [styles, setStyles] = useState([])

  useEffect(() => {
    const shouldRestoreDraft = sessionStorage.getItem(DRAFT_RESTORE_KEY) === 'true'
    sessionStorage.removeItem(DRAFT_RESTORE_KEY)
    if (!shouldRestoreDraft) {
      sessionStorage.removeItem('aiTripDraft')
      return
    }

    const draft = readDraft()
    if (!draft) return
    if (draft.destinations?.length) setDestinations(draft.destinations)
    if (draft.startDate || draft.endDate) setDates({ startDate: draft.startDate || '', endDate: draft.endDate || '' })
    if (draft.travelMode) setTravelMode(draft.travelMode)
    setCounts({ adults: draft.adults ?? 1, teens: draft.teens ?? 0, children: draft.children ?? 0, infants: draft.infants ?? 0 })
    if (draft.budgetText) setBudgetText(draft.budgetText)
    if (draft.intensity) {
      const match = String(draft.intensity).match(/^(\d+)\/100/)
      if (match) { setIntensity(Number(match[1])); setIntensityTouched(true) }
    }
    if (draft.travelPreference) setTravelPreference(draft.travelPreference)
    if (draft.places?.length) setPlaces(draft.places)
    if (draft.styles?.length) setStyles(draft.styles)
  }, [])

  // UI 상태
  const [openCalendar, setOpenCalendar] = useState(null)
  const [warning, setWarning] = useState({ step: null, message: '' })
  const [collabHelpVisible, setCollabHelpVisible] = useState(false)
  const [showModals, setShowModals] = useState({ confirm: false, collabConfirm: false, collabShare: false })
  const [collabRoomUrl, setCollabRoomUrl] = useState('')
  const [collabMemberCount, setCollabMemberCount] = useState(2)
  const [collabCopyState, setCollabCopyState] = useState('')
  const [collabMode, setCollabMode] = useState('together')

  const [destInput, setDestInput] = useState('')
  const [placeInput, setPlaceInput] = useState('')
  const [styleInput, setStyleInput] = useState('')

  const tomorrow = useMemo(() => new Date(Date.now() + 86400000).toISOString().slice(0, 10), [])

  // ── 유틸리티 ──
  const getNights = useCallback(() => {
    if (!dates.startDate || !dates.endDate) return 0
    return Math.max(0, Math.round((new Date(dates.endDate) - new Date(dates.startDate)) / 86400000))
  }, [dates.startDate, dates.endDate])

  const adultTeenTotal = useCallback(() => {
    if (travelMode !== 'group') return 1
    return counts.adults + counts.teens
  }, [travelMode, counts.adults, counts.teens])

  const travelerCount = useCallback(() => counts.adults + counts.teens + counts.children + counts.infants, [counts])

  const destinationLabel = useCallback(() => {
    if (!destinations.length) return ''
    if (destinations.length <= 2) return destinations.join(', ')
    return `${destinations.slice(0, 2).join(', ')} 외 ${destinations.length - 2}곳`
  }, [destinations])

  const formatDate = (value) => {
    if (!value) return ''
    return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(value))
  }

  const travelerText = useCallback(() => {
    if (travelMode === 'personal') return '개인 여행 · 성인 1명'
    const parts = [`성인 ${counts.adults}명`]
    if (counts.teens) parts.push(`청소년 ${counts.teens}명`)
    if (counts.children) parts.push(`어린이 ${counts.children}명`)
    if (counts.infants) parts.push(`유아 ${counts.infants}명`)
    return parts.join(' · ')
  }, [travelMode, counts])

  // ── 스텝 정의 (스타일만 선택, 나머지 필수) ──
  const STEPS = [
    { icon: <Icons.Globe />,    title: '여행지', sub: '어디로',      required: true,  done: () => destinations.length > 0 },
    { icon: <Icons.Calendar />, title: '일정',   sub: '언제 누구와', required: true,  done: () => Boolean(dates.startDate && dates.endDate && getNights() > 0) },
    { icon: <Icons.Wallet />,   title: '예산',   sub: '여행 예산',   required: true,  done: () => budgetText.trim().length > 0 && validateBudget(budgetText).valid },
    { icon: <Icons.Zap />,      title: '강도',   sub: '여행 강도',   required: true,  done: () => intensityTouched },
    { icon: <Icons.Tag />,      title: '스타일', sub: '선택 추천',   required: false, done: () => styles.length > 0 },
  ]

  const showStepWarning = (step, message) => {
    setWarning({ step, message })
    setTimeout(() => setWarning({ step: null, message: '' }), 2000)
  }

  const canGoStep = (targetStep) => {
    const next = Number(targetStep)
    if (next <= currentStep) return true

    if (next > 0 && destinations.length === 0) {
      setCurrentStep(0); showStepWarning(0, '여행지를 먼저 선택해주세요.'); return false
    }
    if (next > 1 && travelMode === 'group' && adultTeenTotal() < 2) {
      setCurrentStep(1); showStepWarning(1, '단체는 2인 이상이어야 합니다.'); return false
    }
    if (next > 1 && !(dates.startDate && dates.endDate && getNights() > 0)) {
      setCurrentStep(1); showStepWarning(1, '일정을 먼저 입력해주세요.'); return false
    }
    if (next > 2 && !budgetText.trim()) {
      setCurrentStep(2); showStepWarning(2, '예산을 입력해주세요.'); return false
    }
    if (next > 2 && !validateBudget(budgetText).valid) {
      setCurrentStep(2); showStepWarning(2, '올바른 예산 형식으로 수정해주세요.'); return false
    }
    if (next > 3 && !intensityTouched) {
      setCurrentStep(3); showStepWarning(3, '여행 강도를 설정해주세요.'); return false
    }
    return true
  }

  const goStep = (index) => {
    setCurrentStep(Number(index))
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => {
      document.querySelector('.journey-tab.active')?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }, 60)
  }

  const applyDate = (field, value) => {
    setDates(prev => {
      const next = { ...prev, [field]: value }
      if (field === 'startDate' && next.endDate && next.endDate <= value) next.endDate = ''
      return next
    })
    setOpenCalendar(null)
  }

  const handleIntensityChange = (value) => {
    setIntensity(Math.min(100, Math.max(0, parseInt(value, 10) || 0)))
    setIntensityTouched(true)
  }

  const addDestination = (val) => {
    const trimmed = val.trim()
    if (!trimmed || destinations.includes(trimmed)) return
    setDestinations(prev => [...prev, trimmed])
    setDestInput('')
  }

  const addPlace = () => {
    const trimmed = placeInput.trim()
    if (trimmed && !places.includes(trimmed)) setPlaces(prev => [...prev, trimmed])
    setPlaceInput('')
  }

  const addStyle = (val) => {
    const trimmed = val.replace(/^#+/, '').trim()
    if (!trimmed || styles.includes(trimmed)) return
    setStyles(prev => [...prev, trimmed])
    setStyleInput('')
  }

  const toggleStyle = (style) => {
    setStyles(prev => prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style])
  }

  const updateCount = (key, dir) => {
    const min = key === 'adults' ? 1 : 0
    setCounts(prev => ({ ...prev, [key]: Math.min(20, Math.max(min, prev[key] + dir)) }))
  }

  const createRoomId = () => `trip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`

  const tripDraft = useCallback(() => ({
    destination: destinationLabel(),
    destinations: [...destinations],
    startDate: dates.startDate,
    endDate: dates.endDate,
    nights: getNights(),
    travelMode,
    adults: counts.adults,
    teens: counts.teens,
    children: counts.children,
    infants: counts.infants,
    budgetText: budgetText.trim(),
    intensity: intensityTouched ? `${intensity}/100 · ${(INTENSITY_LABELS.find(item => intensity <= item.max) || INTENSITY_LABELS[INTENSITY_LABELS.length - 1]).text}` : '',
    travelPreference: travelPreference.trim(),
    places: [...places],
    styles: [...styles],
  }), [destinationLabel, destinations, dates, travelMode, counts, budgetText, intensity, intensityTouched, travelPreference, places, styles, getNights])

  const openCollabConfirm = () => {
    if (styleInput.trim()) addStyle(styleInput)
    if (destinations.length === 0) { showStepWarning(0, '함께 작업하기 전에 여행지를 선택해주세요.'); return }
    if (!(dates.startDate && dates.endDate && getNights() > 0)) { showStepWarning(1, '함께 작업하기 전에 출발일과 귀국일을 입력해주세요.'); return }
    setCollabMemberCount(Math.min(20, Math.max(2, adultTeenTotal())))
    setCollabMode('together')
    setShowModals(prev => ({ ...prev, collabConfirm: true }))
  }

  const openCollabShare = () => {
    const roomId = createRoomId()
    const draft = tripDraft()
    const params = new URLSearchParams({ members: String(collabMemberCount) });
    ['destination', 'startDate', 'endDate', 'adults', 'teens', 'children', 'infants'].forEach(key => {
      const value = draft[key]
      if (value) params.set(key, String(value))
    })
    if (draft.places.length) params.set('places', draft.places.join(','))
    const url = `${window.location.origin}/ai-collaboration-planning/${roomId}?${params.toString()}`
    setCollabRoomUrl(url)
    sessionStorage.setItem('aiTripDraft', JSON.stringify(draft))
    sessionStorage.setItem('aiCollabMemberCount', String(collabMemberCount))
    setShowModals(prev => ({ ...prev, collabConfirm: false, collabShare: true }))
    setCollabCopyState('')
  }

  const copyCollabUrl = () => {
    navigator.clipboard?.writeText(collabRoomUrl)
    setCollabCopyState('공유 URL이 복사되었습니다.')
  }

  const openConfirmModal = () => {
    if (styleInput.trim()) addStyle(styleInput)
    setShowModals(prev => ({ ...prev, confirm: true }))
  }

  const submitPlan = () => {
    sessionStorage.setItem('aiTripDraft', JSON.stringify(tripDraft()))
    window.location.href = '/ai-generation-loading'
  }

  // ── 파생 계산 ──
  const hasDestination = destinations.length > 0
  const hasDates = Boolean(dates.startDate && dates.endDate && getNights() > 0)
  const hasBudget = budgetText.trim().length > 0 && validateBudget(budgetText).valid
  const hasIntensity = intensityTouched
  const ready = hasDestination && hasDates && hasBudget && hasIntensity
  const nights = getNights()
  const totalTravelers = travelerCount()

  const summaryChips = useMemo(() => {
    const chips = []
    if (destinations.length) chips.push(destinationLabel())
    if (places.length) chips.push(`고정 장소 ${places.length}곳`)
    if (nights > 0) chips.push(`${nights}박 ${nights + 1}일`)
    if (currentStep > 0) chips.push(`${totalTravelers}명`)
    if (budgetText.trim()) {
      const label = budgetText.trim()
      chips.push(label.length > 14 ? label.slice(0, 14) + '…' : label)
    }
    if (intensityTouched) chips.push(`강도 ${intensity}/100`)
    styles.forEach(s => chips.push(`#${s}`))
    return chips
  }, [destinations, destinationLabel, places, nights, currentStep, totalTravelers, budgetText, intensity, intensityTouched, styles])

  const intensityDesc = intensityTouched
    ? (INTENSITY_LABELS.find(item => intensity <= item.max) || INTENSITY_LABELS[INTENSITY_LABELS.length - 1]).text
    : '강도를 정해주세요'

  const intensityColor = intensity <= 30 ? '#0f6bff' : intensity <= 60 ? '#00a676' : intensity <= 80 ? '#ffb020' : '#ef4444'

  const confirmItems = [
    { icon: <Icons.Globe />,         label: '여행지',      value: destinationLabel(), type: 'strong' },
    { icon: <Icons.Calendar />,      label: '여행 기간',   value: `${formatDate(dates.startDate)} ~ ${formatDate(dates.endDate)} (${nights}박 ${nights + 1}일)` },
    { icon: <Icons.User />,          label: '인원',        value: travelerText() },
    { icon: <Icons.MapPin />,        label: '꼭 갈 장소',  value: places.length ? places : ['선택 안 함'], type: 'chips' },
    { icon: <Icons.Wallet />,        label: '예산',        value: budgetText.trim() || '미입력' },
    { icon: <Icons.Zap />,           label: '여행 강도',   value: intensityTouched ? `${intensity}/100 · ${intensityDesc}` : '미설정' },
    { icon: <Icons.Tag />,           label: '여행 스타일', value: styles.length ? styles.map(s => `#${s}`) : ['선택 안 함'], type: 'chips' },
    { icon: <Icons.MessageSquare />, label: '선호 방식',   value: travelPreference.trim() || '입력 안 함', type: 'note' },
  ]

  useEffect(() => {
    if (travelMode === 'group' && adultTeenTotal() >= 2) {
      setCollabHelpVisible(true)
      const timer = setTimeout(() => setCollabHelpVisible(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [travelMode, adultTeenTotal])

  return (
    <div className="ai-generation-input-form-page">
      <main className="shell">

        {/* ── 왼쪽 커버 ── */}
        <aside className="cover">
          <div className="brand">
            <a className="brand-mark" href="/home">
              <span className="logo-box">✈</span>
              <span>폰가이즈</span>
            </a>
            <div className="step-mini" aria-label="필수 입력 진행률">
              <span className={`dot ${hasDestination ? 'done' : ''}`}></span>
              <span className={`dot ${hasDates ? 'done' : ''}`}></span>
            </div>
          </div>

          <section className="cover-copy">
            <div className="eyebrow">AI TRAVEL PLANNER</div>
            <h1>취향을 읽는<br />여행 설계</h1>
            <p>어디로, 누구와, 어떤 속도로 움직일지만 정하면<br />일정의 뼈대가 자연스럽게 잡힙니다.</p>
          </section>

          <section className="summary-card" aria-live="polite">
            <div className="summary-list">
              {[hasDestination, hasDates, hasBudget, hasIntensity, styles.length > 0].map((done, idx) => (
                <p key={idx} className={`summary-line ${done ? 'done' : ''}`}>
                  <span className="summary-line-icon">{done ? <Icons.Check /> : <Icons.X />}</span>
                  <span>{done ? STEP_DONE_GUIDES[idx] : STEP_GUIDES[idx]}</span>
                </p>
              ))}
            </div>
            <div className="summary-chips">
              {summaryChips.map((chip, idx) => (
                <span key={idx} className="summary-chip">{chip}</span>
              ))}
            </div>
          </section>
        </aside>

        {/* ── 오른쪽 작업 영역 ── */}
        <section className="work">
          <div className="work-inner">
            <header className="topbar">
              <div>
                <h2>AI 여행 일정 생성</h2>
                <p>한 번에 전부 묻지 않고, 여행을 설계하는 순서대로 짧게 이어갑니다.</p>
              </div>
              <div className="progress" aria-hidden="true">
                <span style={{ width: `${Math.max(currentStep + 1, STEPS.filter(s => s.done()).length) / STEPS.length * 100}%` }}></span>
              </div>
            </header>

            <nav className="journey-nav" aria-label="여행 입력 단계">
              {STEPS.map((step, index) => (
                <button
                  key={index}
                  className={`journey-tab ${index === currentStep ? 'active' : ''} ${index < currentStep || step.done() ? 'done' : ''}`}
                  type="button"
                  onClick={() => { if (canGoStep(index)) goStep(index) }}
                >
                  <span className="tab-icon">{step.icon}</span>
                  <span className="tab-text">
                    <strong>{step.title}</strong>
                    <small>{step.sub}</small>
                  </span>
                </button>
              ))}
            </nav>

            <form className="form stage" onSubmit={(e) => e.preventDefault()}>

              {/* STEP 01: 여행지 */}
              <section className={`step-panel ${currentStep === 0 ? 'active' : ''}`}>
                <div className="step-hero" data-step="0" data-num="01">
                  <p>Step 01</p>
                  <h3>여행지를 선택해주세요.</h3>
                </div>
                <section className="panel">
                  <div className="panel-head">
                    <div className="title-wrap">
                      <h3><Icons.Globe />여행지</h3>
                      <p className="panel-note">대륙을 고르면 대표 국가가 열립니다. 직접 입력도 가능합니다.</p>
                    </div>
                    <span className="badge required">필수</span>
                  </div>
                  <div className="continent-grid">
                    {CONTINENTS.map(item => (
                      <button
                        key={item.key}
                        data-key={item.key}
                        className={`choice ${continent === item.key ? 'active' : ''}`}
                        type="button"
                        onClick={() => setContinent(prev => prev === item.key ? '' : item.key)}
                      >
                        <span className="choice-label">{item.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="chips">
                    {CONTINENTS.find(c => c.key === continent)?.countries.map(country => (
                      <button
                        key={country}
                        className={`chip ${destinations.includes(country) ? 'active' : ''}`}
                        type="button"
                        onClick={() => setDestinations(prev => prev.includes(country) ? prev.filter(d => d !== country) : [...prev, country])}
                      >
                        {country}
                      </button>
                    ))}
                  </div>
                  <div className="input-row">
                    <input
                      className="input"
                      type="text"
                      placeholder="직접 입력 후 Enter (예: 포르투갈, 하와이)"
                      value={destInput}
                      onChange={(e) => setDestInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addDestination(destInput) } }}
                    />
                  </div>
                  <div className="tags chips">
                    {destinations.map((dest, idx) => (
                      <span key={idx} className="tag">
                        {dest}
                        <button type="button" onClick={() => setDestinations(prev => prev.filter((_, i) => i !== idx))}>×</button>
                      </span>
                    ))}
                  </div>
                  <div className="suggestion-block">
                    <div className="panel-head">
                      <div className="title-wrap">
                        <h3><Icons.MapPin />꼭 가고 싶은 장소</h3>
                        <p className="panel-note">랜드마크, 동네, 식당 이름까지 자유롭게 추가합니다.</p>
                      </div>
                      <span className="badge">선택</span>
                    </div>
                    <div className="input-row">
                      <input
                        className="input"
                        type="text"
                        placeholder="장소 입력 (예: 에펠탑, 신주쿠)"
                        value={placeInput}
                        onChange={(e) => setPlaceInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPlace() } }}
                      />
                      <button className="add-button" type="button" onClick={addPlace}>추가</button>
                    </div>
                    <div className="tags chips">
                      {places.map((place, idx) => (
                        <span key={idx} className="tag place">
                          {place}
                          <button type="button" onClick={() => setPlaces(prev => prev.filter((_, i) => i !== idx))}>×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                </section>
                <div className="step-actions">
                  <p className={`step-warning ${warning.step === 0 ? 'show' : ''}`}>{warning.message}</p>
                  <button className="step-action" type="button" onClick={() => { if (canGoStep(1)) goStep(1) }}>일정 입력</button>
                </div>
              </section>

              {/* STEP 02: 일정/인원 */}
              <section className={`step-panel ${currentStep === 1 ? 'active' : ''}`}>
                <div className="step-hero" data-step="1" data-num="02">
                  <p>Step 02</p>
                  <h3>일정과 인원을 입력해주세요.</h3>
                </div>
                <div className="two-col">
                  <section className="panel">
                    <div className="panel-head">
                      <div className="title-wrap">
                        <h3><Icons.Calendar />여행 기간</h3>
                        <p className="panel-note">출발일과 귀국일을 선택해주세요.</p>
                      </div>
                      <span className="badge required">필수</span>
                    </div>
                    <div className="date-grid">
                      <div>
                        <span className="field-label">출발일</span>
                        <input
                          className="date-input"
                          type="text"
                          value={dates.startDate}
                          placeholder="날짜 선택"
                          readOnly
                          onClick={() => setOpenCalendar('startDate')}
                        />
                      </div>
                      <div>
                        <span className="field-label">귀국일</span>
                        <input
                          className="date-input"
                          type="text"
                          value={dates.endDate}
                          placeholder="날짜 선택"
                          readOnly
                          onClick={() => setOpenCalendar('endDate')}
                        />
                      </div>
                    </div>
                    <div className={`notice ${nights > 0 ? 'show' : ''}`}>
                      {nights > 0 && <><span>총 여행 기간</span><strong>{nights}박 {nights + 1}일</strong></>}
                    </div>
                  </section>

                  <section className="panel">
                    <div className="panel-head">
                      <div className="title-wrap">
                        <h3><Icons.Users />인원 구성</h3>
                        <p className="panel-note">
                          {travelMode === 'group' ? '단체 여행은 인원 설정 후 함께 계획할 수 있습니다.' : '개인 여행은 1명으로 일정이 생성됩니다.'}
                        </p>
                      </div>
                    </div>
                    <div className="travel-mode" aria-label="여행 인원 유형">
                      <button className={travelMode === 'personal' ? 'active' : ''} type="button" onClick={() => setTravelMode('personal')}>
                        <span className="mode-icon"><Icons.User /></span>
                        <strong>개인<small>혼자 계획하기</small></strong>
                      </button>
                      <button className={travelMode === 'group' ? 'active' : ''} type="button" onClick={() => setTravelMode('group')}>
                        <span className="mode-icon"><Icons.Users /></span>
                        <strong>단체<small>함께 계획하기</small></strong>
                      </button>
                    </div>
                    <div className="counter-list" hidden={travelMode !== 'group'}>
                      {Object.entries({ adults: '성인', teens: '청소년', children: '어린이', infants: '유아' }).map(([key, label]) => (
                        <div key={key} className="counter-row">
                          <div className="counter-name">
                            {label}
                            <small>{key === 'adults' ? '만 19세 이상' : key === 'teens' ? '만 13~18세' : key === 'children' ? '만 3~12세' : '만 0~2세'}</small>
                          </div>
                          <div className="counter-control">
                            <button className="round" type="button" disabled={counts[key] <= (key === 'adults' ? 1 : 0)} onClick={() => updateCount(key, -1)}>−</button>
                            <span className="count">{counts[key]}</span>
                            <button className="round" type="button" disabled={counts[key] >= 20} onClick={() => updateCount(key, 1)}>+</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
                <div className="step-actions has-back">
                  <p className={`step-warning ${warning.step === 1 ? 'show' : ''}`}>{warning.message}</p>
                  <div className="collab-help" hidden={!collabHelpVisible}>동시에 여행 계획을 세울 수 있어요.</div>
                  <button className="step-action light" type="button" onClick={() => goStep(0)}>이전</button>
                  <div className="step-action-group">
                    {travelMode === 'group' && adultTeenTotal() >= 2 && (
                      <button className="step-action collab-action" type="button" onClick={openCollabConfirm}>함께 계획하기</button>
                    )}
                    <button className="step-action" type="button" onClick={() => { if (canGoStep(2)) goStep(2) }}>예산 입력</button>
                  </div>
                </div>
              </section>

              {/* STEP 03: 예산 */}
              <section className={`step-panel ${currentStep === 2 ? 'active' : ''}`}>
                <div className="step-hero" data-step="2" data-num="03">
                  <p>Step 03</p>
                  <h3>예산을 직접 입력해주세요.</h3>
                </div>
                <section className="panel">
                  <div className="panel-head">
                    <div className="title-wrap">
                      <h3><Icons.Wallet />여행 예산</h3>
                      <p className="panel-note">항공권 제외 총 여행 예산을 입력해주세요.</p>
                    </div>
                    <span className="badge required">필수</span>
                  </div>
                  <div className="input-row">
                    <input
                      className={`input ${budgetError ? 'input-error' : ''}`}
                      type="text"
                      placeholder="예: 100만원, 150만원, 200만원"
                      value={budgetText}
                      onChange={(e) => {
                        const val = e.target.value
                        setBudgetText(val)
                        const result = validateBudget(val)
                        setBudgetError(result.valid ? '' : result.message)
                      }}
                    />
                  </div>
                  {budgetError && <p className="budget-error-msg">{budgetError}</p>}
                  <p className="hint">입력한 예산은 일정 생성과 현지 예산 추적에 활용됩니다.</p>
                </section>
                <div className="step-actions has-back">
                  <p className={`step-warning ${warning.step === 2 ? 'show' : ''}`}>{warning.message}</p>
                  <button className="step-action light" type="button" onClick={() => goStep(1)}>이전</button>
                  <button className="step-action" type="button" onClick={() => { if (canGoStep(3)) goStep(3) }}>여행 강도 조정</button>
                </div>
              </section>

              {/* STEP 04: 강도 */}
              <section className={`step-panel ${currentStep === 3 ? 'active' : ''}`}>
                <div className="step-hero" data-step="3" data-num="04">
                  <p>Step 04</p>
                  <h3>하루 이동 강도를 정해주세요.</h3>
                </div>
                <section className="panel">
                  <div className="panel-head">
                    <div className="title-wrap">
                      <h3><Icons.Zap />여행 강도</h3>
                      <p className="panel-note">휴양 중심부터 촘촘한 일정까지 조절합니다.</p>
                    </div>
                    <span className="badge required">필수</span>
                  </div>
                  <div className="intensity-wrap">
                    <div className="intensity-main">
                      <label className="score">
                        <input type="number" min="0" max="100" value={intensity} onChange={(e) => handleIntensityChange(e.target.value)} onBlur={(e) => handleIntensityChange(e.target.value)} />
                        <span>/100</span>
                      </label>
                      <div className="intensity-text">{intensityDesc}</div>
                    </div>
                    <input
                      className="range"
                      type="range"
                      min="0"
                      max="100"
                      value={intensity}
                      onChange={(e) => handleIntensityChange(e.target.value)}
                      style={{ background: `linear-gradient(to right, ${intensityColor} 0%, ${intensityColor} ${intensity}%, #dce4ee ${intensity}%, #dce4ee 100%)` }}
                    />
                    <div className="range-labels">
                      <span>휴양</span><span>여유</span><span>알찬</span><span>최대</span>
                    </div>
                  </div>
                </section>
                <div className="step-actions has-back">
                  <p className={`step-warning ${warning.step === 3 ? 'show' : ''}`}>{warning.message}</p>
                  <button className="step-action light" type="button" onClick={() => goStep(2)}>이전</button>
                  <button className="step-action" type="button" onClick={() => { if (canGoStep(4)) goStep(4) }}>스타일 선택</button>
                </div>
              </section>

              {/* STEP 05: 스타일 */}
              <section className={`step-panel ${currentStep === 4 ? 'active' : ''}`}>
                <div className="step-hero" data-step="4" data-num="05">
                  <p>Step 05</p>
                  <h3>원하는 여행 스타일을 더해주세요.</h3>
                </div>
                <section className="panel">
                  <div className="panel-head">
                    <div className="title-wrap">
                      <h3><Icons.Tag />여행 스타일</h3>
                      <p className="panel-note">선택하면 더 완벽한 일정을 만들 수 있습니다.</p>
                    </div>
                    <span className="badge">선택 추천</span>
                  </div>
                  <div className="hashbox">
                    <span className="hashmark">#</span>
                    <input
                      type="text"
                      placeholder="스타일 입력 후 Enter (예: 힐링, 맛집탐방)"
                      value={styleInput}
                      onChange={(e) => setStyleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { e.preventDefault(); addStyle(styleInput) }
                        if (e.key === 'Backspace' && !styleInput && styles.length) setStyles(prev => prev.slice(0, -1))
                      }}
                    />
                  </div>
                  <p className="hint">Enter로 태그가 추가됩니다.</p>
                  <div className="suggestion-block">
                    <p className="suggestion-title">자주 쓰는 스타일</p>
                    <div className="purpose-grid">
                      {STYLE_SUGGESTIONS.map(style => (
                        <button key={style} className={`chip ${styles.includes(style) ? 'active' : ''}`} type="button" onClick={() => toggleStyle(style)}>{style}</button>
                      ))}
                    </div>
                  </div>
                  <div className="tags chips">
                    {styles.map((style, idx) => (
                      <span key={idx} className="tag">
                        #{style}
                        <button type="button" onClick={() => setStyles(prev => prev.filter((_, i) => i !== idx))}>×</button>
                      </span>
                    ))}
                  </div>
                </section>

                <section className="panel" style={{ marginTop: '2px' }}>
                  <div className="panel-head">
                    <div className="title-wrap">
                      <h3><Icons.MessageSquare />여행 선호 방식</h3>
                      <p className="panel-note">어떤 식으로 여행하는 걸 좋아하는지 자유롭게 적어주세요.</p>
                    </div>
                    <span className="badge">선택</span>
                  </div>
                  <textarea
                    className="preference-textarea"
                    placeholder="예: 아침 일찍 출발해서 저녁엔 느긋하게 즐겨요. 식사에 많은 시간을 투자하고 싶어요. 걷는 걸 좋아해서 대중교통 선호해요."
                    rows={4}
                    value={travelPreference}
                    onChange={(e) => setTravelPreference(e.target.value)}
                  />
                  <div className="action-bar">
                    <div className="bar-copy">
                      <p className="bar-title">
                        {hasDestination || hasDates ? `${nights}박 ${nights + 1}일 · ${destinationLabel()} · ${totalTravelers}명` : '여행 조건을 입력해주세요'}
                      </p>
                      <p className="bar-sub">
                        {ready
                          ? ([budgetText.trim() ? '예산 반영' : '', `강도 ${intensity}/100`, styles.length > 0 ? `스타일 ${styles.length}개 반영` : ''].filter(Boolean).join(' · ') || '일정 생성 준비 완료')
                          : `${[!hasDestination ? '여행지' : '', !hasDates ? '기간' : '', !hasBudget ? '예산' : '', !hasIntensity ? '강도' : ''].filter(Boolean).join(', ')} 입력이 필요합니다.`
                        }
                      </p>
                    </div>
                    <button className="submit" type="button" disabled={!ready} onClick={openConfirmModal}>일정 생성하기</button>
                  </div>
                </section>
                <div className="step-actions has-back">
                  <button className="step-action light" type="button" onClick={() => goStep(3)}>이전</button>
                </div>
              </section>

            </form>
          </div>
        </section>
      </main>

      {/* CONFIRM MODAL */}
      <div
        className={`confirm-modal ${showModals.confirm ? 'show' : ''}`}
        id="confirmModal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmTitle"
        onClick={(e) => { if (e.target === e.currentTarget) setShowModals(prev => ({ ...prev, confirm: false })) }}
      >
        <section className="confirm-dialog">
          <div className="confirm-head">
            <h3 id="confirmTitle">입력한 조건을 확인해주세요</h3>
            <p>이 내용 그대로 AI 여행 일정을 생성합니다.</p>
          </div>
          <div className="confirm-body">
            {confirmItems.map(({ icon, label, value, type }) => (
              <div key={label} className={`confirm-row ${type ? `is-${type}` : ''}`}>
                <span className="confirm-row-icon" aria-hidden="true">{icon}</span>
                <span className="confirm-row-label">{label}</span>
                <p className="confirm-row-value">
                  {type === 'chips' && Array.isArray(value)
                    ? value.map(item => <span key={item} className="confirm-value-chip">{item}</span>)
                    : value}
                </p>
              </div>
            ))}
          </div>
          <div className="confirm-actions">
            <button className="confirm-button light" type="button" onClick={() => setShowModals(prev => ({ ...prev, confirm: false }))}>수정하기</button>
            <button className="confirm-button primary" type="button" onClick={submitPlan}>이대로 생성하기</button>
          </div>
        </section>
      </div>

      {/* COLLAB CONFIRM MODAL */}
      <div
        className={`confirm-modal ${showModals.collabConfirm ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="collabConfirmTitle"
        onClick={(e) => { if (e.target === e.currentTarget) setShowModals(prev => ({ ...prev, collabConfirm: false })) }}
      >
        <section className="confirm-dialog collab-dialog">
          <div className="confirm-head">
            <h3 id="collabConfirmTitle">다른 사람과 동시에 작업할까요?</h3>
            <p>함께 작업을 선택하면 공유 URL을 만들 수 있습니다.</p>
          </div>
          <div className="collab-confirm-body">
            <div
              className={`collab-mode-card ${collabMode === 'solo' ? 'active' : ''}`}
              onClick={() => setCollabMode('solo')}
            >
              <strong>혼자 이어가기</strong>
              <span>현재 입력폼에서 계속 여행 조건을 작성합니다.</span>
            </div>
            <div
              className={`collab-mode-card ${collabMode === 'together' ? 'active' : ''}`}
              onClick={() => setCollabMode('together')}
            >
              <strong>함께 작업하기</strong>
              <span>URL을 공유하고 협업 화면에서 같이 작성합니다.</span>
            </div>
          </div>
          <div className="collab-member-body">
            <label htmlFor="collabMemberCount">동시작업 인원</label>
            <div className="collab-member-row">
              <button className="confirm-button light" type="button" onClick={() => setCollabMemberCount(prev => Math.max(2, prev - 1))}>-</button>
              <input
                id="collabMemberCount"
                type="number"
                min="2"
                max="20"
                value={collabMemberCount}
                onChange={(e) => setCollabMemberCount(Math.min(20, Math.max(2, parseInt(e.target.value, 10) || 2)))}
              />
              <button className="confirm-button light" type="button" onClick={() => setCollabMemberCount(prev => Math.min(20, prev + 1))}>+</button>
            </div>
            <p>방장을 포함해 함께 입력할 사람 수를 정해주세요.</p>
          </div>
          <div className="confirm-actions">
            <button className="confirm-button light" type="button" onClick={() => setShowModals(prev => ({ ...prev, collabConfirm: false }))}>취소</button>
            <button
              className="confirm-button primary"
              type="button"
              onClick={() => {
                if (collabMode === 'together') openCollabShare()
                else setShowModals(prev => ({ ...prev, collabConfirm: false }))
              }}
            >
              {collabMode === 'together' ? '함께 작업하기' : '혼자 이어가기'}
            </button>
          </div>
        </section>
      </div>

      {/* COLLAB SHARE MODAL */}
      <div
        className={`confirm-modal ${showModals.collabShare ? 'show' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="collabShareTitle"
        onClick={(e) => { if (e.target === e.currentTarget) setShowModals(prev => ({ ...prev, collabShare: false })) }}
      >
        <section className="confirm-dialog collab-dialog">
          <div className="confirm-head">
            <h3 id="collabShareTitle">동시작업 URL이 생성되었습니다</h3>
            <p>방장이 이 URL을 복사해 함께 작업할 사람들에게 공유하면 됩니다.</p>
          </div>
          <div className="collab-share-body">
            <label htmlFor="collabRoomUrl">공유 URL</label>
            <div className="collab-url-row">
              <input id="collabRoomUrl" type="text" readOnly value={collabRoomUrl} />
              <button className="confirm-button light" type="button" onClick={copyCollabUrl}>URL 복사</button>
            </div>
            <p className="collab-copy-state">{collabCopyState}</p>
          </div>
          <div className="confirm-actions">
            <button className="confirm-button light" type="button" onClick={() => setShowModals(prev => ({ ...prev, collabConfirm: true, collabShare: false }))}>이전</button>
            <button className="confirm-button primary" type="button" onClick={() => { window.location.href = collabRoomUrl }}>작업창 생성</button>
          </div>
        </section>
      </div>

      {/* CALENDAR PICKERS */}
      {openCalendar === 'startDate' && (
        <CalendarPicker
          value={dates.startDate}
          minDate={tomorrow}
          onChange={value => applyDate('startDate', value)}
          onClose={() => setOpenCalendar(null)}
        />
      )}
      {openCalendar === 'endDate' && (
        <CalendarPicker
          value={dates.endDate}
          minDate={dates.startDate || tomorrow}
          rangeStart={dates.startDate}
          onChange={value => applyDate('endDate', value)}
          onClose={() => setOpenCalendar(null)}
        />
      )}
    </div>
  )
}
