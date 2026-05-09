export default function AiGenerationLoadingView() {
  return (
    <>
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
                <div className="eyebrow" id="currentPhase">목적지 해석 중</div>
                <h1>입력한 조건으로<br />여행 일정을 다듬고 있어요.</h1>
                <div className="message-wrap" aria-live="polite">
                  <p className="loading-message" id="loadingMessage"></p>
                </div>
              </div>
      
              <section className="runway" aria-label="생성 진행률">
                <div className="progress-top">
                  <p className="progress-label">Flight plan generation</p>
                  <span className="progress-number" id="progressNumber">0%</span>
                </div>
                <div className="track">
                  <div className="track-fill" id="trackFill"></div>
                  <div className="plane" id="planeIcon" aria-hidden="true"><span>✈</span></div>
                </div>
                <div className="stage-row" id="stageRow"></div>
              </section>
            </section>
      
            <aside className="detail-panel">
              <section className="trip-photo">
                <p>YOUR NEXT TRIP</p>
                <h2 id="tripTitle">도쿄 여행</h2>
              </section>
      
              <dl className="fact-list" id="factList"></dl>
      
              <section className="insight-box">
                <p id="insightText">날짜, 여행지, 예산, 취향이 구체적일수록 이동 시간이 줄고 만족도가 높은 일정이 만들어집니다.</p>
              </section>
      
              <div className="ticker" aria-hidden="true">
                <div className="ticker-track" id="tickerA"></div>
                <div className="ticker-track" id="tickerB"></div>
              </div>
            </aside>
          </section>
        </main>
    </>
  )
}
