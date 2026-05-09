import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

const pageStyle = "\n    :root {\n      --ink: #111827;\n      --muted: #687385;\n      --line: #e5edf6;\n      --paper: #ffffff;\n      --soft: #f7fbff;\n      --navy: #102a56;\n      --blue: #0099ff;\n      --teal: #008f83;\n      --amber: #ffb020;\n      --pink: #e12bbb;\n      --red: #ef4444;\n      --radius: 14px;\n      --shadow: 0 18px 50px rgba(15, 107, 255, 0.12);\n    }\n\n    * { box-sizing: border-box; }\n\n    html { scroll-behavior: smooth; }\n\n    body {\n      margin: 0;\n      min-height: 100vh;\n      color: var(--ink);\n      background:\n        linear-gradient(180deg, #f7fbff 0%, #ffffff 46%, #f6f7fb 100%);\n      font-family: \"Inter\", \"Noto Sans KR\", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;\n    }\n\n    button { font: inherit; border: 0; cursor: pointer; }\n\n    .page {\n      min-height: 100vh;\n    }\n\n    .command {\n      position: sticky;\n      top: 0;\n      z-index: 50;\n      border-bottom: 1px solid rgba(229, 237, 246, 0.9);\n      background: rgba(255, 255, 255, 0.9);\n      backdrop-filter: blur(18px);\n    }\n\n    .command-inner {\n      max-width: 1440px;\n      min-height: 70px;\n      display: grid;\n      grid-template-columns: auto 1fr auto;\n      gap: 20px;\n      align-items: center;\n      margin: 0 auto;\n      padding: 0 26px;\n    }\n\n    .brand {\n      display: inline-flex;\n      align-items: center;\n      gap: 10px;\n      color: var(--ink);\n      text-decoration: none;\n      font-weight: 950;\n    }\n\n    .brand-icon {\n      width: 38px;\n      height: 38px;\n      display: grid;\n      place-items: center;\n      border-radius: var(--radius);\n      color: #fff;\n      background: linear-gradient(135deg, #0099ff, #1269ff);\n      box-shadow: 0 10px 22px rgba(0, 153, 255, 0.28);\n    }\n\n    .route-pill {\n      min-width: 0;\n      display: flex;\n      align-items: center;\n      gap: 8px;\n      justify-content: center;\n      color: #5b6678;\n      font-size: 13px;\n      font-weight: 850;\n    }\n\n    .route-pill strong {\n      color: var(--ink);\n      font-weight: 950;\n    }\n\n    .command-actions {\n      display: flex;\n      gap: 8px;\n    }\n\n    .action {\n      min-height: 38px;\n      display: inline-flex;\n      align-items: center;\n      gap: 7px;\n      padding: 0 13px;\n      border-radius: 999px;\n      font-size: 13px;\n      font-weight: 900;\n    }\n\n    .action.light {\n      color: #475569;\n      background: #fff;\n      border: 1px solid var(--line);\n    }\n\n    .action.primary {\n      color: #fff;\n      background: linear-gradient(135deg, #0099ff, #1269ff);\n      box-shadow: 0 10px 22px rgba(0, 153, 255, 0.22);\n    }\n\n    .overview {\n      max-width: 1440px;\n      display: grid;\n      grid-template-columns: minmax(0, 1fr) 420px;\n      gap: 18px;\n      margin: 0 auto;\n      padding: 28px 26px 18px;\n    }\n\n    .hero-card {\n      min-height: 390px;\n      display: grid;\n      grid-template-rows: 1fr auto;\n      padding: 28px;\n      border-radius: 28px;\n      color: #fff;\n      background:\n        linear-gradient(100deg, rgba(7, 17, 31, 0.74), rgba(7, 17, 31, 0.18) 54%, rgba(0, 143, 131, 0.42)),\n        url(\"https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1800&q=88\") center/cover;\n      box-shadow: var(--shadow);\n      overflow: hidden;\n    }\n\n    .hero-top {\n      display: flex;\n      align-items: flex-start;\n      justify-content: space-between;\n      gap: 20px;\n    }\n\n    .status {\n      width: fit-content;\n      display: inline-flex;\n      align-items: center;\n      gap: 8px;\n      padding: 8px 11px;\n      border-radius: 999px;\n      color: #075985;\n      background: rgba(240, 249, 255, 0.9);\n      border: 1px solid rgba(186, 230, 253, 0.8);\n      font-size: 12px;\n      font-weight: 900;\n      backdrop-filter: blur(10px);\n    }\n\n    .score-card {\n      min-width: 142px;\n      padding: 13px;\n      border-radius: 18px;\n      background: rgba(255, 255, 255, 0.9);\n      border: 1px solid rgba(255, 255, 255, 0.48);\n      backdrop-filter: blur(14px);\n    }\n\n    .score-card span {\n      color: #64748b;\n      font-size: 11px;\n      font-weight: 900;\n    }\n\n    .score-card strong {\n      display: block;\n      margin-top: 5px;\n      color: #0f172a;\n      font-size: 30px;\n      line-height: 1;\n      font-weight: 950;\n    }\n\n    .hero-title {\n      max-width: 780px;\n      margin: 0;\n      font-size: clamp(42px, 6vw, 84px);\n      line-height: 1.03;\n      letter-spacing: 0;\n      font-weight: 950;\n      word-break: keep-all;\n    }\n\n    .hero-copy {\n      max-width: 620px;\n      margin: 18px 0 0;\n      color: rgba(255, 255, 255, 0.86);\n      font-size: 15px;\n      line-height: 1.75;\n      font-weight: 650;\n      word-break: keep-all;\n    }\n\n    .intel-card {\n      display: grid;\n      gap: 12px;\n      padding: 20px;\n      border-radius: 24px;\n      background:\n        linear-gradient(145deg, rgba(239, 249, 255, 0.98), rgba(255, 245, 252, 0.96));\n      border: 1px solid var(--line);\n      box-shadow: 0 14px 44px rgba(0, 153, 255, 0.1);\n    }\n\n    .intel-card h2 {\n      margin: 0;\n      font-size: 17px;\n      font-weight: 950;\n    }\n\n    .intel-grid {\n      display: grid;\n      grid-template-columns: repeat(2, minmax(0, 1fr));\n      gap: 8px;\n    }\n\n    .intel {\n      min-height: 86px;\n      padding: 13px;\n      border-radius: 18px;\n      background: rgba(255, 255, 255, 0.78);\n      border: 1px solid rgba(255, 255, 255, 0.86);\n    }\n\n    .intel span {\n      display: block;\n      color: #74829a;\n      font-size: 11px;\n      font-weight: 900;\n    }\n\n    .intel strong {\n      display: block;\n      margin-top: 7px;\n      color: var(--ink);\n      font-size: 18px;\n      line-height: 1.2;\n      font-weight: 950;\n    }\n\n    .strategy {\n      display: grid;\n      gap: 8px;\n      margin: 0;\n      padding: 0;\n      list-style: none;\n    }\n\n    .strategy li {\n      display: grid;\n      grid-template-columns: 22px 1fr;\n      gap: 8px;\n      color: #475569;\n      font-size: 12px;\n      line-height: 1.55;\n      font-weight: 750;\n    }\n\n    .strategy b {\n      width: 22px;\n      height: 22px;\n      display: grid;\n      place-items: center;\n      border-radius: 999px;\n      color: #0369a1;\n      background: #e0f2fe;\n      font-size: 11px;\n    }\n\n    .workspace {\n      max-width: 1440px;\n      display: grid;\n      grid-template-columns: 320px minmax(0, 1fr) 430px;\n      gap: 18px;\n      margin: 0 auto;\n      padding: 0 26px 44px;\n    }\n\n    .left-rail,\n    .map-shell {\n      position: sticky;\n      top: 88px;\n      align-self: start;\n    }\n\n    .panel {\n      border-radius: 18px;\n      background: #fff;\n      border: 1px solid var(--line);\n      box-shadow: 0 10px 30px rgba(15, 107, 255, 0.06);\n    }\n\n    .route-index {\n      padding: 14px;\n    }\n\n    .route-index h3,\n    .map-shell h3 {\n      margin: 0 0 12px;\n      font-size: 13px;\n      font-weight: 950;\n    }\n\n    .day-button {\n      width: 100%;\n      display: grid;\n      grid-template-columns: 42px 1fr auto;\n      gap: 10px;\n      align-items: center;\n      padding: 10px;\n      border-radius: 14px;\n      background: transparent;\n      color: inherit;\n      text-align: left;\n      text-decoration: none;\n    }\n\n    .day-button:hover,\n    .day-button.active {\n      background: #eef7ff;\n    }\n\n    .day-button strong {\n      width: 42px;\n      height: 42px;\n      display: grid;\n      place-items: center;\n      border-radius: var(--radius);\n      color: #fff;\n      background: linear-gradient(135deg, #0099ff, #1269ff);\n      font-size: 14px;\n      font-weight: 950;\n    }\n\n    .day-button p {\n      margin: 0;\n      font-size: 13px;\n      line-height: 1.3;\n      font-weight: 900;\n    }\n\n    .day-button span {\n      display: block;\n      margin-top: 3px;\n      color: #74829a;\n      font-size: 11px;\n      font-weight: 700;\n    }\n\n    .legend {\n      display: grid;\n      gap: 8px;\n      margin-top: 14px;\n      padding-top: 14px;\n      border-top: 1px solid var(--line);\n    }\n\n    .legend-row {\n      display: flex;\n      align-items: center;\n      gap: 8px;\n      color: #475569;\n      font-size: 12px;\n      font-weight: 800;\n    }\n\n    .legend-dot {\n      width: 9px;\n      height: 9px;\n      border-radius: 999px;\n      background: var(--blue);\n    }\n\n    .legend-dot.meal { background: var(--orange); }\n    .legend-dot.rest { background: var(--teal); }\n\n    .feed {\n      display: grid;\n      gap: 18px;\n      min-width: 0;\n    }\n\n    .day-module {\n      border-radius: 20px;\n      background: #fff;\n      border: 1px solid var(--line);\n      overflow: hidden;\n      box-shadow: 0 12px 34px rgba(0, 153, 255, 0.08);\n    }\n\n    .module-head {\n      display: grid;\n      grid-template-columns: 1fr auto;\n      gap: 16px;\n      align-items: start;\n      padding: 20px;\n      background: linear-gradient(135deg, #ffffff, #f0f9ff 72%, #fff7ed);\n      border-bottom: 1px solid var(--line);\n    }\n\n    .module-kicker {\n      margin: 0 0 6px;\n      color: #6b7890;\n      font-size: 12px;\n      font-weight: 900;\n    }\n\n    .module-head h2 {\n      margin: 0;\n      font-size: 25px;\n      line-height: 1.2;\n      font-weight: 950;\n      letter-spacing: 0;\n      word-break: keep-all;\n    }\n\n    .weather-card {\n      display: flex;\n      align-items: center;\n      gap: 10px;\n      padding: 10px 12px;\n      border-radius: 14px;\n      background: rgba(255, 255, 255, 0.82);\n      border: 1px solid var(--line);\n    }\n\n    .weather-card b {\n      font-size: 24px;\n    }\n\n    .weather-card strong {\n      display: block;\n      font-size: 14px;\n      font-weight: 950;\n    }\n\n    .weather-card span {\n      color: #6b7890;\n      font-size: 11px;\n      font-weight: 750;\n    }\n\n    .time-grid {\n      display: grid;\n    }\n\n    .node {\n      display: grid;\n      grid-template-columns: 88px 26px minmax(0, 1fr);\n      gap: 14px;\n      padding: 0 20px;\n    }\n\n    .node:first-child {\n      padding-top: 20px;\n    }\n\n    .node:last-child {\n      padding-bottom: 20px;\n    }\n\n    .node-time {\n      padding-top: 7px;\n      color: #475569;\n      font-size: 13px;\n      font-weight: 950;\n    }\n\n    .node-line {\n      position: relative;\n      display: flex;\n      justify-content: center;\n    }\n\n    .node-line::before {\n      content: \"\";\n      width: 2px;\n      min-height: 100%;\n      background: #e8f0f8;\n    }\n\n    .node:last-child .node-line::before {\n      height: 18px;\n      min-height: 18px;\n    }\n\n    .node-dot {\n      position: absolute;\n      top: 9px;\n      width: 14px;\n      height: 14px;\n      border-radius: 999px;\n      background: var(--blue);\n      border: 3px solid #fff;\n      box-shadow: 0 0 0 2px #bfdbfe;\n    }\n\n    .node-dot.meal {\n      background: var(--orange);\n      box-shadow: 0 0 0 2px #fed7aa;\n    }\n\n    .node-dot.rest {\n      background: var(--teal);\n      box-shadow: 0 0 0 2px #a7f3d0;\n    }\n\n    .node-card {\n      margin-bottom: 14px;\n      padding: 15px;\n      border-radius: 16px;\n      background: rgba(255, 255, 255, 0.94);\n      border: 1px solid #eaf0f7;\n      transition: transform 0.16s ease, box-shadow 0.16s ease;\n    }\n\n    .node-card:hover {\n      transform: translateY(-2px);\n      box-shadow: 0 16px 34px rgba(0, 153, 255, 0.1);\n    }\n\n    .node-top {\n      display: flex;\n      justify-content: space-between;\n      gap: 12px;\n      align-items: start;\n    }\n\n    .node-card h3 {\n      margin: 0;\n      font-size: 16px;\n      line-height: 1.35;\n      font-weight: 950;\n    }\n\n    .tag {\n      flex: 0 0 auto;\n      padding: 5px 8px;\n      border-radius: 999px;\n      color: #063b90;\n      background: #e0f2fe;\n      font-size: 11px;\n      font-weight: 900;\n    }\n\n    .tag.meal {\n      color: #9a3412;\n      background: #fff7ed;\n    }\n\n    .tag.rest {\n      color: #047857;\n      background: #ecfdf5;\n    }\n\n    .node-card p {\n      margin: 8px 0 0;\n      color: #536173;\n      font-size: 13px;\n      line-height: 1.62;\n      font-weight: 650;\n      word-break: keep-all;\n    }\n\n    .metrics {\n      display: flex;\n      flex-wrap: wrap;\n      gap: 6px;\n      margin-top: 12px;\n    }\n\n    .metric {\n      padding: 5px 8px;\n      border-radius: 999px;\n      color: #536173;\n      background: #eef7ff;\n      font-size: 11px;\n      font-weight: 850;\n    }\n\n    .map-shell {\n      display: grid;\n      gap: 12px;\n      padding: 14px;\n    }\n\n    .map {\n      height: 520px;\n      border-radius: 18px;\n      overflow: hidden;\n      background: linear-gradient(#dbeafe, #e0f2fe);\n    }\n\n    .map-fallback {\n      height: 100%;\n      display: grid;\n      place-items: center;\n      padding: 24px;\n      color: #64748b;\n      text-align: center;\n      font-size: 13px;\n      line-height: 1.55;\n      font-weight: 750;\n    }\n\n    .map-focus {\n      display: grid;\n      gap: 8px;\n      margin: 0;\n      padding: 0;\n      list-style: none;\n    }\n\n    .map-focus li {\n      display: grid;\n      grid-template-columns: 24px 1fr auto;\n      gap: 8px;\n      align-items: center;\n      padding: 9px;\n      border-radius: 14px;\n      background: #f7fbff;\n      border: 1px solid #e6edf5;\n      font-size: 12px;\n      font-weight: 850;\n    }\n\n    .map-focus b {\n      width: 24px;\n      height: 24px;\n      display: grid;\n      place-items: center;\n      border-radius: 999px;\n      color: #fff;\n      background: linear-gradient(135deg, #0099ff, #1269ff);\n      font-size: 11px;\n    }\n\n    .map-focus span {\n      color: #74829a;\n      font-size: 11px;\n      font-weight: 750;\n    }\n\n    @media (max-width: 1180px) {\n      .overview,\n      .workspace {\n        grid-template-columns: 1fr;\n      }\n\n      .left-rail,\n      .map-shell {\n        position: static;\n      }\n\n      .left-rail {\n        order: -1;\n      }\n    }\n\n    @media (max-width: 720px) {\n      .command-inner,\n      .overview,\n      .workspace {\n        padding-left: 16px;\n        padding-right: 16px;\n      }\n\n      .command-inner {\n        grid-template-columns: 1fr auto;\n      }\n\n      .route-pill,\n      .command-actions .light {\n        display: none;\n      }\n\n      .hero-card {\n        min-height: 420px;\n        padding: 20px;\n      }\n\n      .hero-top,\n      .module-head {\n        grid-template-columns: 1fr;\n        flex-direction: column;\n      }\n\n      .hero-title {\n        font-size: 40px;\n      }\n\n      .intel-grid {\n        grid-template-columns: 1fr;\n      }\n\n      .node {\n        grid-template-columns: 64px 22px minmax(0, 1fr);\n        gap: 10px;\n        padding-left: 14px;\n        padding-right: 14px;\n      }\n\n      .module-head {\n        display: grid;\n      }\n    }\n  "
const GOOGLE_MAP_SCRIPT_ID = 'google-maps-codexview-script'
const GOOGLE_MAP_SCRIPT_SRC = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDaVmYg-OdmcaT1qDjLA-J-n5-df0XyWSw&callback=initCodexMap&loading=async'

export default function AiGenerationSchedule() {
  const navigate = useNavigate()

  useEffect(() => {
    
        const plan = [
          {
            id: "day1",
            day: "Day 01",
            date: "6월 12일 금요일",
            title: "하카타에 부드럽게 착륙",
            weather: ["☁️", "24°C", "흐림 · 저녁 선선"],
            nodes: [
              { time: "14:30", title: "후쿠오카 공항", kind: "move", tag: "이동", body: "공항선으로 하카타역까지 바로 이동합니다. 첫날부터 무리하지 않도록 체크인 이후 일정은 가까운 곳만 배치했습니다.", metrics: ["지하철 6분", "짐 정리"], lat: 33.5859, lng: 130.4506 },
              { time: "15:30", title: "호텔 포르자 하카타역 하카타구치", kind: "rest", tag: "숙소 도착", body: "하카타역 도보권 숙소로 설정했습니다. 체크인 후 짐을 풀고 첫날은 가까운 하카타 권역만 가볍게 움직입니다.", metrics: ["하카타역 도보권", "체크인"], lat: 33.5899, lng: 130.4184 },
              { time: "16:00", title: "캐널시티 하카타", kind: "spot", tag: "실내", body: "쇼핑, 분수쇼, 간단한 간식까지 한 번에 해결되는 첫날 워밍업 코스입니다.", metrics: ["체류 90분", "비 와도 OK"], lat: 33.5898, lng: 130.4104 },
              { time: "19:00", title: "나카스 야타이", kind: "meal", tag: "저녁", body: "라멘과 야키토리로 후쿠오카 첫 식사를 시작합니다. 줄이 길면 텐진 야타이로 우회하세요.", metrics: ["대기 가능", "현금 준비"], lat: 33.5927, lng: 130.4064 },
              { time: "21:10", title: "호텔 포르자 하카타역 하카타구치", kind: "rest", tag: "숙소 도착", body: "첫날은 늦게까지 무리하지 않고 하카타역 근처 숙소로 복귀합니다.", metrics: ["택시 8분", "휴식"], lat: 33.5899, lng: 130.4184 }
            ]
          },
          {
            id: "day2",
            day: "Day 02",
            date: "6월 13일 토요일",
            title: "오호리에서 텐진까지",
            weather: ["☀️", "27°C", "맑음 · 산책 최적"],
            nodes: [
              { time: "09:00", title: "호텔 포르자 하카타역 하카타구치", kind: "rest", tag: "숙소 출발", body: "조식 후 하카타역에서 지하철로 오호리 공원 방향으로 이동합니다.", metrics: ["숙소 출발", "지하철"], lat: 33.5899, lng: 130.4184 },
              { time: "09:30", title: "오호리 공원", kind: "rest", tag: "산책", body: "호수 둘레를 걷고 근처 카페에서 천천히 시작합니다. 오전 빛이 좋아 사진도 잘 나옵니다.", metrics: ["체류 80분", "도보 중심"], lat: 33.5861, lng: 130.3763 },
              { time: "11:20", title: "후쿠오카 성터", kind: "spot", tag: "전망", body: "오호리 공원에서 자연스럽게 이어지는 짧은 역사 코스입니다.", metrics: ["도보 12분", "무료"], lat: 33.5842, lng: 130.3831 },
              { time: "13:00", title: "텐진 지하상가", kind: "meal", tag: "점심", body: "점심과 쇼핑을 함께 처리하는 실용 구간. 더운 날씨에도 체력 소모가 낮습니다.", metrics: ["실내", "쇼핑"], lat: 33.5902, lng: 130.3989 },
              { time: "18:30", title: "모츠나베 야마나카", kind: "meal", tag: "예약", body: "후쿠오카 대표 메뉴인 모츠나베를 저녁 메인으로 배치했습니다. 주말은 예약을 추천합니다.", metrics: ["대표 음식", "저녁"], lat: 33.5812, lng: 130.4014 },
              { time: "21:00", title: "호텔 포르자 하카타역 하카타구치", kind: "rest", tag: "숙소 도착", body: "저녁 식사 후 바로 숙소로 복귀해 다음 날 근교 이동을 대비합니다.", metrics: ["지하철 15분", "휴식"], lat: 33.5899, lng: 130.4184 }
            ]
          },
          {
            id: "day3",
            day: "Day 03",
            date: "6월 14일 일요일",
            title: "다자이후 근교 집중",
            weather: ["🌤", "26°C", "구름 조금"],
            nodes: [
              { time: "08:30", title: "호텔 포르자 하카타역 하카타구치", kind: "rest", tag: "숙소 출발", body: "근교 이동일이라 조금 일찍 출발합니다. 하카타에서 텐진으로 이동한 뒤 니시테츠선을 탑니다.", metrics: ["조기 출발", "근교 준비"], lat: 33.5899, lng: 130.4184 },
              { time: "09:00", title: "니시테츠 후쿠오카역", kind: "move", tag: "출발", body: "오전 출발로 다자이후 혼잡 시간을 줄입니다. 왕복 이동이 있으니 이날은 시내 일정을 과하게 넣지 않았습니다.", metrics: ["전철 40분", "근교"], lat: 33.5887, lng: 130.3987 },
              { time: "10:10", title: "다자이후 텐만구", kind: "spot", tag: "전통", body: "참배길, 텐만구, 우메가에모치를 묶어 후쿠오카 근교의 대표 경험을 압축했습니다.", metrics: ["체류 2시간", "간식"], lat: 33.5211, lng: 130.5348 },
              { time: "12:00", title: "스타벅스 다자이후 오모테산도", kind: "rest", tag: "카페", body: "목조 격자 디자인이 인상적인 지점입니다. 점심 전후 짧은 휴식 포인트로 좋습니다.", metrics: ["포토", "휴식"], lat: 33.5187, lng: 130.5321 },
              { time: "17:30", title: "하카타역 아뮤플라자", kind: "spot", tag: "쇼핑", body: "복귀 후 선물 구매와 저녁 선택지를 한 번에 처리합니다.", metrics: ["선물", "역 연결"], lat: 33.5904, lng: 130.4206 },
              { time: "20:30", title: "호텔 포르자 하카타역 하카타구치", kind: "rest", tag: "숙소 도착", body: "역 쇼핑 후 숙소까지 도보로 돌아가며 하루를 마무리합니다.", metrics: ["도보 5분", "휴식"], lat: 33.5899, lng: 130.4184 }
            ]
          },
          {
            id: "day4",
            day: "Day 04",
            date: "6월 15일 월요일",
            title: "바다를 보고 공항으로",
            weather: ["✈️", "25°C", "오전 여유"],
            nodes: [
              { time: "09:00", title: "호텔 포르자 하카타역 하카타구치", kind: "rest", tag: "숙소 출발", body: "체크아웃 후 짐은 하카타역 코인락커 또는 숙소 보관을 이용합니다.", metrics: ["체크아웃", "짐 보관"], lat: 33.5899, lng: 130.4184 },
              { time: "09:30", title: "모모치 해변", kind: "rest", tag: "바다", body: "출국 전 가벼운 산책. 하카타역 코인락커를 쓰면 짐 부담 없이 다녀올 수 있습니다.", metrics: ["산책", "사진"], lat: 33.5932, lng: 130.3516 },
              { time: "11:00", title: "후쿠오카 타워", kind: "spot", tag: "전망", body: "시간이 맞으면 전망대, 빠듯하면 외관과 해변 산책만으로도 충분합니다.", metrics: ["선택 코스", "전망"], lat: 33.5933, lng: 130.3515 },
              { time: "14:00", title: "후쿠오카 공항", kind: "move", tag: "출국", body: "하카타에서 공항 접근성이 좋아 마지막 날에도 짧은 코스를 넣을 수 있습니다.", metrics: ["공항", "마무리"], lat: 33.5859, lng: 130.4506 }
            ]
          }
        ];
    
        let activeDayId = "day1";
        let codexMap;
        let codexMarkers = [];
        let codexPolyline;
    
        function classFor(kind) {
          if (kind === "meal") return "meal";
          if (kind === "rest") return "rest";
          return "";
        }
    
        function renderFeed() {
          document.getElementById("feed").innerHTML = plan.map(day => `
            <article class="day-module" id="${day.id}">
              <header class="module-head">
                <div>
                  <p class="module-kicker">${day.day} · ${day.date}</p>
                  <h2>${day.title}</h2>
                </div>
                <div class="weather-card"><b>${day.weather[0]}</b><span><strong>${day.weather[1]}</strong><span>${day.weather[2]}</span></span></div>
              </header>
              <div class="time-grid">
                ${day.nodes.map(node => `
                  <div class="node">
                    <div class="node-time">${node.time}</div>
                    <div class="node-line"><span class="node-dot ${classFor(node.kind)}"></span></div>
                    <section class="node-card">
                      <div class="node-top">
                        <h3>${node.title}</h3>
                        <span class="tag ${classFor(node.kind)}">${node.tag}</span>
                      </div>
                      <p>${node.body}</p>
                      <div class="metrics">${node.metrics.map(metric => `<span class="metric">${metric}</span>`).join("")}</div>
                    </section>
                  </div>
                `).join("")}
              </div>
            </article>
          `).join("");
    
          renderSelectedDayMap();
        }
    
        function activeDay() {
          return plan.find(day => day.id === activeDayId) || plan[0];
        }
    
        function renderSelectedDayMap() {
          const day = activeDay();
          const dayNumber = plan.findIndex(item => item.id === day.id) + 1;
    
          document.getElementById("mapTitle").textContent = `${dayNumber}일차 Google Maps 동선`;
          document.getElementById("mapFocus").innerHTML = day.nodes.map((node, index) => `
            <li><b>${index + 1}</b>${node.title}<span>${node.time}</span></li>
          `).join("");
    
          if (codexMap) drawCodexMap(day);
        }
    
        function drawCodexMap(day) {
          codexMarkers.forEach(marker => marker.setMap(null));
          codexMarkers = [];
          if (codexPolyline) codexPolyline.setMap(null);
    
          const bounds = new window.google.maps.LatLngBounds();
          const path = day.nodes.map(node => ({ lat: node.lat, lng: node.lng }));
    
          day.nodes.forEach((node, index) => {
            const position = { lat: node.lat, lng: node.lng };
            bounds.extend(position);
            codexMarkers.push(new window.google.maps.Marker({
              position,
              map: codexMap,
              label: {
                text: String(index + 1),
                color: "#ffffff",
                fontWeight: "800"
              },
              title: node.title
            }));
          });
    
          codexPolyline = new window.google.maps.Polyline({
            path,
            map: codexMap,
            strokeColor: "#0099ff",
            strokeOpacity: 0.86,
            strokeWeight: 4
          });
    
          codexMap.fitBounds(bounds);
        }
    
        function selectDay(dayId) {
          activeDayId = dayId;
          document.querySelectorAll("[data-day-map]").forEach(button => {
            button.classList.toggle("active", button.dataset.dayMap === dayId);
          });
          renderSelectedDayMap();
        }
    
        function initCodexMap() {
          const mapEl = document.getElementById("codexMap");
          if (!window.google?.maps) return;
    
          codexMap = new window.google.maps.Map(mapEl, {
            center: { lat: 33.5902, lng: 130.4017 },
            zoom: 11,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: [
              { featureType: "poi", stylers: [{ visibility: "off" }] },
              { featureType: "transit", stylers: [{ saturation: -20 }] },
              { featureType: "water", stylers: [{ color: "#dbeafe" }] }
            ]
          });
          drawCodexMap(activeDay());
        }
    
        renderFeed();
        document.querySelectorAll("[data-day-map]").forEach(button => {
          button.addEventListener("click", () => {
            selectDay(button.dataset.dayMap);
          });
        });

    window.initCodexMap = initCodexMap;
    if (window.google?.maps) {
      initCodexMap();
    } else if (!document.getElementById(GOOGLE_MAP_SCRIPT_ID)) {
      const scriptEl = document.createElement('script');
      scriptEl.id = GOOGLE_MAP_SCRIPT_ID;
      scriptEl.src = GOOGLE_MAP_SCRIPT_SRC;
      scriptEl.async = true;
      scriptEl.defer = true;
      document.body.appendChild(scriptEl);
    }

    return () => {
      if (window.initCodexMap === initCodexMap) delete window.initCodexMap;
    };
  }, [])

  return (
    <>
      <style>{pageStyle}</style>
      <div className="page">
          <header className="command">
            <div className="command-inner">
              <a className="brand" href="#"><span className="brand-icon">✈</span><span>폰가이즈</span></a>
              <div className="route-pill"><strong>후쿠오카</strong><span>3박 4일</span><span>맛집 · 산책 · 근교 여행</span></div>
              <div className="command-actions">
                <button className="action light" type="button">다시 만들기</button>
                <button className="action light" type="button" onClick={() => navigate('/ai-travel-duration')}>일정중</button>
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
    </>
  )
}
