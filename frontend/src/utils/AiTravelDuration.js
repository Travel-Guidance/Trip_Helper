import {
  CITY_DATA as MOCK_CITY_DATA,
  CITY_GROUPS as MOCK_CITY_GROUPS,
  EUR_TO_KRW,
  SCHEDULE as MOCK_SCHEDULE,
} from '../data/AiTravelDuration'
import { apiGet } from '../api/apiClient'
import EMERGENCY_NUMBERS from '../data/emergencyNumbers.json'

/* global google */
const GOOGLE_MAP_SCRIPT_ID = 'google-maps-travel-duration-script'
const GOOGLE_MAP_SCRIPT_SRC = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDaVmYg-OdmcaT1qDjLA-J-n5-df0XyWSw&callback=initMap&loading=async'
const DAILY_BUDGET_WON = { low: 100000, mid: 300000, high: 500000 }
const BUDGET_CATEGORIES = [
  { key: 'meal', label: '식사', icon: '🍽', color: 'var(--amber)' },
  { key: 'transport', label: '교통', icon: '🚇', color: 'var(--blue)' },
  { key: 'entry', label: '입장비', icon: '🏛', color: 'var(--green)' },
  { key: 'shop', label: '쇼핑', icon: '🛍', color: 'var(--purple)' },
]
const EMERGENCY_RADIUS_METERS = 3000

function readGeneratedPlanResult() {
  try {
    const stored = sessionStorage.getItem('aiPlanResult')
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function kindFromItem(item) {
  if (item?.isMeal) return 'meal'
  if (item?.isHotel) return 'rest'
  return 'spot'
}

function pointFromGeneratedItem(item, index) {
  const known = knownPlaceCoordinates(item?.name)
  if (known) return known
  const lat = Number(item?.lat)
  const lng = Number(item?.lng)
  if (Number.isFinite(lat) && Number.isFinite(lng)) return { lat, lng }
  return { lat: 37.5665 + index * 0.006, lng: 126.978 + index * 0.006 }
}

function cleanPlaceName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+(체크인|체크아웃|도착|출발|복귀|방문|관광|구경|산책|탐방)$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function lookupEmergencyNumber(destination) {
  if (!destination) return null
  const dest = destination.trim()
  if (EMERGENCY_NUMBERS[dest]) return { countryName: dest, ...EMERGENCY_NUMBERS[dest] }
  for (const [country, data] of Object.entries(EMERGENCY_NUMBERS)) {
    if (dest.includes(country) || country.includes(dest)) return { countryName: country, ...data }
    if (data.aliases?.some(alias => dest.includes(alias) || alias.includes(dest))) {
      return { countryName: country, ...data }
    }
  }
  return null
}

function knownPlaceCoordinates(name) {
  const text = cleanPlaceName(name).toLowerCase()
  if (/four seasons hotel sydney|four seasons sydney|199 george st/.test(text)) {
    return { lat: -33.8615815, lng: 151.2076503 }
  }
  if (/달링하버\s*(레스토랑|식당|맛집)|darling harbour\s*(restaurant|dining)/.test(text)) {
    return { lat: -33.8722257, lng: 151.2020367 }
  }
  return null
}

function displayPlaceName(name) {
  const text = cleanPlaceName(name).toLowerCase()
  if (/달링하버\s*(레스토랑|식당|맛집)|darling harbour\s*(restaurant|dining)/.test(text)) {
    return "Nick's Seafood Restaurant"
  }
  return name
}

function heroImageForDestination(destination) {
  const images = {
    호주: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=80',
    시드니: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=80',
    일본: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1800&q=80',
    도쿄: 'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1800&q=80',
    오사카: 'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1800&q=80',
    프랑스: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1800&q=80',
    파리: 'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1800&q=80',
    태국: 'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?auto=format&fit=crop&w=1800&q=80',
    베트남: 'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1800&q=80',
  }
  const found = Object.entries(images).find(([key]) => destination.includes(key))
  return found?.[1] || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=80'
}

function getTripDays(tripInfo, fallbackDays) {
  const nights = Number(tripInfo?.nights)
  if (Number.isFinite(nights) && nights >= 0) return nights + 1
  return fallbackDays || 0
}

function getTravelerCount(tripInfo) {
  const adults = Number(tripInfo?.adults) || 0
  const teens = Number(tripInfo?.teens) || 0
  const children = Number(tripInfo?.children) || 0
  const infants = Number(tripInfo?.infants) || 0
  return Math.max(1, adults + teens + children + infants)
}

function getTotalBudgetWon(tripInfo, fallbackDays) {
  const dailyBudget = DAILY_BUDGET_WON[tripInfo?.budget]
  if (!dailyBudget) return 0
  return dailyBudget * getTripDays(tripInfo, fallbackDays) * getTravelerCount(tripInfo)
}

function buildGeneratedTravelData() {
  const result = readGeneratedPlanResult()
  const days = result?.planData?.days
  if (!Array.isArray(days) || days.length === 0) return null

  const tripInfo = result?.tripInfo || {}
  const destination = tripInfo.country || tripInfo.continent || 'AI 여행'
  const schedule = days.map((day, index) => ({
    day: index + 1,
    city: destination,
    wx: index === 0 ? '☀' : '🌤',
    base: `generated-${index}`,
    today: index === 0,
  }))
  const cityData = {}

  days.forEach((day, index) => {
    const stops = (day.items || []).map((item, itemIndex) => {
      const known = knownPlaceCoordinates(item?.name)
      return {
        t: escapeHtml(item.time || (itemIndex === 0 ? '09:00' : '')),
        name: escapeHtml(displayPlaceName(item.name || `일정 ${itemIndex + 1}`)),
        badge: escapeHtml(item.isMeal ? '식사' : '명소'),
        kind: kindFromItem(item),
        now: index === 0 && itemIndex === 0,
        desc: escapeHtml(item.note || 'AI가 생성한 여행 일정입니다.'),
        tags: [item.isMeal ? '식사 포인트' : '방문 포인트'].map(escapeHtml),
        safety: 'safe',
        lat: known?.lat ?? Number(item?.lat),
        lng: known?.lng ?? Number(item?.lng),
      }
    })

    cityData[`generated-${index}`] = {
      title: escapeHtml(day.theme || day.title || `${destination} ${index + 1}일차`),
      desc: escapeHtml(`${destination} 여행 ${index + 1}일차 일정입니다.`),
      stops,
      mapPoints: (day.items || []).map(pointFromGeneratedItem),
    }
  })

  return {
    isGenerated: true,
    destination,
    schedule,
    cityData,
    cityGroups: [{
      id: 'generated-trip',
      name: destination,
      wx: '✈',
      range: `Day 1-${days.length}`,
      indices: days.map((_, index) => index),
    }],
    activeIdx: 0,
    heroTitle: destination,
    routeText: days.map((day, index) => `${index + 1}일차 ${day.theme || day.title || ''}`.trim()).join(' → '),
    totalBudgetWon: getTotalBudgetWon(tripInfo, days.length),
  }
}

export function initAiTravelDuration() {
  const travelData = buildGeneratedTravelData() || {
    isGenerated: false,
    destination: '스페인',
    schedule: MOCK_SCHEDULE,
    cityData: MOCK_CITY_DATA,
    cityGroups: MOCK_CITY_GROUPS,
    activeIdx: 3,
    heroTitle: 'Barcelona',
    routeText: '바르셀로나 → 마드리드 → 세비야 외 7개 도시',
    totalBudgetWon: 0,
  }
  const schedule = travelData.schedule
  const cityData = travelData.cityData
  const cityGroups = travelData.cityGroups
  
  /* ── 도시 그룹 (accordion 단위) ── */
  /* ── 30일 일정 mock ── */
  /* ── 도시별 타임라인 데이터 ── */
  function eurToKrw(amount) {
    return Math.round(amount * EUR_TO_KRW);
  }
  function formatKrw(amount) {
    return '₩' + Math.round(amount).toLocaleString('ko-KR');
  }
  function formatEurAsKrw(amount) {
    return formatKrw(eurToKrw(amount));
  }
  function formatExpense(amount) {
    return formatKrw(amount);
  }
  function formatLocalAmount(amount) {
    const value = Number(amount) || 0;
    if (!exchangeRate.currency) return value.toLocaleString('ko-KR');
    if (exchangeRate.currency === 'KRW') return formatKrw(value);
    return `${value.toLocaleString('ko-KR')} ${exchangeRate.currency}`;
  }
  function formatExpenseLogAmount(expense) {
    if (expense.currency === 'KRW') return formatExpense(expense.amountKrw);
    return `${formatLocalAmount(expense.amountLocal)} · ${formatExpense(expense.amountKrw)}`;
  }
  function localToKrw(amount) {
    return Math.round((Number(amount) || 0) * exchangeRate.rateToKrw);
  }
  function localizeMoneyText(text) {
    return String(text).replace(/€\s?([\d,.]+)(?:\s?-\s?([\d,.]+))?/g, (_, from, to) => {
      const start = parseFloat(from.replace(/,/g, ''));
      if (!to) return formatEurAsKrw(start);
      const end = parseFloat(to.replace(/,/g, ''));
      return `${formatEurAsKrw(start)}-${formatEurAsKrw(end)}`;
    });
  }
  function getBudgetModalHtml() {
    const spent = getTotalSpent();
    const remaining = Math.max(0, total - spent);
    const pct = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
    const categoryRows = getCategoryBreakdown()
      .map(cat => `<div class="mi-row"><strong>${cat.icon} ${cat.label}</strong><span>${formatExpense(cat.amount)} · ${cat.pct}%</span></div>`)
      .join('');

    return `<div class="mi-row"><strong>총 지출</strong><span style="font-family:'JetBrains Mono',monospace;color:var(--gold)">${formatExpense(spent)} / ${total ? formatKrw(total) : '예산 미설정'}</span></div><div class="mi-row"><strong>예산 소진율</strong><span>${pct}%</span></div><div class="mi-row"><strong>남은 예산</strong><span style="color:var(--green)">${total ? formatExpense(remaining) : '예산을 선택하지 않음'}</span></div><div class="mi-row"><strong>카테고리 비중</strong><span>전체 지출 기준</span></div>${categoryRows || '<div class="mi-row"><strong>지출 내역</strong><span>아직 없음</span></div>'}`;
  }
  
  const modalData = {
    translate: {
      title:"실시간 번역",
      html:`<div class="mi-phrase"><button>이거 얼마예요?</button><button>화장실 어디예요?</button><button>영수증 주세요</button><button>택시 불러주세요</button><button>병원이 어디예요?</button><button>도와주세요!</button></div><textarea class="mi-textarea" placeholder="번역할 내용을 입력하세요..."></textarea><div class="mi-result">번역 결과가 여기에 표시됩니다.</div>`
    },
    emergency: {
      title:"긴급 정보",
      html() {
        const info = lookupEmergencyNumber(travelData.destination)
        const emergencyRow = info
          ? `<div class="mi-emergency"><strong>🚑 ${info.number}</strong><span>${info.countryName} ${info.desc}</span></div>`
          : `<div class="mi-emergency"><strong>🚑 112</strong><span>국제 통합 긴급번호</span></div>`
        return `
          ${emergencyRow}
          <div id="emergencyNearbyInfo">
            <div class="mi-row"><strong>📍 주변 응급시설</strong><span class="mi-muted">조회 중...</span></div>
          </div>
          <div id="consulateInfo">
            <div class="mi-row"><strong>🏛 한국 영사관</strong><span class="mi-muted">조회 중...</span></div>
            <div class="mi-row"><strong>🚨 긴급 영사</strong><span class="mi-muted">조회 중...</span></div>
          </div>`
      },
      async postOpen() {
        const info = lookupEmergencyNumber(travelData.destination)
        const destination = info?.countryName || travelData.destination
        loadEmergencyNearbyInfo()
        if (destination) loadConsulateInfo(destination)
      }
    },
    nearby: {
      title:"주변 편의시설",
      html:`${['💊 약국 — Farmàcia Canaletes — 230m','🏥 병원 — Hospital Clínic — 1.2km','🛒 편의점 — Supercor — 180m','💸 ATM — CaixaBank — 90m','🚻 공공 화장실 — 340m'].map(t=>`<div class="mi-row"><strong>${t.split(' — ')[0]}</strong><span>${t.split(' — ').slice(1).join(' · ')}</span></div>`).join('')}`
    },
    hotel: {
      title:"숙소 전략",
      html:`<p style="font-size:13px;color:var(--muted);margin-bottom:12px;line-height:1.6">투어 밀도·예산·교통 허브 기준으로 이동마다 다음 거점을 재배치합니다.</p><div class="mi-safe"><strong>Praktik Garden, 바르셀로나</strong><span>Day 1-5 · 예약 완료</span></div><div class="mi-safe"><strong>Room Mate Alba, 마드리드</strong><span>Day 6-9 · AI 추천</span></div><div class="mi-row"><strong>Hotel Amadeus, 세비야</strong><span>Day 10-13</span></div><div class="mi-row"><strong>Hotel Casa 1800, 그라나다</strong><span>Day 14-16</span></div><div class="mi-row"><strong>이하 6개 도시 숙소...</strong><span>AI 후보 선정 중</span></div>`
    },
    budget: {
      title:"예산 분석",
      html:getBudgetModalHtml
    },
    fatigue: {
      title:"피로도 상세",
      html:`${[['🦶 오늘 도보','8.4km (목표 10km)'],['🚇 이동 횟수','4회'],['☕ 휴식 후보','카페 40분 추가 가능'],['📊 입력 피로도','6/10 · 카페 휴식 추천']].map(([k,v])=>`<div class="mi-row"><strong>${k}</strong><span>${v}</span></div>`).join('')}`
    },
    album: {
      title:"여행 앨범",
      html() {
        const dayStops = getDayStops(cityData[schedule[activeIdx]?.base]?.stops || [])
        const currentStop = dayStops[activeStopIdx]
        const locationName = currentStop?.name || ''
        const dayNum = String((schedule[activeIdx]?.day) || 1).padStart(2, '0')

        const photoHtml = albumPhoto
          ? `<div class="mi-album-preview" id="albumPreview">
               <img src="${albumPhoto}" alt="업로드된 사진">
               <button class="mi-album-preview-del" id="albumDel" title="삭제">× 사진 삭제</button>
             </div>`
          : `<div class="mi-album-drop" id="albumDrop">
               <input type="file" id="albumFileInput" accept="image/*" style="display:none">
               <div class="mi-album-drop-icon">📷</div>
               <div class="mi-album-drop-text">클릭하거나 사진을 드래그하세요</div>
               <div class="mi-album-drop-hint">JPG · PNG · GIF · HEIC 지원</div>
             </div>`

        return `
          ${locationName ? `
          <div class="mi-album-location-header">
            <div class="mi-album-location-day">Day ${dayNum}</div>
            <div class="mi-album-location-name">${locationName}</div>
          </div>` : ''}
          <p style="font-size:13px;color:var(--muted);margin:10px 0 12px;line-height:1.6">여행 중 저장한 사진과 메모. 종료 후 날짜별 타임라인으로 정리됩니다.</p>
          ${photoHtml}
          <div class="mi-album-memo-wrap">
            <textarea class="mi-album-memo" id="albumMemo" placeholder="오늘 여행 소감을 간단히 적어보세요..." maxlength="300">${albumMemo}</textarea>
            <div class="mi-album-memo-counter"><span id="albumMemoCount">${albumMemo.length}</span> / 300</div>
          </div>
        `
      },
      postOpen() {
        const memoEl = document.getElementById('albumMemo')
        const counterEl = document.getElementById('albumMemoCount')
        if (memoEl) {
          memoEl.addEventListener('input', () => {
            albumMemo = memoEl.value
            if (counterEl) counterEl.textContent = albumMemo.length
          })
        }

        // 사진 삭제 버튼
        const delBtn = document.getElementById('albumDel')
        if (delBtn) {
          delBtn.addEventListener('click', () => {
            albumPhoto = ''
            document.getElementById('overlay').classList.remove('show')
            setTimeout(() => openModal('album'), 0)
          })
          return
        }

        // 드롭존 (사진 없을 때만 존재)
        const drop = document.getElementById('albumDrop')
        const input = document.getElementById('albumFileInput')
        if (!drop || !input) return

        drop.addEventListener('click', () => input.click())

        input.addEventListener('change', e => {
          const file = e.target.files[0]
          if (file) loadFile(file)
          input.value = ''
        })

        drop.addEventListener('dragover', e => {
          e.preventDefault()
          drop.classList.add('drag-over')
        })
        drop.addEventListener('dragleave', () => drop.classList.remove('drag-over'))
        drop.addEventListener('drop', e => {
          e.preventDefault()
          drop.classList.remove('drag-over')
          const file = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'))
          if (file) loadFile(file)
        })

        function loadFile(file) {
          // 미리보기용 base64
          const reader = new FileReader()
          reader.onload = ev => { albumPhoto = ev.target.result }
          reader.readAsDataURL(file)

          // 서버 업로드
          const apiBase = ((import.meta.env.VITE_API_BASE || '') || '').replace(/\/$/, '')
          const formData = new FormData()
          formData.append('photo', file)
          const token = localStorage.getItem('tripHelperToken')
          fetch(`${apiBase}/api/memories/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          })
            .then(r => r.json())
            .then(data => {
              albumPhotoUrl = data.url || ''
              document.getElementById('overlay').classList.remove('show')
              setTimeout(() => openModal('album'), 0)
            })
            .catch(() => {
              // 업로드 실패해도 base64 미리보기는 유지, 모달 재오픈
              albumPhotoUrl = ''
              document.getElementById('overlay').classList.remove('show')
              setTimeout(() => openModal('album'), 0)
            })
        }
      }
    },
    safety: {
      title:"야간 안전 정보",
      html:`<div class="mi-emergency"><strong>⚠️ Carrer de Sant Pau</strong><span>최근 3년 소매치기 5건 · 야간 단독 비권장</span></div><div class="mi-safe"><strong>✓ Passeig de Gracia</strong><span>+6분 · 조명 충분 · 사고 이력 없음</span></div><div class="mi-row"><strong>권고</strong><span>야간 이동 시 대로변 우선, 스마트폰 노출 최소화</span></div>`
    }
  };
  
  function syncTripChrome() {
    const tripTitle = document.getElementById('topbarTripTitle')
    const route = document.getElementById('topbarRoute')
    const heroCity = document.getElementById('heroCity')
    const heroTag1 = document.getElementById('heroTag1')
    const heroTag2 = document.getElementById('heroTag2')
    const day = schedule[activeIdx]
    const dayTitle = cityData[day?.base]?.title || travelData.routeText

    if (tripTitle) tripTitle.textContent = `${travelData.destination} 여행`
    if (route) route.textContent = `Day ${String(day?.day || 1).padStart(2, '0')} · ${dayTitle}`
    if (heroCity) heroCity.textContent = travelData.heroTitle
    if (heroTag1) heroTag1.innerHTML = `<span class="live-dot"></span> Day ${String(day?.day || 1).padStart(2, '0')} 진행 중`
    if (heroTag2 && travelData.isGenerated) heroTag2.textContent = 'AI 생성 일정 기반으로 여행을 진행합니다'
    if (travelData.isGenerated) {
      const hero = document.querySelector('.ai-travel-duration-page .dest-hero')
      if (hero) {
        hero.style.background = `linear-gradient(to bottom, rgba(15,39,68,.08) 0%, rgba(15,39,68,.5) 60%, rgba(15,39,68,.88) 100%), url("${heroImageForDestination(travelData.destination)}") center/cover`
      }
    }
  }

  /* ── state ── */
  let activeIdx = travelData.activeIdx;
  let activeStopIdx = 0;
  const total = travelData.totalBudgetWon || 0;
  let fatigueVal = 6;
  let openTransitKey = '';
  let transitLoadingKey = '';
  let transitResults = {};
  let routeModeResults = {};
  let selectedTravelMode = 'WALKING';
  let activeTransitStepIdx = null;
  let expenses = [];
  let stopExpenses = {};
  let albumPhoto = '';      // base64 미리보기용
  let albumPhotoUrl = '';   // 서버 저장 후 반환된 URL
  let albumMemo = '';
  let activeModalKey = '';
  let exchangeRate = { currency: '', rateToKrw: 1, cached: true };
  let mapReady = false;
  let mapModalOpen = false;
  let emergencyMapUrl = '';
  
  function refreshMap() {
    if (!mapReady || !window.google) return;
    renderRouteMap('liveMap');
    if (mapModalOpen) renderRouteMap('modalMap');
  }
  
  function syncDayView() {
    activeStopIdx = 0;
    selectedTravelMode = 'WALKING';
    activeTransitStepIdx = null;
    syncTripChrome();
    renderCityAccordion();
    renderTL();
    refreshMap();
    requestSimpleRoute(activeStopIdx, 'walk');
  }

  function selectStop(nextIdx) {
    const dayStops = getDayStops(cityData[schedule[activeIdx].base].stops);
    activeStopIdx = Math.max(0, Math.min(nextIdx, dayStops.length - 1));
    selectedTravelMode = 'WALKING';
    activeTransitStepIdx = null;
    openTransitKey = '';
    renderTL();
    refreshMap();
    requestSimpleRoute(activeStopIdx, 'walk');
  }
  
  function stopExpenseKey(day, stopIdx) {
    return `${day}-${stopIdx}`;
  }
  
  function transitPanelKey(day, stopIdx) {
    return `${day}-${stopIdx}`;
  }
  
  function modeResultKey(day, stopIdx, mode) {
    return `${day}-${stopIdx}-${mode}`;
  }
  
  function getModeOptions(stop, i) {
    const day = schedule[activeIdx].day;
    const walkLive = routeModeResults[modeResultKey(day, i, 'walk')];
    const taxiLive = routeModeResults[modeResultKey(day, i, 'taxi')];
    const transitLive = routeModeResults[modeResultKey(day, i, 'transit')];
    const fallbackWalk = i === 0
      ? { time:'0분', desc:'숙소 앞에서 바로 일정 시작', minutes:0 }
      : stop.kind === 'risk'
        ? { time:'18분', desc:'대로변 우회 · 골목길 회피', minutes:18 }
        : { time:i % 2 ? '12분' : '15분', desc:'현재 루트 유지 · 골목길 포함', minutes:i % 2 ? 12 : 15 };
    if (i === 0) {
      return [
        { mode:'walk', icon:'🚶', title:'도보 시작', desc:'숙소 앞에서 바로 일정 시작', time:'0분', minutes:0 },
        { mode:'info', icon:'↩', title:'복귀 지점', desc:'일정 종료 후 같은 숙소로 돌아오기', time:'고정', minutes:999 }
      ];
    }
    if (stop.kind === 'risk') {
      return [
        { mode:'taxi', icon:'🚕', title:'택시', desc:taxiLive?.desc || '가까운 대로변 승차 · 야간 이동 우선', time:taxiLive?.time || '조회', minutes:taxiLive?.minutes ?? 999 },
        { mode:'walk', icon:'🚶', title:'도보', desc:walkLive?.desc || fallbackWalk.desc, time:walkLive?.time || fallbackWalk.time, minutes:walkLive?.minutes ?? fallbackWalk.minutes },
        { mode:'transit', icon:'🚇', title:'대중교통', desc:transitLive?.desc || '정류장/역 기반 경로 조회', time:transitLive?.time || '조회', minutes:transitLive?.minutes ?? 999 }
      ];
    }
    return [
      { mode:'walk', icon:'🚶', title:'도보', desc:walkLive?.desc || fallbackWalk.desc, time:walkLive?.time || fallbackWalk.time, minutes:walkLive?.minutes ?? fallbackWalk.minutes },
      { mode:'transit', icon:'🚇', title:'대중교통', desc:transitLive?.desc || '역/정류장 승하차 정보 조회', time:transitLive?.time || '조회', minutes:transitLive?.minutes ?? 999 },
      { mode:'taxi', icon:'🚕', title:'택시', desc:taxiLive?.desc || '가까운 승차 지점 호출 · 교통 상황 반영 예정', time:taxiLive?.time || '조회', minutes:taxiLive?.minutes ?? 999 }
    ];
  }

  function getFastestMode(stop, i) {
    return getModeOptions(stop, i).reduce((best, opt) => opt.minutes < best.minutes ? opt : best);
  }
  
  function getStopExpenseTotal() {
    return Object.values(stopExpenses).reduce((sum, e) => sum + e.amountKrw, 0);
  }
  
  function getTotalSpent() {
    return expenses.reduce((sum, e) => sum + e.amountKrw, 0) + getStopExpenseTotal();
  }

  function getCategoryBreakdown() {
    const stopLogs = Object.values(stopExpenses);
    const allExpenses = [...expenses, ...stopLogs];
    const spent = allExpenses.reduce((sum, e) => sum + e.amountKrw, 0);
    return BUDGET_CATEGORIES.map(category => {
      const amount = allExpenses
        .filter(expense => expense.cat === category.key)
        .reduce((sum, expense) => sum + expense.amountKrw, 0);
      return {
        ...category,
        amount,
        pct: spent > 0 ? Math.round((amount / spent) * 100) : 0,
      };
    });
  }
  
  function getTransportPlan(stop, i) {
    const fastest = getFastestMode(stop, i);
    return {
      rec:fastest.title,
      detail:fastest.time,
      options:getModeOptions(stop, i).map(opt => `${opt.title} ${opt.time}`)
    };
  }
  
  function getTransitDemoOptions(stop, i) {
    const key = transitPanelKey(schedule[activeIdx].day, i);
    const live = transitResults[key];
    if (transitLoadingKey === key) {
      return getModeOptions(stop, i).map(opt => opt.mode === 'transit' ? {
        ...opt,
        loading:true,
        detail:[{ icon:'🚇', title:'대중교통 경로 조회 중', desc:'Google Transit 데이터로 승차 위치와 노선을 확인하고 있습니다.', time:'...' }]
      } : opt);
    }
    if (live) {
      return getModeOptions(stop, i).map(opt => opt.mode === 'transit' ? { ...opt, detail:live } : opt);
    }
    return getModeOptions(stop, i);
  }
  
  function getTransitDetailOptions(stop, i) {
    const key = transitPanelKey(schedule[activeIdx].day, i);
    const live = transitResults[key];
    if (transitLoadingKey === key) {
      return [
        { icon:'🚇', title:'대중교통 경로 조회 중', desc:'Google Transit 데이터로 승차 위치와 노선을 확인하고 있습니다.', time:'...' }
      ];
    }
    return live || [];
  }
  
  function getRouteInfo(stops, stop, i) {
    const stopText = `${stop.name || ''} ${stop.badge || ''}`;
    const isReturn = /복귀/i.test(stopText);
    const firstStopName = stops[0]?.name || '숙소';
    const hotelName = isReturn ? (stop.name || firstStopName).replace(/\s*복귀$/, '') : firstStopName;
    const origin = i === 0 ? hotelName : (stops[i - 1]?.name || '이전 장소');
    const destination = i === 0 ? '일정 시작' : isReturn ? (stop.name || '숙소').replace(/\s*복귀$/, '') : stop.name;
    const label = isReturn ? '복귀 이동' : i === 0 ? '첫 이동' : '장소 간 이동';
    return { origin, destination, label };
  }
  
  function getHotelReturnStop(stops) {
    const first = stops[0] || {};
    const hotelName = first.name || '숙소';
    return {
      t:'21:30',
      name:`${hotelName} 복귀`,
      badge:'숙소 복귀',
      kind:'rest',
      desc:'하루 일정을 마치고 숙소로 돌아옵니다. 다음 날 이동을 위해 복귀 시간을 고정합니다.',
      tags:['숙소 도착','일정 종료'],
      safety:'safe'
    };
  }
  
  function getDayStops(stops) {
    const last = stops[stops.length - 1] || {};
    const alreadyReturns = /숙소|hotel|Hotel|복귀/i.test(`${last.name || ''} ${last.badge || ''}`);
    return alreadyReturns ? stops : [...stops, getHotelReturnStop(stops)];
  }
  
  function getMapPoints(base) {
    if (cityData[base]?.mapPoints?.length) return cityData[base].mapPoints;
    const pts = {
      barcelona:[{lat:41.3932,lng:2.1699},{lat:41.3917,lng:2.1649},{lat:41.3915,lng:2.1686},{lat:41.3852,lng:2.1809},{lat:41.3927,lng:2.1587},{lat:41.3950,lng:2.1702}],
      madrid:[{lat:40.4128,lng:-3.7002},{lat:40.4138,lng:-3.6921},{lat:40.4154,lng:-3.7089},{lat:40.4153,lng:-3.6844},{lat:40.4169,lng:-3.7035}],
      sevilla:[{lat:37.3861,lng:-5.9928},{lat:37.3826,lng:-5.9910},{lat:37.3891,lng:-5.9945},{lat:37.3761,lng:-5.9866}],
      granada:[{lat:37.1773,lng:-3.5986},{lat:37.1760,lng:-3.5880},{lat:37.1808,lng:-3.6003},{lat:37.1722,lng:-3.5967}],
      malaga:[{lat:36.7213,lng:-4.4217},{lat:36.7196,lng:-4.4189},{lat:36.7253,lng:-4.4176},{lat:36.7115,lng:-4.3923}],
      valencia:[{lat:39.4699,lng:-0.3763},{lat:39.4539,lng:-0.3688},{lat:39.4736,lng:-0.3790},{lat:39.4560,lng:-0.3214}],
      bilbao:[{lat:43.2630,lng:-2.9350},{lat:43.2592,lng:-2.9284},{lat:43.2604,lng:-2.9466},{lat:43.2556,lng:-2.9237}],
      sansebastian:[{lat:43.3183,lng:-1.9812},{lat:43.3226,lng:-1.9753},{lat:43.3212,lng:-1.9880},{lat:43.3099,lng:-2.0016}],
      zaragoza:[{lat:41.6561,lng:-0.8773},{lat:41.6584,lng:-0.8752},{lat:41.6502,lng:-0.8831},{lat:41.6601,lng:-0.8705}],
      return:[{lat:41.6561,lng:-0.8773},{lat:41.2971,lng:-0.9170}]
    };
    return pts[base] || pts.barcelona;
  }
  
  function getRouteSegment(base, stopIdx) {
    const routePoints = [...getMapPoints(base), getMapPoints(base)[0]];
    const selectedIdx = Math.max(0, Math.min(stopIdx, routePoints.length - 1));
    return selectedIdx === 0 ? [routePoints[0]] : [routePoints[selectedIdx - 1], routePoints[selectedIdx]];
  }
  
  function updateActiveRouteSummary(dayStops) {
    const stop = dayStops[activeStopIdx];
    if (!stop) return;
    const transport = getTransportPlan(stop, activeStopIdx);
    const route = getRouteInfo(dayStops, stop, activeStopIdx);
    setRoute(`${route.origin} → ${route.destination}`, `${transport.rec} ${transport.detail}`);
  }

  function buildGoogleMapsRouteUrl() {
    const s = schedule[activeIdx];
    const dayStops = getDayStops(cityData[s.base].stops);
    const stop = dayStops[activeStopIdx];
    if (!stop) return null;
    const route = getRouteInfo(dayStops, stop, activeStopIdx);
    const p = getRouteSegment(s.base, activeStopIdx);
    const modeMap = { TRANSIT: 'transit', WALKING: 'walking', TAXI: 'driving' };
    const travelmode = modeMap[selectedTravelMode] || 'transit';

    const origin = p.length >= 2
      ? `${p[0].lat},${p[0].lng}`
      : encodeURIComponent(route.origin);
    const destination = p.length >= 2
      ? `${p[p.length - 1].lat},${p[p.length - 1].lng}`
      : encodeURIComponent(route.destination);

    return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=${travelmode}`;
  }

  function haversineMeters(a, b) {
    const R = 6371000;
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLng = (b.lng - a.lng) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;
    const x = Math.sin(dLat / 2) ** 2
      + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  }

  function formatDistance(meters) {
    if (!Number.isFinite(meters)) return '';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  }

  function getActiveEmergencyPoint() {
    const s = schedule[activeIdx];
    if (!s) return null;
    const selectedRoute = getRouteSegment(s.base, activeStopIdx);
    const points = selectedRoute.filter(pt => Number.isFinite(pt?.lat) && Number.isFinite(pt?.lng));
    if (!points.length) return null;
    const center = points.reduce((acc, pt) => ({ lat: acc.lat + pt.lat, lng: acc.lng + pt.lng }), { lat: 0, lng: 0 });
    return {
      lat: center.lat / points.length,
      lng: center.lng / points.length,
      routeLabel: points.length > 1 ? '선택 경로 중간 지점' : '현재 활성 카드 위치',
    };
  }

  async function loadConsulateInfo(destination) {
    const el = document.getElementById('consulateInfo');
    if (!el) return;

    try {
      const apiBase = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');
      const res = await fetch(`${apiBase}/api/consulate?destination=${encodeURIComponent(destination)}`);
      if (!res.ok) throw new Error();
      const data = await res.json();

      const mapsUrl = data.lat && data.lng
        ? `https://www.google.com/maps?q=${data.lat},${data.lng}`
        : null;
      const mapLink = mapsUrl
        ? ` · <a href="${mapsUrl}" target="_blank" rel="noopener" class="mi-map-link">지도 연결</a>`
        : '';

      el.innerHTML = `
        <div class="mi-row">
          <strong>🏛 ${escapeHtml(data.name)}</strong>
          <span>${escapeHtml(data.phone)}${mapLink}</span>
        </div>
        ${data.emergencyPhone ? `<div class="mi-row"><strong>🚨 긴급 영사</strong><span>${escapeHtml(data.emergencyPhone)} (24h)</span></div>` : ''}
        ${data.callCenter ? `<div class="mi-row"><strong>📞 영사콜센터</strong><span>${escapeHtml(data.callCenter)}</span></div>` : ''}`;
    } catch {
      el.innerHTML = `<div class="mi-row"><strong>🏛 한국 영사관</strong><span class="mi-muted">정보를 불러올 수 없습니다</span></div>`;
    }
  }

  async function loadEmergencyNearbyInfo() {
    const el = document.getElementById('emergencyNearbyInfo');
    if (!el) return;

    const point = getActiveEmergencyPoint();
    if (!point) {
      el.innerHTML = `<div class="mi-row"><strong>📍 주변 응급시설</strong><span class="mi-muted">현재 위치 좌표가 없습니다</span></div>`;
      return;
    }

    try {
      const data = await apiGet(`/maps/emergency-places?lat=${point.lat}&lng=${point.lng}&radius=${EMERGENCY_RADIUS_METERS}`);
      emergencyMapUrl = data.mapUrl || `https://www.google.com/maps/search/emergency+services/@${point.lat},${point.lng},14z`;
      const groups = data.groups || [];
      const total = groups.reduce((sum, group) => sum + (group.places?.length || 0), 0);
      const summary = groups
        .map(group => `${group.label} ${group.places?.length || 0}`)
        .join(' · ');
      const rows = groups
        .flatMap(group => (group.places || []).slice(0, 2).map(place => ({ ...place, group })))
        .slice(0, 5)
        .map(place => {
          const distance = formatDistance(haversineMeters(point, { lat: Number(place.lat), lng: Number(place.lng) }));
          const map = place.googleMapsUri
            ? ` · <a href="${place.googleMapsUri}" target="_blank" rel="noopener" class="mi-map-link">연결</a>`
            : '';
          return `<div class="mi-row"><strong>${escapeHtml(place.categoryLabel)} · ${escapeHtml(place.name)}</strong><span>${distance}${map}</span></div>`;
        })
        .join('');

      el.innerHTML = `
        <div class="mi-safe">
          <strong>${point.routeLabel} 반경 ${(EMERGENCY_RADIUS_METERS / 1000).toFixed(0)}km</strong>
          <span>${total ? `${summary} 있습니다` : '조회된 경찰서·소방서·병원이 없습니다'}</span>
        </div>
        ${rows || '<div class="mi-row"><strong>응급시설</strong><span class="mi-muted">근처 시설 없음</span></div>'}
        <button class="mi-map-btn" data-action="openEmergencyMap">지도보기</button>`;
    } catch {
      el.innerHTML = `<div class="mi-row"><strong>📍 주변 응급시설</strong><span class="mi-muted">정보를 불러올 수 없습니다</span></div>`;
    }
  }
  
  function cleanStepText(html) {
    const div = document.createElement('div');
    div.innerHTML = html || '';
    return div.textContent.replace(/\s+/g, ' ').trim();
  }
  
  function latLngLiteral(latLng) {
    if (!latLng) return null;
    return { lat: latLng.lat(), lng: latLng.lng() };
  }
  
  function formatTransitFare(route) {
    if (route.fare?.text) return route.fare.text;
    return '요금 정보 없음';
  }
  
  function parseDurationMinutes(text) {
    const hours = text?.match(/(\d+)\s*시간/);
    const mins = text?.match(/(\d+)\s*분/);
    return (hours ? parseInt(hours[1], 10) * 60 : 0) + (mins ? parseInt(mins[1], 10) : 0);
  }
  
  function getTransitIcon(vehicleName) {
    if (/버스|bus/i.test(vehicleName)) return '🚌';
    if (/트램|tram|light rail/i.test(vehicleName)) return '🚊';
    if (/기차|train|rail/i.test(vehicleName)) return '🚆';
    if (/지하철|subway|metro/i.test(vehicleName)) return '🚇';
    return '🚇';
  }
  
  function formatTransitResult(result) {
    const route = result.routes?.[0];
    const leg = route?.legs?.[0];
    if (!leg) return null;
    const fareText = formatTransitFare(route);
    const options = leg.steps.map((step, idx) => {
      const stepRoute = {
        stepIdx:idx,
        path:step.path?.map(latLngLiteral).filter(Boolean) || [],
        start:latLngLiteral(step.start_location),
        end:latLngLiteral(step.end_location),
        mode:step.travel_mode
      };
      if (step.travel_mode === 'TRANSIT' && step.transit) {
        const line = step.transit.line;
        const vehicle = line.vehicle?.name || '대중교통';
        const shortName = line.short_name || line.name || vehicle;
        const depart = step.transit.departure_stop?.name || '승차 정류장';
        const arrive = step.transit.arrival_stop?.name || '하차 정류장';
        const headsign = step.transit.headsign || '';
        const stopCount = step.transit.num_stops ? `${step.transit.num_stops}개 정류장` : '';
        const departTime = step.transit.departure_time?.text || '';
        const arriveTime = step.transit.arrival_time?.text || '';
        const meta = [
          headsign ? `${headsign} 방면` : '',
          stopCount,
          departTime && arriveTime ? `${departTime} → ${arriveTime}` : '',
          fareText !== '요금 정보 없음' ? fareText : ''
        ].filter(Boolean);
        return {
          icon:getTransitIcon(vehicle),
          title:`${vehicle} ${shortName}`,
          desc:`${depart}에서 승차 · ${arrive}에서 하차`,
          time:step.duration?.text || '',
          meta,
          route:stepRoute
        };
      }
      const walkTo = cleanStepText(step.instructions);
      return {
        icon:'🚶',
        title:'도보 이동',
        desc:walkTo || '정류장까지 이동',
        time:step.duration?.text || '',
        meta:[step.distance?.text || '', step.duration?.text || ''].filter(Boolean),
        route:stepRoute
      };
    });
    options.unshift({
      icon:'💳',
      title:`총 ${leg.duration?.text || '시간 정보 없음'}`,
      desc:`${leg.distance?.text || '거리 정보 없음'} · ${fareText}`,
      time:leg.departure_time?.text || '출발',
      meta:[
        leg.departure_time?.text && leg.arrival_time?.text ? `${leg.departure_time.text} → ${leg.arrival_time.text}` : '',
        `${options.filter(opt => opt.route?.mode === 'TRANSIT').length}개 대중교통 구간`
      ].filter(Boolean),
      route:{
        stepIdx:null,
        path:leg.steps.flatMap(step => step.path?.map(latLngLiteral).filter(Boolean) || []),
        start:latLngLiteral(leg.start_location),
        end:latLngLiteral(leg.end_location),
        mode:'TRANSIT_SUMMARY'
      }
    });
    return options;
  }
  
  function formatSimpleRouteResult(result, mode) {
    const leg = result.routes?.[0]?.legs?.[0];
    if (!leg) return null;
    const title = mode === 'taxi' ? '택시' : '도보';
    const icon = mode === 'taxi' ? '🚕' : '🚶';
    const distance = leg.distance?.text || '거리 정보 없음';
    const duration = leg.duration?.text || '시간 정보 없음';
    return {
      mode,
      icon,
      title,
      desc:`${duration} · ${distance}`,
      time:duration,
      minutes:parseDurationMinutes(duration) || 999,
      route:{
        stepIdx:null,
        path:leg.steps.flatMap(step => step.path?.map(latLngLiteral).filter(Boolean) || []),
        start:latLngLiteral(leg.start_location),
        end:latLngLiteral(leg.end_location),
        mode:mode === 'taxi' ? 'DRIVING' : 'WALKING'
      }
    };
  }
  
  function requestSimpleRoute(stopIdx, mode) {
    const s = schedule[activeIdx];
    const key = modeResultKey(s.day, stopIdx, mode);
    const p = getRouteSegment(s.base, stopIdx);
    if (!window.google || !google.maps?.DirectionsService || p.length < 2) return;
    const directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin:p[0],
      destination:p[1],
      travelMode:mode === 'taxi' ? google.maps.TravelMode.DRIVING : google.maps.TravelMode.WALKING
    }, (result, status) => {
      const formatted = status === 'OK' && result ? formatSimpleRouteResult(result, mode) : null;
      if (formatted) routeModeResults[key] = formatted;
      renderTL();
      refreshMap();
    });
  }
  
  function requestTransitRoute(stopIdx) {
    const s = schedule[activeIdx];
    const key = transitPanelKey(s.day, stopIdx);
    const p = getRouteSegment(s.base, stopIdx);
    if (!window.google || !google.maps?.DirectionsService || p.length < 2) {
      transitResults[key] = [
        { icon:'ℹ', title:'대중교통 조회 불가', desc:'출발/도착지가 같은 기준점이거나 Google Maps가 아직 준비되지 않았습니다.', time:'-' }
      ];
      renderTL();
      return;
    }
  
    transitLoadingKey = key;
    renderTL();
    const directionsService = new google.maps.DirectionsService();
    directionsService.route({
      origin:p[0],
      destination:p[1],
      travelMode:google.maps.TravelMode.TRANSIT,
      transitOptions:{ departureTime:new Date() }
    }, (result, status) => {
      transitLoadingKey = '';
      const formatted = status === 'OK' && result ? formatTransitResult(result) : null;
      transitResults[key] = formatted || [
        { icon:'ℹ', title:'대중교통 경로 없음', desc:`이 구간은 Google Transit 응답이 없습니다. 상태: ${status}`, time:'-' }
      ];
      const summary = formatted?.[0];
      if (summary) {
        routeModeResults[modeResultKey(s.day, stopIdx, 'transit')] = {
          mode:'transit',
          icon:'🚇',
          title:'대중교통',
          desc:summary.desc,
          time:summary.title.replace(/^총\s*/, ''),
          minutes:parseDurationMinutes(summary.title) || 999,
          route:summary.route
        };
      }
      openTransitKey = key;
      renderTL();
      refreshMap();
    });
  }
  
  /* ── 도시 accordion 렌더 ── */
  function renderCityAccordion() {
    const activeGroup = cityGroups.find(g => g.indices.includes(activeIdx));
    const totalDays = schedule.length;
    const activeDay = schedule[activeIdx].day;
    const progress = Math.round((activeDay / totalDays) * 100);

    if (travelData.isGenerated) {
      document.getElementById('cityAccordion').innerHTML = `
        <div class="city-summary">
          <div class="city-summary-top">
            <div class="city-summary-day">D${String(activeDay).padStart(2,'0')} <span>/ ${totalDays}</span></div>
            <div class="city-summary-copy">전체 일정</div>
          </div>
          <div class="city-progress" aria-label="여행 진행률 ${progress}%">
            <div class="city-progress-fill" style="width:${progress}%"></div>
          </div>
        </div>
        <div class="day-nav-list">
          ${schedule.map((s, idx) => {
            const d = cityData[s.base];
            const cls = ['day-nav-btn',
              idx === activeIdx ? 'active' : '',
              s.done ? 'done' : '',
              s.today ? 'today' : '',
            ].filter(Boolean).join(' ');
            return `
              <button class="${cls}" data-idx="${idx}">
                <span class="day-nav-num">D${String(s.day).padStart(2,'0')}</span>
                <span class="day-nav-info">
                  <strong>${d.title}</strong>
                  <span>${d.stops.length}개 일정</span>
                </span>
              </button>`;
          }).join('')}
        </div>`;

      document.querySelectorAll('.day-nav-btn[data-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          activeIdx = parseInt(btn.dataset.idx, 10);
          syncDayView();
        });
      });
      return;
    }
  
    const cityHtml = cityGroups.map((g, gi) => {
      const isOpen = g === activeGroup;
      const stayDays = g.indices.length;
      return `
        <div class="city-group">
          <button class="city-row${isOpen ? ' active' : ''}" data-group="${g.id}">
            <div class="city-num">${String(gi + 1).padStart(2,'0')}</div>
            <div class="city-info"><strong>${g.name}</strong><span>${g.range}</span></div>
            <div class="city-meta">
              <span class="city-duration">${stayDays}일</span>
              <span class="city-wx">${g.wx}</span>
            </div>
          </button>
          <div class="city-days${isOpen ? ' open' : ''}">
            ${g.indices.map(idx => {
              const s = schedule[idx];
              const cls = ['city-day',
                idx === activeIdx ? 'active' : '',
                s.done  ? 'done'  : '',
                s.today ? 'today' : '',
              ].filter(Boolean).join(' ');
              return `<button class="${cls}" data-idx="${idx}">D${String(s.day).padStart(2,'0')}</button>`;
            }).join('')}
          </div>
        </div>`;
    }).join('');
  
    document.getElementById('cityAccordion').innerHTML = `
      <div class="city-summary">
        <div class="city-summary-top">
          <div class="city-summary-day">D${String(activeDay).padStart(2,'0')} <span>/ ${totalDays}</span></div>
          <div class="city-summary-copy">${cityGroups.length}개 구간</div>
        </div>
        <div class="city-progress" aria-label="여행 진행률 ${progress}%">
          <div class="city-progress-fill" style="width:${progress}%"></div>
        </div>
      </div>
      ${cityHtml}`;
  
    document.querySelectorAll('[data-group]').forEach(btn => {
      btn.addEventListener('click', () => {
        const g = cityGroups.find(g => g.id === btn.dataset.group);
        if (!g) return;
        const todayIdx = g.indices.find(i => schedule[i].today);
        activeIdx = todayIdx !== undefined ? todayIdx : g.indices[0];
        syncDayView();
      });
    });
  
    document.querySelectorAll('.city-day[data-idx]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        activeIdx = parseInt(btn.dataset.idx);
        syncDayView();
      });
    });
  }
  
  function renderTL() {
    const s = schedule[activeIdx];
    const d = cityData[s.base];
    const statusLabel = s.today ? 'LIVE' : s.done ? 'DONE' : 'UPCOMING';
    document.getElementById('tlKicker').textContent = `DAY ${String(s.day).padStart(2,'0')} · ${statusLabel}`;
    document.getElementById('tlTitle').textContent = d.title;
    document.getElementById('tlDesc').textContent = d.desc;
    const dayStops = getDayStops(d.stops);
    activeStopIdx = Math.max(0, Math.min(activeStopIdx, dayStops.length - 1));
    document.getElementById('tl').innerHTML = dayStops.map((stop, i) => {
      const transport = getTransportPlan(stop, i);
      const route = getRouteInfo(dayStops, stop, i);
      const transitKey = transitPanelKey(s.day, i);
      const transitOpen = openTransitKey === transitKey;
      const transitOptions = getTransitDemoOptions(stop, i);
      const transitDetails = getTransitDetailOptions(stop, i);
      const detailOpen = i === activeStopIdx && selectedTravelMode === 'TRANSIT' && transitDetails.length > 0;
      const activeDetailStep = i === activeStopIdx ? activeTransitStepIdx : null;
      const activeMode = i === activeStopIdx ? selectedTravelMode : '';
      return `
      <div class="tl-node">
        <div class="tl-t">${stop.t}</div>
        <div class="tl-axis"><span class="tl-dot ${stop.kind}${i === activeStopIdx ? ' now' : ''}"></span></div>
        <div>
          <div class="tl-card${i === activeStopIdx ? ' active' : ''}${transitOpen ? ' transit-open' : ''}" data-stop-idx="${i}">
            <div class="tl-card-top">
              <h3>${stop.name}</h3>
              <span class="tl-badge ${stop.kind}">${stop.badge}</span>
            </div>
            <p>${localizeMoneyText(stop.desc)}</p>
            <div class="tl-tags">
              ${stop.tags.map(t=>`<span class="tl-tag">${localizeMoneyText(t)}</span>`).join('')}
              ${stop.safety==='warn'?'<span class="tl-tag warn">⚠ 야간 주의</span>':''}
            </div>
            <div class="tl-transport">
              <div class="tl-route-flow">
                <div class="tl-route-place">
                  <span class="tl-route-label">출발</span>
                  <span class="tl-route-name">${route.origin}</span>
                </div>
                <div class="tl-route-mid">
                  <div class="tl-route-arrow">→</div>
                  <div class="tl-transport-main">
                    <span class="tl-transport-label">${route.label}</span>
                    <div class="tl-transport-rec">${transport.rec} <span>${transport.detail}</span></div>
                  </div>
                  <button class="tl-transit-toggle" data-transit-toggle="${transitKey}">${transitOpen ? '이동수단 접기' : '이동수단 보기'}</button>
                </div>
                <div class="tl-route-place dest">
                  <span class="tl-route-label">도착</span>
                  <span class="tl-route-name">${route.destination}</span>
                </div>
              </div>
              <div class="tl-transit-panel">
                <div class="tl-transit-inner">
                  <div class="tl-transit-list">
                    ${transitOptions.map((opt, oi) => opt.mode === 'transit' ? `
                      <div class="tl-transit-option has-detail${activeMode === 'TRANSIT' ? ' active' : ''}${detailOpen ? ' detail-open' : ''}" data-transit-step="${oi}" data-mode="${opt.mode}">
                        <div class="tl-transit-option-head">
                          <div class="tl-transit-mode">${opt.icon}</div>
                          <div class="tl-transit-main">
                            <strong>${opt.title}</strong>
                            <span>${opt.desc}</span>
                          </div>
                          <div class="tl-transit-time">${opt.time}</div>
                        </div>
                        <div class="tl-transit-detail">
                          <div class="tl-transit-detail-inner">
                            ${transitDetails.map((detail, di) => `
                              <div class="tl-transit-step${activeDetailStep === di ? ' active' : ''}" data-transit-detail-step="${di}">
                                <div class="tl-transit-mode">${detail.icon}</div>
                                <div class="tl-transit-main">
                                  <strong>${detail.title}</strong>
                                  <span>${detail.desc}</span>
                                  ${detail.meta?.length ? `<div class="tl-transit-meta">${detail.meta.map(m => `<span>${m}</span>`).join('')}</div>` : ''}
                                </div>
                                <div class="tl-transit-time">${detail.time}</div>
                              </div>`).join('')}
                          </div>
                        </div>
                      </div>` : `
                      <div class="tl-transit-option${(activeMode === 'WALKING' && opt.mode === 'walk') || (activeMode === 'TAXI' && opt.mode === 'taxi') ? ' active' : ''}" data-transit-step="${oi}" data-mode="${opt.mode || ''}">
                        <div class="tl-transit-mode">${opt.icon}</div>
                        <div class="tl-transit-main"><strong>${opt.title}</strong><span>${opt.desc}</span></div>
                        <div class="tl-transit-time">${opt.time}</div>
                      </div>`).join('')}
                  </div>
                </div>
              </div>
            </div>
            <div class="tl-expense">
              <label for="stopExp${s.day}-${i}">지출액</label>
              <input id="stopExp${s.day}-${i}" data-stop-expense="${i}" type="number" inputmode="decimal" min="0" placeholder="0" value="${stopExpenses[stopExpenseKey(s.day, i)] ? stopExpenses[stopExpenseKey(s.day, i)].amountLocal : ''}">
              <span>${exchangeRate.currency}</span>
              ${i < dayStops.length - 1 ? `<button class="tl-next-btn" type="button" data-next-stop="${i + 1}">다음 일정</button>` : ''}
            </div>
            ${stop.mealReroute?`<div class="reroute-drop" id="mrDrop${i}"><strong>식당 대체 후보</strong><p>루트 420m 이내, 평균 ${formatEurAsKrw(19)} 타파스 바로 변경.</p><div class="reroute-acts"><button class="rd-yes" data-action="applyMeal">적용</button><button class="rd-no" data-action="restore">기존 유지</button></div></div>`:''}
            ${stop.safeReroute?`<div class="reroute-drop" id="srDrop${i}"><strong>안전 우회 경로</strong><p>6분 추가. 대로변, 사고 이력 없음.</p><div class="reroute-acts"><button class="rd-yes" data-action="safeRoute">우회 적용</button><button class="rd-no" data-action="restore">기존 유지</button></div></div>`:''}
          </div>
        </div>
      </div>`;
    }).join('');
  
    updateActiveRouteSummary(dayStops);
  
    document.querySelectorAll('.tl-card[data-stop-idx]').forEach(card => {
      card.addEventListener('click', e => {
        if (e.target.closest('button, input, select, textarea')) return;
        selectStop(parseInt(card.dataset.stopIdx, 10));
      });
    });

    document.querySelectorAll('[data-next-stop]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        selectStop(parseInt(btn.dataset.nextStop, 10));
      });
    });
  
    document.querySelectorAll('[data-transit-toggle]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        openTransitKey = openTransitKey === btn.dataset.transitToggle ? '' : btn.dataset.transitToggle;
        activeStopIdx = parseInt(btn.closest('.tl-card').dataset.stopIdx, 10);
        renderTL();
        refreshMap();
      });
    });
  
    document.querySelectorAll('[data-transit-step]').forEach(option => {
      option.addEventListener('click', e => {
        e.stopPropagation();
        activeStopIdx = parseInt(option.closest('.tl-card').dataset.stopIdx, 10);
        const key = transitPanelKey(s.day, activeStopIdx);
        const mode = option.dataset.mode;
        openTransitKey = key;
        if (mode === 'transit' && !transitResults[key]) {
          activeTransitStepIdx = null;
          selectedTravelMode = 'TRANSIT';
          requestTransitRoute(activeStopIdx);
          return;
        }
        selectedTravelMode = mode === 'transit' ? 'TRANSIT' : mode === 'taxi' ? 'TAXI' : 'WALKING';
        activeTransitStepIdx = null;
        if (mode === 'taxi' && !routeModeResults[modeResultKey(s.day, activeStopIdx, mode)]) {
          requestSimpleRoute(activeStopIdx, mode);
          return;
        }
        renderTL();
        refreshMap();
      });
    });
  
    document.querySelectorAll('[data-transit-detail-step]').forEach(option => {
      option.addEventListener('click', e => {
        e.stopPropagation();
        activeStopIdx = parseInt(option.closest('.tl-card').dataset.stopIdx, 10);
        selectedTravelMode = 'TRANSIT';
        activeTransitStepIdx = parseInt(option.dataset.transitDetailStep, 10);
        renderTL();
        refreshMap();
      });
    });
  }
  
  function renderExp() {
    const colors = Object.fromEntries(BUDGET_CATEGORIES.map(category => [category.key, category.color]));
    const stopLogs = Object.values(stopExpenses);
    const logs = [...stopLogs, ...expenses];
    document.getElementById('expLog').innerHTML = logs.length
      ? logs.map(e =>
        `<div class="exp-log-item"><div class="exp-log-left"><span class="exp-cat-dot" style="background:${colors[e.cat]}"></span><span class="exp-log-name">${e.name}</span></div><span class="exp-log-amt${e.over?' over':''}">${formatExpenseLogAmount(e)}</span></div>`
      ).join('')
      : '<div class="b-empty">아직 입력된 지출이 없습니다</div>';
  }

  function renderBudgetCategories() {
    const rows = document.getElementById('budgetCategoryRows');
    if (!rows) return;

    rows.innerHTML = getCategoryBreakdown().map(cat =>
      `<div class="b-row"><span class="b-icon">${cat.icon}</span><span class="b-name">${cat.label}</span><div class="b-bar"><div class="b-fill" style="width:${cat.pct}%;background:${cat.color}"></div></div><span class="b-val">${cat.pct}% · ${formatExpense(cat.amount)}</span></div>`
    ).join('');
  }
  
  function updateBudget() {
    const spent = getTotalSpent();
    const pct = total > 0 ? Math.min(100, (spent / total) * 100) : 0;
    document.getElementById('heroGaugeFill').style.width = pct + '%';
    document.getElementById('heroSpent').textContent = formatExpense(spent);
    document.getElementById('heroTotal').textContent = total ? `/ ${formatKrw(total)}` : '/ 예산 미설정';
    renderBudgetCategories();
  }

  function syncCurrencyUi() {
    const amountInput = document.getElementById('expAmt');
    if (amountInput) amountInput.placeholder = exchangeRate.currency ? `금액(${exchangeRate.currency})` : '통화 확인 중';
  }

  async function loadExchangeRate() {
    try {
      const destination = readGeneratedPlanResult()?.tripInfo?.country || travelData.destination;
      if (!destination) {
        syncCurrencyUi();
        return;
      }
      const data = await apiGet(`/exchange-rate?destination=${encodeURIComponent(destination)}`);
      exchangeRate = {
        currency: data.currency || 'KRW',
        rateToKrw: Number(data.rateToKrw) || 1,
        cached: Boolean(data.cached),
      };
      syncCurrencyUi();
      renderTL();
      renderExp();
      updateBudget();
    } catch {
      syncCurrencyUi();
    }
  }
  
  function updateFatigue(v) {
    fatigueVal = v;
    const r = 24, circ = 2 * Math.PI * r;
    const offset = circ - (v / 10) * circ;
    const ring = document.getElementById('fcRing');
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = v >= 8 ? 'var(--rose)' : v >= 6 ? 'var(--amber)' : 'var(--green)';
    document.getElementById('fcNum').textContent = v;
    const labels = { 1:'최상 컨디션', 2:'컨디션 좋음', 3:'약간 피로', 4:'적당히 피로', 5:'중간 피로', 6:'카페 휴식 추천', 7:'도보 줄이기', 8:'택시 추천', 9:'숙소 복귀 추천', 10:'일정 조정 필요' };
    document.getElementById('fcLabel').textContent = labels[v] || '';
  }
  
  let toastTimer;
  function showToast(icon, title, msg, type, actions) {
    clearTimeout(toastTimer);
    document.getElementById('toastIcon').textContent = icon;
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMsg').textContent = msg;
    const toast = document.getElementById('toast');
    toast.className = `toast show ${type}`;
    document.getElementById('toastActions').innerHTML = (actions||[]).map(a =>
      `<button class="ta-btn${a.primary?' primary':''}" data-action="${a.action}">${a.label}</button>`
    ).join('');
    toastTimer = setTimeout(() => toast.classList.remove('show'), 6000);
  }
  
  document.getElementById('toastClose').addEventListener('click', () => document.getElementById('toast').classList.remove('show'));
  
  function openModal(key) {
    const d = modalData[key];
    if (!d) return;
    activeModalKey = key;
    document.getElementById('modalTitle').textContent = d.title;
    document.getElementById('modalContent').innerHTML = typeof d.html === 'function' ? d.html() : d.html;
    document.getElementById('overlay').classList.add('show');
    if (typeof d.postOpen === 'function') d.postOpen();
  }
  function closeModal() {
    document.getElementById('overlay').classList.remove('show');
    activeModalKey = '';
  }

  function saveAlbumMemory() {
    const token = localStorage.getItem('tripHelperToken')
    if (!token) { closeModal(); return }  // 비로그인 시 그냥 닫기

    const dayStops = getDayStops(cityData[schedule[activeIdx]?.base]?.stops || [])
    const currentStop = dayStops[activeStopIdx]
    const planResult = (() => { try { return JSON.parse(sessionStorage.getItem('aiPlanResult') || '{}') } catch { return {} } })()

    const payload = {
      photoUrl:     albumPhotoUrl || null,
      memo:         albumMemo || null,
      locationName: currentStop?.name || null,
      dayNum:       schedule[activeIdx]?.day || 1,
      destination:  travelData.destination || '내 여행',
      planId:       planResult?.id || null,
    }

    const apiBase = ((import.meta.env.VITE_API_BASE || '') || '').replace(/\/$/, '')
    fetch(`${apiBase}/api/memories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(payload),
    })
      .then(r => r.json())
      .then(() => closeModal())
      .catch(() => closeModal())
  }
  document.getElementById('mClose').addEventListener('click', closeModal);
  document.getElementById('mConfirm').addEventListener('click', () => {
    if (activeModalKey === 'album') {
      saveAlbumMemory();
    } else {
      closeModal();
    }
  });
  document.getElementById('overlay').addEventListener('click', e => { if(e.target.id==='overlay') closeModal(); });
  
  function openMapModal() {
    document.getElementById('mapOverlay').classList.add('show');
    mapModalOpen = true;
    requestAnimationFrame(() => refreshMap());
  }
  function closeMapModal() {
    document.getElementById('mapOverlay').classList.remove('show');
    mapModalOpen = false;
  }
  document.getElementById('mapModalClose').addEventListener('click', closeMapModal);
  document.getElementById('mapOverlay').addEventListener('click', e => { if(e.target.id==='mapOverlay') closeMapModal(); });
  
  function setRoute(title, desc) {
    document.getElementById('routeTitle').textContent = title;
    document.getElementById('routeDesc').textContent = desc;
  }
  
  function handle(action) {
    switch(action) {
      case 'wxReroute':
        showToast('☔','오후 비 예보 감지','기존 루트에서 멀지 않은 실내 코스로 재경로할까요?','warn',[
          { label:'실내 루트 적용', action:'applyWx', primary:true },{ label:'무시', action:'_dismiss' }]); break;
      case 'applyWx':
        document.getElementById('toast').classList.remove('show');
        setRoute('실내 재경로: 피카소 미술관 우선','야외 산책 → 실내 코스. +9분');
        showToast('✓','실내 루트 적용됨','기존 관광 순서 유지. 야외 구간만 실내로 전환됩니다.','ok'); break;
      case 'safeRoute':
        document.querySelectorAll('[id^="srDrop"]').forEach(el => el.classList.add('open'));
        setRoute('안전 우회: Passeig de Gracia','최단 경로 +6분 · 사고 이력 없음 · 조명 충분');
        showToast('🛡','안전 우회 경로 적용','대로변으로 안내합니다.','ok'); break;
      case 'restore':
        document.querySelectorAll('.reroute-drop').forEach(el => el.classList.remove('open'));
        document.getElementById('mealReroute').classList.remove('open');
        updateActiveRouteSummary(getDayStops(cityData[schedule[activeIdx].base].stops));
        document.getElementById('toast').classList.remove('show'); break;
      case 'applyMeal':
        document.querySelectorAll('[id^="mrDrop"]').forEach(el => el.classList.remove('open'));
        document.getElementById('mealReroute').classList.remove('open');
        setRoute(`식당 변경: 평균 ${formatEurAsKrw(19)} 타파스 바 적용`,'루트 420m 이내 · 관광 순서 유지됨');
        showToast('✓','식당 변경 적용','기존 관광 루트와 크게 벗어나지 않는 대체 식당으로 조정되었습니다.','ok'); break;
      case 'fatigueReroute':
        showToast('◇',`피로도 ${fatigueVal}/10 — 루트 조정`,`도보를 줄이고 카페 휴식과 택시 구간을 늘린 루트로 바꿀까요?`,'warn',[
          { label:'적용', action:'applyFatigue', primary:true },{ label:'유지', action:'_dismiss' }]); break;
      case 'applyFatigue':
        document.getElementById('toast').classList.remove('show');
        setRoute('휴식 루트: 카페 40분 + 택시 구간','도보 -2km · 오후 카페 휴식 후 복귀');
        showToast('✓','휴식 루트 적용됨','관광 포인트 유지. 이동 방식과 중간 휴식만 조정됩니다.','ok'); break;
      case 'focusBudget':
        document.getElementById('budgetSec').scrollIntoView({ behavior:'smooth', block:'center' });
        setTimeout(() => document.getElementById('expAmt').focus(), 400); break;
      case 'openMapModal':
        openMapModal(); break;
      case 'routeGuide': {
        const url = buildGoogleMapsRouteUrl();
        if (url) window.open(url, '_blank', 'noopener');
        break;
      }
      case 'openEmergencyMap':
        if (emergencyMapUrl) window.open(emergencyMapUrl, '_blank', 'noopener');
        break;
      case '_dismiss': document.getElementById('toast').classList.remove('show'); break;
    }
  }
  
  document.getElementById('addExp').addEventListener('click', () => {
    const name = document.getElementById('expName').value.trim();
    const amountLocal = parseFloat(document.getElementById('expAmt').value) || 0;
    const cat = document.getElementById('expCat').value;
    if (!name || !amountLocal) return;
    const amountKrw = localToKrw(amountLocal);
    const over = cat === 'meal' && total > 0 && getTotalSpent() + amountKrw > total;
    expenses.unshift({ name, cat, amountLocal: +amountLocal.toFixed(2), amountKrw, currency: exchangeRate.currency, over });
    updateBudget();
    renderExp();
    document.getElementById('expName').value = '';
    document.getElementById('expAmt').value = '';
    if (over) {
      document.getElementById('mealReroute').classList.add('open');
      showToast('⚠️',`${formatLocalAmount(amountLocal)} 식사 초과`,'예산 범위 내 근처 식당으로 재조회할까요?','warn',[
        { label:'재조회', action:'_dismiss', primary:true },{ label:'무시', action:'_dismiss' }]);
    } else {
      const msg = total ? `남은 예산 ${formatExpense(Math.max(0, total - getTotalSpent()))}` : '카테고리 비중이 업데이트되었습니다';
      showToast('✓',`${formatLocalAmount(amountLocal)} 입력됨`,msg,'ok');
    }
  });
  
  document.addEventListener('change', e => {
    const input = e.target.closest('[data-stop-expense]');
    if (!input) return;
    const amountLocal = parseFloat(input.value) || 0;
    const s = schedule[activeIdx];
    const stopIdx = parseInt(input.dataset.stopExpense);
    const stop = cityData[s.base].stops[stopIdx];
    const key = stopExpenseKey(s.day, stopIdx);
    if (amountLocal <= 0) {
      delete stopExpenses[key];
    } else {
      const cat = stop.kind === 'meal' ? 'meal' : stop.kind === 'spot' ? 'entry' : 'transport';
      const amountKrw = localToKrw(amountLocal);
      const spentWithoutThis = getTotalSpent() - (stopExpenses[key]?.amountKrw || 0);
      stopExpenses[key] = {
        name: `${stop.name} 지출`,
        cat,
        amountLocal: +amountLocal.toFixed(2),
        amountKrw,
        currency: exchangeRate.currency,
        over: cat === 'meal' && total > 0 && spentWithoutThis + amountKrw > total
      };
    }
    updateBudget();
    renderExp();
  });
  
  document.getElementById('fcSlider').addEventListener('input', e => updateFatigue(parseInt(e.target.value)));
  
  document.addEventListener('click', e => {
    const m = e.target.closest('[data-modal]');
    if (m) { openModal(m.dataset.modal); return; }
    const sc = e.target.closest('[data-scroll]');
    if (sc) { document.getElementById(sc.dataset.scroll)?.scrollIntoView({ behavior:'smooth', block:'center' }); return; }
    const ac = e.target.closest('[data-action]');
    if (ac) { handle(ac.dataset.action); return; }
  });
  
  syncTripChrome();
  renderCityAccordion();
  renderTL();
  renderExp();
  updateBudget();
  syncCurrencyUi();
  loadExchangeRate();
  updateFatigue(6);
  
  function initMap() {
    if (!window.google) return;
    mapReady = true;
    requestSimpleRoute(activeStopIdx, 'walk');
    requestSimpleRoute(activeStopIdx, 'taxi');
    renderRouteMap('liveMap');
    if (mapModalOpen) renderRouteMap('modalMap');
  }
  
  function renderRouteMap(targetId) {
    const el = document.getElementById(targetId);
    if (!el || !window.google) return;
    el.innerHTML = '';
    const s = schedule[activeIdx];
    const activeStop = getDayStops(cityData[s.base].stops)[activeStopIdx];
    const selectedModeKey = selectedTravelMode === 'TAXI' ? 'taxi' : selectedTravelMode === 'WALKING' ? 'walk' : '';
    const modeRoute = selectedModeKey ? routeModeResults[modeResultKey(s.day, activeStopIdx, selectedModeKey)]?.route : null;
    const transitStep = activeTransitStepIdx !== null ? getTransitDetailOptions(activeStop, activeStopIdx)?.[activeTransitStepIdx]?.route : null;
    const selectedRoute = transitStep || modeRoute;
    const p = selectedRoute?.start && selectedRoute?.end ? [selectedRoute.start, selectedRoute.end] : getRouteSegment(s.base, activeStopIdx);
    const map = new google.maps.Map(el, {
      center:p[0], zoom:13,
      mapTypeControl:false, streetViewControl:false, fullscreenControl:false
    });
    const bounds = new google.maps.LatLngBounds();
    const labels = p.length === 1 ? ['숙'] : selectedRoute ? ['S', 'E'] : ['출', '도'];
    const colors = p.length === 1 ? ['#0BB97A'] : selectedRoute ? ['#F59E0B','#29ABE2'] : ['#0BB97A','#29ABE2'];
    p.forEach((pt,i) => {
      bounds.extend(pt);
      new google.maps.Marker({ position:pt, map,
        label:{ text:labels[i], color:'#fff', fontWeight:'800', fontSize:'10px' },
        icon:{ path:google.maps.SymbolPath.CIRCLE, scale:13, fillColor:colors[i]||'#29ABE2', fillOpacity:1, strokeColor:'#ffffff', strokeWeight:3 }
      });
    });
    if (p.length === 1) {
      map.setCenter(p[0]);
      map.setZoom(15);
    } else {
      map.fitBounds(bounds, 48);
    }
  
    const routeFallback = () => {
      const path = selectedRoute?.path?.length ? selectedRoute.path : p;
      path.forEach(pt => bounds.extend(pt));
      new google.maps.Polyline({ path, map, strokeColor:selectedRoute ? '#F59E0B' : '#29ABE2', strokeOpacity:.82, strokeWeight:4 });
      if (path.length > 1) map.fitBounds(bounds, 48);
    };
  
    if (selectedRoute) {
      routeFallback();
      return;
    }
  
    if (p.length < 2 || !google.maps.DirectionsService || !google.maps.DirectionsRenderer) {
      if (p.length >= 2) routeFallback();
      return;
    }
  
    const directionsService = new google.maps.DirectionsService();
    const directionsRenderer = new google.maps.DirectionsRenderer({
      map,
      suppressMarkers:true,
      preserveViewport:false,
      polylineOptions:{
        strokeColor:'#29ABE2',
        strokeOpacity:.82,
        strokeWeight:5
      }
    });
  
    directionsService.route({
      origin:p[0],
      destination:p[p.length - 1],
      waypoints:[],
      travelMode:selectedTravelMode === 'TAXI' ? google.maps.TravelMode.DRIVING : google.maps.TravelMode[selectedTravelMode] || google.maps.TravelMode.WALKING,
      transitOptions:selectedTravelMode === 'TRANSIT' ? { departureTime:new Date() } : undefined,
      optimizeWaypoints:false
    }, (result, status) => {
      if (status === 'OK' && result) {
        directionsRenderer.setDirections(result);
      } else {
        routeFallback();
      }
    });
  }
  window.initMap = initMap;
   if (window.google?.maps) {
    initMap();
  } else if (!document.getElementById(GOOGLE_MAP_SCRIPT_ID)) {
    const scriptEl = document.createElement('script');
    scriptEl.id = GOOGLE_MAP_SCRIPT_ID;
    scriptEl.src = GOOGLE_MAP_SCRIPT_SRC;
    scriptEl.async = true;
    scriptEl.defer = true;
    document.body.appendChild(scriptEl);
  }
   return () => {
    if (window.initMap === initMap) delete window.initMap;
  };
}
