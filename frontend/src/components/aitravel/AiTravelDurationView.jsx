export default function AiTravelDurationView() {
  return (
    <div className="ai-travel-duration-page">
      {/* TOPBAR */}
      <header className="topbar">
        <div className="topbar-in">
          <a className="brand" href="#"><span className="brand-icon">📱</span>폰가이즈</a>
          <div className="topbar-trip">
            <strong>스페인 한달</strong><span className="sep">›</span>
            <span id="topbarRoute">바르셀로나 → 마드리드 → 세비야 외 7개 도시</span><span className="sep">·</span>
            <span className="live-pill"><span className="live-dot"></span>Day 04 라이브</span>
          </div>
          <div className="topbar-actions">
            <button className="t-btn translate" data-modal="translate">↔ 번역</button>
            <button className="t-btn map-btn" data-scroll="mapPanel">⌖ 지도</button>
            <button className="t-btn ghost" data-modal="emergency">🚨</button>
          </div>
        </div>
      </header>
      
      {/* HERO */}
      <section className="dest-hero">
        <div className="dest-hero-inner">
          <div className="dest-left">
            <div className="dest-city" id="heroCity">Barcelona</div>
            <div className="dest-meta">
              <span className="dest-tag" id="heroTag1"><span className="live-dot"></span> Day 04 진행 중 · Praktik Garden 기준</span>
              <span className="dest-tag" id="heroTag2">☀ 오전 맑음 · 🌦 오후 3시 이후 비 예보</span>
            </div>
          </div>
          <div className="dest-right">
            <div className="budget-badge">
              <div className="budget-label">예산 소진율</div>
              <div className="budget-bar"><div className="budget-bar-fill" id="heroGaugeFill" style={{"width": "38%"}}></div></div>
              <div className="budget-nums">
                <span className="budget-spent" id="heroSpent">₩849,660</span>
                <span className="budget-total">/ ₩4,704,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* WORKSPACE */}
      <div className="workspace">
      
        {/* LEFT RAIL: 구간 accordion + 도구 */}
        <aside className="left-rail">
          <div className="c-card">
            <div className="c-card-title">구간</div>
            <div className="city-list" id="cityAccordion"></div>
          </div>
          <div className="c-card">
            <div className="c-card-title">도구</div>
            <div className="tool-pad">
              <button className="tool-pad-btn" data-modal="budget"><span>◫</span>예산</button>
              <button className="tool-pad-btn" data-modal="fatigue"><span>◇</span>피로도</button>
              <button className="tool-pad-btn" data-modal="nearby"><span>＋</span>편의시설</button>
              <button className="tool-pad-btn" data-modal="safety"><span>🛡</span>야간안전</button>
              <button className="tool-pad-btn" data-modal="album"><span>▧</span>앨범</button>
              <button className="tool-pad-btn" data-modal="hotel"><span>🏨</span>숙소</button>
            </div>
          </div>
        </aside>
      
        {/* FEED */}
        <section className="feed">
      
          {/* Timeline */}
          <div className="sec" id="tlSection">
            <div className="sec-head">
              <div>
                <div className="sec-kicker" id="tlKicker">Day 04 · Live Itinerary</div>
                <h2 id="tlTitle">바르셀로나 도보 미식 루트</h2>
                <p className="sec-desc" id="tlDesc">숙소 출발·복귀 기준. 식당·날씨·안전 이슈는 기존 루트 반경 내에서만 대체.</p>
              </div>
              <button className="sec-action-btn" data-action="restore">기존 복귀</button>
            </div>
            <div className="sec-body">
              <div className="tl" id="tl"></div>
            </div>
          </div>
      
          {/* Budget */}
          <div className="sec" id="budgetSec">
            <div className="sec-head">
              <div>
                <div className="sec-kicker">Live Budget</div>
                <h2>지출 초과 → 식당만 재조회</h2>
                <p className="sec-desc">관광 루트 유지. 현 위치 반경 내에서 예산 맞는 식당 후보만 다시 찾습니다.</p>
              </div>
              <button className="sec-action-btn primary" data-action="focusBudget">지출 입력</button>
            </div>
            <div className="sec-body">
              <div className="budget-cols">
                <div className="b-block">
                  <div className="b-block-title">카테고리 예산</div>
                  <div className="b-row"><span className="b-icon">🍽</span><span className="b-name">식사</span><div className="b-bar"><div className="b-fill" style={{"width": "82%", "background": "var(--amber)"}}></div></div><span className="b-val">₩361,620/₩441,000</span></div>
                  <div className="b-row"><span className="b-icon">🚇</span><span className="b-name">교통</span><div className="b-bar"><div className="b-fill" style={{"width": "44%", "background": "var(--blue)"}}></div></div><span className="b-val">₩129,360/₩294,000</span></div>
                  <div className="b-row"><span className="b-icon">🏛</span><span className="b-name">입장비</span><div className="b-bar"><div className="b-fill" style={{"width": "56%", "background": "var(--green)"}}></div></div><span className="b-val">₩246,960/₩441,000</span></div>
                  <div className="b-row"><span className="b-icon">🛍</span><span className="b-name">쇼핑</span><div className="b-bar"><div className="b-fill" style={{"width": "38%", "background": "var(--purple)"}}></div></div><span className="b-val">₩111,720/₩294,000</span></div>
                </div>
                <div className="b-block">
                  <div className="b-block-title">실시간 지출 입력</div>
                  <div className="exp-form">
                    <input className="exp-input" id="expName" placeholder="예: El Nacional 점심" aria-label="지출 내역" />
                    <input className="exp-num" id="expAmt" placeholder="금액(EUR)" aria-label="지출 금액 현지 통화" type="number" inputMode="decimal" />
                    <select className="exp-cat-sel" id="expCat" aria-label="지출 카테고리">
                      <option value="meal">식사</option>
                      <option value="transport">교통</option>
                      <option value="entry">입장비</option>
                      <option value="shop">쇼핑</option>
                    </select>
                    <button className="exp-add" id="addExp">+</button>
                  </div>
                  <div className="exp-log" id="expLog">
                    <div className="exp-log-item"><div className="exp-log-left"><span className="exp-cat-dot" style={{"background": "var(--amber)"}}></span><span className="exp-log-name">아침 카페</span></div><span className="exp-log-amt">₩17,640</span></div>
                    <div className="exp-log-item"><div className="exp-log-left"><span className="exp-cat-dot" style={{"background": "var(--blue)"}}></span><span className="exp-log-name">지하철 L5</span></div><span className="exp-log-amt">₩3,528</span></div>
                  </div>
                  <div className="meal-reroute-panel" id="mealReroute">
                    <strong>예산 초과 — 식당 대체 후보</strong>
                    <p>현재 루트 480m 이내, 평균 ₩26,460-₩32,340 식당으로만 재조회합니다. 관광 순서는 유지됩니다.</p>
                    <div style={{"display": "flex", "gap": "5px"}}>
                      <button className="rd-yes" data-action="applyMeal">대체 적용</button>
                      <button className="rd-no" data-action="restore">기존 유지</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      
        </section>
      
        {/* RIGHT COL */}
        <aside className="right-col">
          <div className="map-wrap" id="mapPanel">
            <div className="map-hd">
              <span className="map-hd-title">라이브 지도</span>
              <div className="map-hd-actions">
                <button className="map-icon-btn" data-action="openMapModal" aria-label="지도 확대">⛶</button>
                <button className="map-hd-btn">경로 안내</button>
              </div>
            </div>
            <div className="map-frame" id="liveMap">
              <div className="map-fallback">Google Maps API 키 연결 시<br />숙소·관광지·식당·야간 안전 경로 표시</div>
            </div>
            <div className="map-route-card" id="routeCard">
              <strong id="routeTitle">선택한 이동 구간</strong>
              <span id="routeDesc">이동수단을 선택하면 실제 시간·거리가 표시됩니다.</span>
            </div>
            <div className="map-btns">
              <button className="map-btn primary" data-action="safeRoute">🛡 안전 우회</button>
              <button className="map-btn sec" data-action="restore">원래 루트</button>
            </div>
          </div>
      
          <div className="wx-card">
            <div className="wx-bg">
              <span className="wx-icon-big" id="wxIcon">🌦</span>
              <div>
                <div className="wx-num" id="wxTemp">24°</div>
                <div className="wx-cond" id="wxCond">오전 맑음 · 오후 3시 비</div>
              </div>
            </div>
            <div className="wx-outfit">
              <strong>오늘 옷차림</strong>
              <span id="wxOutfit">얇은 방수 재킷 + 접이식 우산. 미끄럽지 않은 밑창 신발.</span>
            </div>
            <div className="wx-btns">
              <button className="map-btn primary" style={{"flex": "1"}} data-action="wxReroute">실내 재경로</button>
              <button className="map-btn sec" style={{"flex": "1"}} data-action="restore">원래 루트</button>
            </div>
          </div>
      
          <div className="fatigue-card">
            <div className="fc-title">피로도 관리</div>
            <div className="fc-body">
              <div className="fc-ring-wrap">
                <svg width="64" height="64" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="24" fill="none" stroke="var(--border)" strokeWidth="7"/>
                  <circle id="fcRing" cx="32" cy="32" r="24" fill="none" stroke="var(--green)"
                    strokeWidth="7" strokeDasharray="150.8" strokeDashoffset="60" strokeLinecap="round"/>
                </svg>
                <div className="fc-ring-center">
                  <span className="fc-ring-num" id="fcNum">6</span>
                  <span className="fc-ring-denom">/10</span>
                </div>
              </div>
              <div className="fc-right">
                <div className="fc-label" id="fcLabel">카페 휴식 추천</div>
                <input type="range" className="fc-slider" id="fcSlider" min="1" max="10" defaultValue="6" />
                <div className="fc-hint">높을수록 도보를 줄이고 카페·택시 비중을 늘립니다.</div>
              </div>
            </div>
            <button className="fc-btn" data-action="fatigueReroute">휴식 루트 보기</button>
          </div>
        </aside>
      </div>
      
      {/* TOAST */}
      <div className="toast" id="toast">
        <span className="toast-icon" id="toastIcon"></span>
        <div className="toast-body">
          <div className="toast-title" id="toastTitle"></div>
          <div className="toast-msg" id="toastMsg"></div>
        </div>
        <div className="toast-actions" id="toastActions"></div>
        <button className="ta-close" id="toastClose">×</button>
      </div>
      
      {/* OVERLAY MODAL */}
      <div className="overlay" id="overlay">
        <div className="modal-box">
          <div className="modal-title" id="modalTitle"></div>
          <div id="modalContent"></div>
          <div className="modal-footer">
            <button className="mf ghost" id="mClose">닫기</button>
            <button className="mf primary" id="mConfirm">확인</button>
          </div>
        </div>
      </div>
      
      <div className="overlay" id="mapOverlay">
        <div className="map-modal-box">
          <div className="map-modal-head">
            <div className="map-modal-title">라이브 지도</div>
            <button className="map-modal-close" id="mapModalClose" aria-label="지도 닫기">×</button>
          </div>
          <div className="map-modal-frame" id="modalMap"></div>
        </div>
      </div>
    </div>
  )
}
