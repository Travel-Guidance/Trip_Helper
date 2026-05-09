export default function AiGenerationScheduleView({ onTravelDurationClick }) {
  return (
    <div className="ai-generation-schedule-page">
      <div className="page">
          <header className="command">
            <div className="command-inner">
              <a className="brand" href="#"><span className="brand-icon">✈</span><span>폰가이즈</span></a>
              <div className="route-pill"><strong>후쿠오카</strong><span>3박 4일</span><span>맛집 · 산책 · 근교 여행</span></div>
              <div className="command-actions">
                <button className="action light" type="button">다시 만들기</button>
                <button className="action light" type="button" onClick={onTravelDurationClick}>일정중</button>
                <button className="action primary" type="button">일정 저장</button>
              </div>
            </div>
          </header>
      
          <section className="overview">
            <article className="hero-card">
              <div className="hero-top">
                <div className="status">AI 일정 생성 완료</div>
                <div className="score-card"><span>동선 완성도</span><strong>94</strong></div>
              </div>
              <div>
                <h1 className="hero-title">후쿠오카를<br />가볍게 걷고<br />맛있게 즐기는 4일</h1>
                <p className="hero-copy">하카타를 베이스캠프로 두고 시내, 야타이, 오호리 공원, 다자이후 근교를 과하게 섞지 않았습니다. 매일 하나의 중심축만 잡아 이동 피로를 낮춘 일정입니다.</p>
              </div>
            </article>
      
            <aside className="intel-card">
              <h2>여행 요약 리포트</h2>
              <div className="intel-grid">
                <div className="intel"><span>총 방문 포인트</span><strong>13곳</strong></div>
                <div className="intel"><span>하루 평균 이동</span><strong>42분</strong></div>
                <div className="intel"><span>맛집 반영</span><strong>5회</strong></div>
                <div className="intel"><span>실내 대체</span><strong>4곳</strong></div>
              </div>
              <ul className="strategy">
                <li><b>1</b><span>첫날은 공항 접근성과 피로도를 고려해 하카타 권역만 배치했습니다.</span></li>
                <li><b>2</b><span>둘째 날은 오호리 공원에서 텐진으로 이어지는 짧은 도보 중심 동선입니다.</span></li>
                <li><b>3</b><span>다자이후는 오전 출발로 붐비는 시간대를 피하고, 오후에는 하카타로 복귀합니다.</span></li>
              </ul>
            </aside>
          </section>
      
          <main className="workspace">
            <aside className="left-rail panel route-index">
              <h3>일정 바로가기</h3>
              <a className="day-button active" href="#day1" data-day-map="day1"><strong>01</strong><span><p>하카타 적응</p><span>공항 · 캐널시티 · 야타이</span></span><em>☁️</em></a>
              <a className="day-button" href="#day2" data-day-map="day2"><strong>02</strong><span><p>공원과 미식</p><span>오호리 · 텐진 · 모츠나베</span></span><em>☀️</em></a>
              <a className="day-button" href="#day3" data-day-map="day3"><strong>03</strong><span><p>다자이후 근교</p><span>텐만구 · 건축 카페</span></span><em>🌤</em></a>
              <a className="day-button" href="#day4" data-day-map="day4"><strong>04</strong><span><p>바다와 출국</p><span>모모치 · 공항</span></span><em>✈️</em></a>
              <div className="legend">
                <div className="legend-row"><span className="legend-dot"></span>명소/이동</div>
                <div className="legend-row"><span className="legend-dot meal"></span>식사</div>
                <div className="legend-row"><span className="legend-dot rest"></span>휴식</div>
              </div>
            </aside>
      
            <section className="feed" id="feed"></section>
      
            <aside className="panel map-shell">
              <h3 id="mapTitle">1일차 Google Maps 동선</h3>
              <div className="map" id="codexMap">
                <div className="map-fallback">Google Maps API key를 넣으면 전체 일정 마커와 폴리라인이 활성화됩니다.</div>
              </div>
              <ul className="map-focus" id="mapFocus"></ul>
            </aside>
          </main>
        </div>
    </div>
  )
}
