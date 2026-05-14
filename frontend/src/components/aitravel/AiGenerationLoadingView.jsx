import { DEFAULT_TRIP, LOADING_MESSAGES, LOADING_PHASES, STAGE_LABELS } from '../../data/AiGenerationLoading'
import { parseBudgetWon } from '../../utils/AiTravelDuration'

function formatBudgetWon(won) {
  if (!won || won <= 0) return null
  if (won >= 100000000) {
    const eok = Math.floor(won / 100000000)
    const man = Math.round((won % 100000000) / 10000)
    return man > 0 ? `${eok}억 ${man}만원` : `${eok}억원`
  }
  return `${Math.round(won / 10000)}만원`
}

function budgetDisplay(trip) {
  const raw = trip.budget || trip.budgetText || ''
  if (!raw) return '선택 안 함'
  if (!trip.isCollab) return raw
  const total = parseBudgetWon(raw)
  const formatted = formatBudgetWon(total)
  return formatted ? `합산 ${formatted}` : raw
}

function dateText(value) {
  if (!value) return ''
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(new Date(value))
}

function travelerText(trip) {
  const parts = [`성인 ${trip.adults || 1}명`]
  if (trip.teens) parts.push(`청소년 ${trip.teens}명`)
  if (trip.children) parts.push(`어린이 ${trip.children}명`)
  if (trip.infants) parts.push(`유아 ${trip.infants}명`)
  return parts.join(' · ')
}

function listText(items) {
  return items && items.length ? items.join(', ') : '선택 안 함'
}

function placesFromTrip(trip) {
  if (Array.isArray(trip.places)) return trip.places
  if (trip.mustVisit) {
    return String(trip.mustVisit)
      .split(',')
      .map(place => place.trim())
      .filter(Boolean)
  }
  return []
}

function buildFacts(trip) {
  const days = Number(trip.nights || 0) + 1
  const places = placesFromTrip(trip)
  return [
    ['여행 기간', `${dateText(trip.startDate)} ~ ${dateText(trip.endDate)} · ${trip.nights || 0}박 ${days}일`],
    ['인원', travelerText(trip)],
    ['예산', budgetDisplay(trip)],
    [trip.isCollab ? '평균 여행 강도' : '여행 강도', trip.intensity || '선택 안 함'],
    ['고정 장소', listText(places)],
    ['스타일', listText((trip.styles || []).map(style => `#${style}`))],
  ]
}

function buildChips(trip) {
  const days = Number(trip.nights || 0) + 1
  const places = placesFromTrip(trip)
  return [
    trip.destination,
    `${trip.nights || 0}박 ${days}일`,
    travelerText(trip),
    ...places,
    ...(trip.styles || []).map(style => `#${style}`),
  ].filter(Boolean)
}

const AUSTRALIA_HERO_IMAGE = 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1200&q=90'
const AUSTRALIA_DESTINATIONS = ['호주', '오스트레일리아', 'australia', '시드니', 'sydney', '멜버른', 'melbourne']

function tripPhotoStyle(destination) {
  const value = String(destination || '').toLowerCase()
  const isAustralia = AUSTRALIA_DESTINATIONS.some(name => value.includes(name))
  if (!isAustralia) return undefined

  return {
    backgroundImage: `linear-gradient(180deg, rgba(7, 17, 31, 0.02), rgba(7, 17, 31, 0.74)), url("${AUSTRALIA_HERO_IMAGE}")`,
    backgroundPosition: 'center 52%',
  }
}

export default function AiGenerationLoadingView({
  trip = DEFAULT_TRIP,
  progress = 0,
  messageIndex = 0,
  serverMessage = '',
  isFinishing = false,
  error = '',
  onRetry,
  onBack,
}) {
  const bounded = Math.min(100, Math.max(0, progress))
  const activePhase = isFinishing
    ? LOADING_PHASES[LOADING_PHASES.length - 1]
    : LOADING_PHASES[Math.min(LOADING_PHASES.length - 1, Math.floor(bounded / 22))]
  const activeStage = Math.min(STAGE_LABELS.length - 1, Math.floor(bounded / 25))
  const facts = buildFacts(trip)
  const chips = buildChips(trip)
  const loadingMessage = serverMessage || LOADING_MESSAGES[messageIndex % LOADING_MESSAGES.length]
  const hasError = Boolean(error)

  return (
    <div className="ai-generation-loading-page">
      <main className="loading-page">
          <div className="cloud one"></div>
          <div className="cloud two"></div>
      
          <section className="layout" aria-label="AI 일정 생성 로딩 화면">
            <section className="hero-panel">
              <div className="topline">
                <div className="brand">
                  <span className="brand-mark">✈</span>
                  <span>폰가이즈</span>
                </div>
                <div className="live-badge">
                  <span className="pulse-dot"></span>
                  <span>AI가 여행 동선을 설계 중</span>
                </div>
              </div>
      
              <div className="main-copy">
                <div className="eyebrow">{activePhase}</div>
                <h1>{trip.isCollab ? '함께 입력한 취향으로' : '입력한 조건으로'}<br />여행 일정을 다듬고 있어요.</h1>
                <div className="message-wrap" aria-live="polite">
                  {hasError ? (
                    <p className="loading-message">
                      일정 생성에 실패했어요.
                    </p>
                  ) : (
                    <p
                      key={messageIndex}
                      className="loading-message"
                      dangerouslySetInnerHTML={{ __html: loadingMessage }}
                    />
                  )}
                </div>
                {hasError && (
                  <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={onBack}
                      style={{ border: 0, borderRadius: 999, padding: '12px 18px', fontWeight: 800, cursor: 'pointer' }}
                    >
                      조건 수정하기
                    </button>
                    <button
                      type="button"
                      onClick={onRetry}
                      style={{ border: '1px solid rgba(255,255,255,.35)', borderRadius: 999, padding: '12px 18px', fontWeight: 800, cursor: 'pointer', color: '#fff', background: 'rgba(255,255,255,.12)' }}
                    >
                      다시 시도
                    </button>
                  </div>
                )}
              </div>
      
              <section className="runway" aria-label="생성 진행률">
                <div className="progress-top">
                  <p className="progress-label">Flight plan generation</p>
                  <span className="progress-number">{Math.round(bounded)}%</span>
                </div>
                <div className="track">
                  <div className="track-fill" style={{ width: `${bounded}%` }}></div>
                  <div className="plane" style={{ left: `${bounded}%` }} aria-hidden="true"><span>✈</span></div>
                </div>
                <div className="stage-row">
                  {STAGE_LABELS.map((label, index) => (
                    <div key={label} className={`stage-chip ${index <= activeStage ? 'active' : ''}`}>
                      <span className="stage-dot"></span>
                      <span>{label}</span>
                    </div>
                  ))}
                </div>
              </section>
            </section>
      
            <aside className="detail-panel">
              <section className="trip-photo" style={tripPhotoStyle(trip.destination || DEFAULT_TRIP.destination)}>
                <p>YOUR NEXT TRIP</p>
                <h2>{trip.destination || DEFAULT_TRIP.destination} 여행</h2>
              </section>
      
              <dl className="fact-list">
                {facts.map(([label, value]) => (
                  <div className="fact" key={label}>
                    <dt>{label}</dt>
                    <dd>{value}</dd>
                  </div>
                ))}
              </dl>
      
              <section className="insight-box">
                <p>날짜, 여행지, 예산, 취향이 구체적일수록 이동 시간이 줄고 만족도가 높은 일정이 만들어집니다.</p>
              </section>
      
              <div className="ticker" aria-hidden="true">
                {[0, 1].map(index => (
                  <div className="ticker-track" key={index}>
                    {chips.map(chip => <span className="mini-chip" key={`${index}-${chip}`}>{chip}</span>)}
                  </div>
                ))}
              </div>
            </aside>
          </section>
        </main>
    </div>
  )
}
