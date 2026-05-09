import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const pageStyle = "\n    :root {\n      --ink: #0f172a;\n      --muted: #607086;\n      --paper: #ffffff;\n      --line: rgba(226, 232, 240, 0.72);\n      --brand: #0f6bff;\n      --teal: #00a676;\n      --amber: #ffb020;\n      --coral: #ff6b5f;\n      --night: #07111f;\n      --radius: 8px;\n      --shadow: 0 24px 80px rgba(4, 13, 27, 0.26);\n    }\n\n    * {\n      box-sizing: border-box;\n    }\n\n    html {\n      min-height: 100%;\n      background: var(--night);\n    }\n\n    body {\n      margin: 0;\n      min-height: 100vh;\n      overflow-x: hidden;\n      color: var(--ink);\n      font-family: \"Inter\", \"Noto Sans KR\", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;\n      background: var(--night);\n    }\n\n    button {\n      font: inherit;\n    }\n\n    .loading-page {\n      position: relative;\n      min-height: 100vh;\n      display: grid;\n      place-items: center;\n      padding: 34px;\n      overflow: hidden;\n      isolation: isolate;\n      background:\n        linear-gradient(120deg, rgba(7, 17, 31, 0.94), rgba(9, 28, 51, 0.54) 42%, rgba(7, 17, 31, 0.88)),\n        url(\"https://images.unsplash.com/photo-1436491865332-7a61a109cc05?auto=format&fit=crop&w=2200&q=88\") center/cover;\n    }\n\n    .loading-page::before {\n      content: \"\";\n      position: absolute;\n      inset: -20%;\n      z-index: -2;\n      opacity: 0.52;\n      background:\n        radial-gradient(circle at 18% 24%, rgba(15, 107, 255, 0.34), transparent 30%),\n        radial-gradient(circle at 86% 18%, rgba(255, 176, 32, 0.28), transparent 28%),\n        radial-gradient(circle at 70% 82%, rgba(0, 166, 118, 0.24), transparent 32%);\n      animation: atmosphere 14s ease-in-out infinite alternate;\n    }\n\n    .loading-page::after {\n      content: \"\";\n      position: absolute;\n      inset: 0;\n      z-index: -1;\n      background:\n        linear-gradient(rgba(255, 255, 255, 0.035) 1px, transparent 1px),\n        linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px);\n      background-size: 52px 52px;\n      mask-image: linear-gradient(to bottom, transparent, #000 20%, #000 82%, transparent);\n    }\n\n    @keyframes atmosphere {\n      from {\n        transform: translate3d(-2%, -1%, 0) scale(1);\n      }\n\n      to {\n        transform: translate3d(2%, 1%, 0) scale(1.04);\n      }\n    }\n\n    .cloud {\n      position: absolute;\n      z-index: 0;\n      width: 280px;\n      height: 74px;\n      border-radius: 999px;\n      opacity: 0.24;\n      filter: blur(1px);\n      background: rgba(255, 255, 255, 0.72);\n      animation: cloudDrift 28s linear infinite;\n    }\n\n    .cloud::before,\n    .cloud::after {\n      content: \"\";\n      position: absolute;\n      border-radius: 50%;\n      background: inherit;\n    }\n\n    .cloud::before {\n      width: 112px;\n      height: 112px;\n      left: 42px;\n      bottom: 16px;\n    }\n\n    .cloud::after {\n      width: 86px;\n      height: 86px;\n      right: 46px;\n      bottom: 28px;\n    }\n\n    .cloud.one {\n      top: 12%;\n      left: -310px;\n    }\n\n    .cloud.two {\n      top: 68%;\n      left: -340px;\n      width: 340px;\n      opacity: 0.16;\n      animation-duration: 36s;\n      animation-delay: -13s;\n    }\n\n    @keyframes cloudDrift {\n      to {\n        transform: translateX(calc(100vw + 680px));\n      }\n    }\n\n    .layout {\n      position: relative;\n      z-index: 2;\n      width: min(100%, 1180px);\n      display: grid;\n      grid-template-columns: minmax(0, 1.05fr) minmax(330px, 0.58fr);\n      gap: 18px;\n      align-items: stretch;\n    }\n\n    .hero-panel,\n    .detail-panel {\n      border: 1px solid rgba(255, 255, 255, 0.24);\n      border-radius: var(--radius);\n      background: rgba(255, 255, 255, 0.82);\n      box-shadow: var(--shadow);\n      backdrop-filter: blur(22px);\n    }\n\n    .hero-panel {\n      min-height: 640px;\n      display: grid;\n      grid-template-rows: auto 1fr auto;\n      padding: 28px;\n      overflow: hidden;\n    }\n\n    .topline {\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 18px;\n    }\n\n    .brand {\n      display: inline-flex;\n      align-items: center;\n      gap: 10px;\n      color: var(--night);\n      font-weight: 950;\n      letter-spacing: 0;\n    }\n\n    .brand-mark {\n      width: 38px;\n      height: 38px;\n      display: grid;\n      place-items: center;\n      border-radius: var(--radius);\n      color: #fff;\n      background: var(--night);\n      box-shadow: 0 12px 24px rgba(7, 17, 31, 0.18);\n    }\n\n    .live-badge {\n      display: inline-flex;\n      align-items: center;\n      gap: 8px;\n      min-height: 34px;\n      padding: 7px 11px;\n      border-radius: 999px;\n      color: #07543f;\n      background: #e8f8f1;\n      border: 1px solid #bfe9d7;\n      font-size: 12px;\n      font-weight: 900;\n      white-space: nowrap;\n    }\n\n    .pulse-dot {\n      width: 8px;\n      height: 8px;\n      border-radius: 999px;\n      background: var(--teal);\n      box-shadow: 0 0 0 0 rgba(0, 166, 118, 0.45);\n      animation: pulse 1.55s ease-out infinite;\n    }\n\n    @keyframes pulse {\n      to {\n        box-shadow: 0 0 0 12px rgba(0, 166, 118, 0);\n      }\n    }\n\n    .main-copy {\n      display: grid;\n      align-content: center;\n      padding: 36px 0 30px;\n    }\n\n    .eyebrow {\n      width: fit-content;\n      margin-bottom: 18px;\n      padding: 8px 11px;\n      border-radius: 999px;\n      color: #07543f;\n      background: rgba(232, 248, 241, 0.86);\n      border: 1px solid #bfe9d7;\n      font-size: 12px;\n      font-weight: 950;\n    }\n\n    h1 {\n      max-width: 620px;\n      margin: 0;\n      color: var(--night);\n      font-size: clamp(34px, 4.2vw, 58px);\n      line-height: 1.12;\n      letter-spacing: 0;\n      font-weight: 900;\n      word-break: keep-all;\n    }\n\n    .message-wrap {\n      min-height: 86px;\n      max-width: 620px;\n      margin-top: 20px;\n    }\n\n    .loading-message {\n      margin: 0;\n      color: #26364c;\n      font-size: clamp(15px, 1.45vw, 18px);\n      line-height: 1.7;\n      font-weight: 750;\n      word-break: keep-all;\n      animation: messageIn 0.42s ease both;\n    }\n\n    .loading-message strong {\n      color: var(--brand);\n      font-weight: 950;\n    }\n\n    @keyframes messageIn {\n      from {\n        opacity: 0;\n        transform: translateY(10px);\n      }\n\n      to {\n        opacity: 1;\n        transform: translateY(0);\n      }\n    }\n\n    .runway {\n      position: relative;\n      display: grid;\n      gap: 14px;\n      padding: 20px;\n      border-radius: var(--radius);\n      color: #fff;\n      background:\n        linear-gradient(135deg, rgba(7, 17, 31, 0.95), rgba(11, 35, 63, 0.9)),\n        linear-gradient(90deg, transparent 0 48%, rgba(255, 255, 255, 0.12) 48% 52%, transparent 52% 100%);\n      overflow: hidden;\n    }\n\n    .runway::before {\n      content: \"\";\n      position: absolute;\n      inset: 0;\n      opacity: 0.28;\n      background:\n        repeating-linear-gradient(90deg, transparent 0 42px, rgba(255, 255, 255, 0.4) 42px 64px, transparent 64px 106px);\n      animation: runwayMove 1.8s linear infinite;\n    }\n\n    @keyframes runwayMove {\n      from {\n        transform: translateX(0);\n      }\n\n      to {\n        transform: translateX(-106px);\n      }\n    }\n\n    .progress-top {\n      position: relative;\n      z-index: 1;\n      display: flex;\n      align-items: center;\n      justify-content: space-between;\n      gap: 14px;\n    }\n\n    .progress-label {\n      margin: 0;\n      color: rgba(255, 255, 255, 0.74);\n      font-size: 12px;\n      font-weight: 900;\n      text-transform: uppercase;\n    }\n\n    .progress-number {\n      color: #fff;\n      font-size: 13px;\n      font-weight: 950;\n    }\n\n    .track {\n      position: relative;\n      z-index: 1;\n      height: 22px;\n      border-radius: 999px;\n      background: rgba(255, 255, 255, 0.14);\n      border: 1px solid rgba(255, 255, 255, 0.18);\n      overflow: visible;\n    }\n\n    .track-fill {\n      width: 0%;\n      height: 100%;\n      border-radius: inherit;\n      background: linear-gradient(90deg, var(--brand), var(--teal), var(--amber), var(--coral));\n      box-shadow: 0 0 30px rgba(15, 107, 255, 0.38);\n      transition: width 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);\n    }\n\n    .plane {\n      position: absolute;\n      left: 0%;\n      top: 50%;\n      width: 46px;\n      height: 46px;\n      display: grid;\n      place-items: center;\n      border-radius: 999px;\n      color: var(--night);\n      background: #fff;\n      border: 1px solid rgba(255, 255, 255, 0.88);\n      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.28);\n      transform: translate(-18px, -50%);\n      transition: left 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);\n    }\n\n    .plane span {\n      display: block;\n      transform: rotate(45deg);\n      font-size: 21px;\n      line-height: 1;\n    }\n\n    .stage-row {\n      position: relative;\n      z-index: 1;\n      display: grid;\n      grid-template-columns: repeat(4, minmax(0, 1fr));\n      gap: 8px;\n    }\n\n    .stage-chip {\n      min-height: 44px;\n      display: flex;\n      align-items: center;\n      gap: 8px;\n      padding: 8px 10px;\n      border-radius: var(--radius);\n      color: rgba(255, 255, 255, 0.62);\n      background: rgba(255, 255, 255, 0.08);\n      border: 1px solid rgba(255, 255, 255, 0.1);\n      font-size: 12px;\n      line-height: 1.25;\n      font-weight: 850;\n      transition: background 0.2s ease, color 0.2s ease, transform 0.2s ease;\n    }\n\n    .stage-chip.active {\n      color: #fff;\n      background: rgba(255, 255, 255, 0.16);\n      transform: translateY(-1px);\n    }\n\n    .stage-dot {\n      width: 9px;\n      height: 9px;\n      flex: 0 0 auto;\n      border-radius: 999px;\n      background: currentColor;\n    }\n\n    .detail-panel {\n      display: grid;\n      grid-template-rows: auto 1fr auto;\n      gap: 18px;\n      padding: 22px;\n      color: var(--ink);\n    }\n\n    .trip-photo {\n      min-height: 178px;\n      display: flex;\n      flex-direction: column;\n      justify-content: flex-end;\n      padding: 18px;\n      border-radius: var(--radius);\n      color: #fff;\n      background:\n        linear-gradient(180deg, rgba(7, 17, 31, 0.08), rgba(7, 17, 31, 0.8)),\n        url(\"https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1000&q=86\") center/cover;\n      overflow: hidden;\n    }\n\n    .trip-photo p {\n      margin: 0 0 5px;\n      color: rgba(255, 255, 255, 0.74);\n      font-size: 12px;\n      font-weight: 900;\n    }\n\n    .trip-photo h2 {\n      margin: 0;\n      font-size: 30px;\n      line-height: 1.08;\n      letter-spacing: 0;\n      font-weight: 950;\n    }\n\n    .fact-list {\n      display: grid;\n      gap: 10px;\n      margin: 0;\n    }\n\n    .fact {\n      display: grid;\n      grid-template-columns: 86px 1fr;\n      gap: 10px;\n      padding: 12px;\n      border-radius: var(--radius);\n      background: rgba(246, 249, 252, 0.92);\n      border: 1px solid #e2e8f0;\n    }\n\n    .fact dt {\n      color: #738095;\n      font-size: 12px;\n      line-height: 1.45;\n      font-weight: 900;\n    }\n\n    .fact dd {\n      margin: 0;\n      color: var(--ink);\n      font-size: 13px;\n      line-height: 1.55;\n      font-weight: 850;\n      word-break: keep-all;\n    }\n\n    .insight-box {\n      padding: 14px;\n      border-radius: var(--radius);\n      color: #063b90;\n      background: #eaf3ff;\n      border: 1px solid #c9ddff;\n    }\n\n    .insight-box p {\n      margin: 0;\n      font-size: 12px;\n      line-height: 1.6;\n      font-weight: 800;\n      word-break: keep-all;\n    }\n\n    .ticker {\n      display: flex;\n      gap: 8px;\n      overflow: hidden;\n      mask-image: linear-gradient(90deg, transparent, #000 10%, #000 90%, transparent);\n    }\n\n    .ticker-track {\n      display: flex;\n      gap: 8px;\n      flex: 0 0 auto;\n      animation: ticker 18s linear infinite;\n    }\n\n    .mini-chip {\n      min-height: 30px;\n      display: inline-flex;\n      align-items: center;\n      padding: 6px 10px;\n      border-radius: 999px;\n      color: rgba(255, 255, 255, 0.86);\n      background: rgba(255, 255, 255, 0.14);\n      border: 1px solid rgba(255, 255, 255, 0.16);\n      font-size: 12px;\n      font-weight: 850;\n      white-space: nowrap;\n    }\n\n    @keyframes ticker {\n      to {\n        transform: translateX(calc(-100% - 8px));\n      }\n    }\n\n    @media (max-width: 980px) {\n      .loading-page {\n        padding: 18px;\n        place-items: start center;\n      }\n\n      .layout {\n        grid-template-columns: 1fr;\n      }\n\n      .hero-panel {\n        min-height: auto;\n      }\n\n      .detail-panel {\n        grid-template-rows: auto;\n      }\n    }\n\n    @media (max-width: 680px) {\n      .hero-panel,\n      .detail-panel {\n        padding: 18px;\n      }\n\n      .topline {\n        align-items: flex-start;\n        flex-direction: column;\n      }\n\n      .main-copy {\n        padding: 32px 0 26px;\n      }\n\n      h1 {\n        font-size: 34px;\n      }\n\n      .message-wrap {\n        min-height: 108px;\n      }\n\n      .stage-row {\n        grid-template-columns: repeat(2, minmax(0, 1fr));\n      }\n\n      .fact {\n        grid-template-columns: 1fr;\n        gap: 4px;\n      }\n    }\n\n    @media (max-width: 420px) {\n      .loading-page {\n        padding: 12px;\n      }\n\n      h1 {\n        font-size: 30px;\n      }\n\n      .runway {\n        padding: 16px;\n      }\n\n      .stage-row {\n        grid-template-columns: 1fr;\n      }\n    }\n\n    @media (prefers-reduced-motion: reduce) {\n      *,\n      *::before,\n      *::after {\n        animation-duration: 0.01ms !important;\n        animation-iteration-count: 1 !important;\n        scroll-behavior: auto !important;\n        transition-duration: 0.01ms !important;\n      }\n    }\n  "

export default function AiGenerationLoading() {
  const navigate = useNavigate()

  useEffect(() => {
    const DEFAULT_TRIP = {
          destination: "도쿄",
          startDate: "2026-06-12",
          endDate: "2026-06-15",
          nights: 3,
          adults: 2,
          teens: 0,
          children: 0,
          infants: 0,
          budget: "보통",
          intensity: "55/100",
          places: ["신주쿠", "아사쿠사", "도쿄타워"],
          styles: ["맛집탐방", "카페투어", "야경", "로컬감성"]
        };
    
        const phases = [
          "목적지 해석 중",
          "취향 분석 중",
          "동선 계산 중",
          "식사 시간 배치 중",
          "일정 완성 중"
        ];
    
        const messages = [
          "입력한 <strong>여행지와 날짜</strong>를 기준으로 현지 이동 거리와 방문 가능한 시간대를 계산하고 있어요.",
          "<strong>꼭 가고 싶은 장소</strong>가 많을수록 AI가 우선순위를 더 정확하게 잡을 수 있어요.",
          "예산과 여행 강도를 함께 보면 무리한 이동을 줄이고, 쉬는 시간을 자연스럽게 끼워 넣을 수 있어요.",
          "맛집, 카페, 야경처럼 <strong>스타일을 상세히 적을수록</strong> 일정의 분위기가 선명해져요.",
          "오전에는 이동 부담을 낮추고, 오후에는 몰입도 높은 코스를 배치하는 중이에요.",
          "비 오는 날에도 흔들리지 않도록 실내 대체 코스와 주변 명소를 함께 검토하고 있어요.",
          "식사 시간과 이동 시간이 겹치지 않도록 경로를 다시 다듬고 있어요.",
          "마지막으로 하루가 너무 빡빡해 보이지 않는지 전체 리듬을 점검하고 있어요."
        ];
    
        const stageLabels = ["조건 분석", "장소 선별", "동선 최적화", "일정 정리"];
        const $ = id => document.getElementById(id);
    
        function escapeHtml(value) {
          return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
        }
    
        function readTrip() {
          const params = new URLSearchParams(location.search);
          const fromStorage = sessionStorage.getItem("aiTripDraft");
          let stored = {};
    
          if (fromStorage) {
            try {
              stored = JSON.parse(fromStorage);
            } catch {
              stored = {};
            }
          }
    
          return {
            ...DEFAULT_TRIP,
            ...stored,
            destination: params.get("destination") || stored.destination || DEFAULT_TRIP.destination,
            nights: Number(params.get("nights") || stored.nights || DEFAULT_TRIP.nights)
          };
        }
    
        function dateText(value) {
          if (!value) return "";
          return new Intl.DateTimeFormat("ko-KR", {
            month: "long",
            day: "numeric",
            weekday: "short"
          }).format(new Date(value));
        }
    
        function travelerText(trip) {
          const parts = [`성인 ${trip.adults || 1}명`];
          if (trip.teens) parts.push(`청소년 ${trip.teens}명`);
          if (trip.children) parts.push(`어린이 ${trip.children}명`);
          if (trip.infants) parts.push(`유아 ${trip.infants}명`);
          return parts.join(" · ");
        }
    
        function listText(items) {
          return items && items.length ? items.join(", ") : "선택 안 함";
        }
    
        function renderTrip(trip) {
          const days = Number(trip.nights) + 1;
          $("tripTitle").textContent = `${trip.destination} 여행`;
          $("factList").innerHTML = [
            ["여행 기간", `${dateText(trip.startDate)} ~ ${dateText(trip.endDate)} · ${trip.nights}박 ${days}일`],
            ["인원", travelerText(trip)],
            ["예산", trip.budget || "선택 안 함"],
            ["여행 강도", trip.intensity || "선택 안 함"],
            ["고정 장소", listText(trip.places)],
            ["스타일", listText((trip.styles || []).map(style => `#${style}`))]
          ].map(([label, value]) => `
            <div class="fact">
              <dt>${escapeHtml(label)}</dt>
              <dd>${escapeHtml(value)}</dd>
            </div>
          `).join("");
    
          const chips = [
            `${trip.destination}`,
            `${trip.nights}박 ${days}일`,
            travelerText(trip),
            ...(trip.places || []),
            ...(trip.styles || []).map(style => `#${style}`)
          ];
          const markup = chips.map(chip => `<span class="mini-chip">${escapeHtml(chip)}</span>`).join("");
          $("tickerA").innerHTML = markup;
          $("tickerB").innerHTML = markup;
        }
    
        function renderStages(activeIndex) {
          $("stageRow").innerHTML = stageLabels.map((label, index) => `
            <div class="stage-chip ${index <= activeIndex ? "active" : ""}">
              <span class="stage-dot"></span>
              <span>${label}</span>
            </div>
          `).join("");
        }
    
        function updateProgress(value) {
          const bounded = Math.min(98, Math.max(0, value));
          $("trackFill").style.width = `${bounded}%`;
          $("planeIcon").style.left = `${bounded}%`;
          $("progressNumber").textContent = `${Math.round(bounded)}%`;
          $("currentPhase").textContent = phases[Math.min(phases.length - 1, Math.floor(bounded / 22))];
          renderStages(Math.min(stageLabels.length - 1, Math.floor(bounded / 25)));
        }
    
        function startLoading() {
          let progress = 6;
          let messageIndex = 0;
    
          $("loadingMessage").innerHTML = messages[0];
          updateProgress(progress);
    
          const messageTimer = setInterval(() => {
            messageIndex = (messageIndex + 1) % messages.length;
            const message = $("loadingMessage");
            message.style.animation = "none";
            message.offsetHeight;
            message.innerHTML = messages[messageIndex];
            message.style.animation = "";
          }, 4000);
    
          const progressTimer = setInterval(() => {
            const easing = progress < 72 ? 8 : progress < 90 ? 4 : 1.2;
            progress = progress >= 98 ? 18 : progress + easing + Math.random() * 4;
            updateProgress(progress);
          }, 950);

          return () => {
            clearInterval(messageTimer);
            clearInterval(progressTimer);
          };
        }
    
        const trip = readTrip();
        renderTrip(trip);
        const stopLoading = startLoading();
        const redirectTimer = setTimeout(() => {
          navigate('/ai-generation-schedule');
        }, 2000);

        return () => {
          stopLoading();
          clearTimeout(redirectTimer);
        };
  }, [navigate])

  return (
    <>
      <style>{pageStyle}</style>
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
