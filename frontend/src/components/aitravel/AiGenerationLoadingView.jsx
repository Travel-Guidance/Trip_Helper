import { DEFAULT_TRIP, LOADING_MESSAGES, LOADING_PHASES, STAGE_LABELS } from '../../data/AiGenerationLoading'

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
    ['예산', trip.budget || '선택 안 함'],
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

export default function AiGenerationLoadingView({
  trip = DEFAULT_TRIP,
  progress = 0,
  messageIndex = 0,
  isFinishing = false,
}) {
  const bounded = Math.min(100, Math.max(0, progress))
  const activePhase = isFinishing
    ? LOADING_PHASES[LOADING_PHASES.length - 1]
    : LOADING_PHASES[Math.min(LOADING_PHASES.length - 1, Math.floor(bounded / 22))]
  const activeStage = Math.min(STAGE_LABELS.length - 1, Math.floor(bounded / 25))
  const facts = buildFacts(trip)
  const chips = buildChips(trip)
  const loadingMessage = LOADING_MESSAGES[messageIndex % LOADING_MESSAGES.length]

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
                  <p
                    key={messageIndex}
                    className="loading-message"
                    dangerouslySetInnerHTML={{ __html: loadingMessage }}
                  />
                </div>
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
              <section className="trip-photo">
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
