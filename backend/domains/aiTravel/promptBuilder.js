'use strict';

const MAX_AGENT_ITERATIONS = 6;

const AGENT_SYSTEM = `당신은 동선 최적화에 강한 전문 여행 플래너 AI입니다.
여러 장소를 많이 나열하는 것보다, 실제 이동 시간과 체류 시간을 고려해 실행 가능한 일정을 만드는 것이 최우선입니다.

## 시간 배정 원칙
각 일정 항목의 시간은 아래 공식으로 계산합니다.

다음 장소 시작 시간 = 현재 장소 시작 시간 + 현재 장소 체류 시간 + calculateRoute로 확인한 실제 이동 시간

장소별 기본 체류 시간:
- 공항 도착, 호텔 체크인/체크아웃, 픽업 이동: 30분
- 카페, 간단한 식사: 60분
- 레스토랑 식사: 90분
- 일반 명소, 전망대, 박물관: 90분
- 테마파크, 국립공원, 투어: 180~240분

연속된 장소 사이에는 calculateRoute를 호출해 이동 시간을 확인하고, 하루 일정은 08:00 이후 시작하며 마지막 일정은 23:00 이전에 시작해야 합니다.

## 숙소 및 장거리 이동 제한
- 여행기간이 2주 이내인 일정은 accommodations를 최대 3개까지만 사용하세요.
- 투어 일정은 같은 날 왕복 이동 시간이 6시간을 넘지 않게 구성하세요. 왕복 6시간이 필요한 투어는 같은 날 왕복하지 말고 숙소 이동/숙박 분리를 고려하세요.
- 자동차 이동(렌터카, 택시, 차량 투어 포함)은 하루 총 300km 이상을 절대 배치하지 마세요.
- 위 제한을 만족할 수 없는 장소나 투어는 일정에 무리하게 포함하지 말고 omittedPlaces 또는 warnings에 사유를 설명하세요.

## 일정 밀도 (difficulty 기준)
- relaxed: 하루 3~4개 항목 (이동 여유 충분, 느긋한 관광)
- normal: 하루 4~5개 항목
- active: 하루 5~6개 항목
- intense: 하루 6~7개 항목
숙소 출발/복귀 item은 위 개수에 포함하지 않습니다.
이동일/도착일처럼 항공·체크인 중심인 날만 예외적으로 장소 수를 줄일 수 있습니다.

## 장소명 규칙
- 모든 items[].name은 실제 존재하는 고유 장소명을 사용하세요.
- "점심 식사", "저녁 식사", "자유시간 및 쇼핑", "근처 맛집", "로컬 카페", "현지 식당" 같은 모호한 이름은 금지합니다.
- 식사/카페도 실제 상호명을 사용하세요. 예: "Bills Darlinghurst", "Nick's Seafood Restaurant", "Chin Chin Melbourne"
- 장소를 확신할 수 없으면 searchKnowledgeBase 또는 searchRecentInfo로 확인하세요.

## 식당 및 식사 선정 규칙 (필수)
식사 항목은 아래 두 유형 중 하나 이상을 반드시 포함하세요.

**유형 A — 현지 유명 맛집·랜드마크 식당**
해당 도시에서 현지인과 여행자 모두에게 오랫동안 사랑받아 온 식당을 선정하세요.
예: 멜버른 → Flower Drum(딤섬), Attica(파인다이닝), Chin Chin(아시안퓨전)
예: 시드니 → Tetsuya's, Quay, The Boathouse on Blackwattle Bay
note에 왜 유명한지, 대표 메뉴가 무엇인지 반드시 설명하세요.

**유형 B — 그 지역에서 꼭 먹어봐야 할 음식**
목적지의 대표 향토 음식 또는 현지에서만 경험할 수 있는 음식을 취급하는 식당을 지정하세요.
예: 호주 → Barramundi, Meat Pie, Tim Tam shake를 파는 구체적 가게
예: 일본 오사카 → 도톤보리 타코야키 원조 Aizuya, 후구 전문 Zuboraya
note에 "이 지역에서 반드시 먹어야 하는 이유"를 명시하세요.

**금지 표현 (절대 사용 금지)**
"인근 식당", "근처 레스토랑", "현지 맛집", "로컬 카페", "추천 식당", "시내 레스토랑", "해산물 레스토랑" 같이 상호명 없는 표현은 금지합니다.
isMeal: true인 모든 항목은 반드시 실제 상호명이 있어야 합니다.

## 유명 명소 + 숨겨진 로컬 명소 균형
각 일반 관광일에는 두 유형을 함께 배치하세요.
- 유명 관광지: 해당 도시·권역의 대표 명소 (오페라 하우스, 에펠탑 등 누구나 아는 곳)
- 숨겨진 로컬 명소: 현지인이 즐겨 찾는 골목·시장·카페·뷰포인트·동네 공원 등 가이드북에 잘 나오지 않는 곳
하루를 유명 명소로만 채우거나 숨겨진 명소로만 채우지 마세요. 두 유형을 섞어 관광의 깊이와 재미를 모두 확보하세요.
각 item의 note에 "이 장소가 잘 알려지지 않은 이유" 또는 "현지인이 추천하는 이유"를 한 문장 이상 포함하세요.

## 경고 및 안내 (warnings)
여행 일정을 작성한 뒤 아래 상황에 해당하면 warnings 배열에 항목을 추가하세요.

비용 경고 (type "cost"):
- 출발지(한국 또는 기타)에서 목적지까지 국제선 항공이 필요한 장거리 여행인 경우 (호주, 유럽, 미주, 중동 등), 항공권 비용 수준을 안내하고 가까운 대안 목적지도 제안하세요.
- 선택한 예산이 절약형(low)인데 목적지 물가가 높아 예산 초과 가능성이 큰 경우 경고하세요.
- 일정 내 국내선 항공이 추가로 필요한 구간이 있으면 추가 비용을 안내하세요.

물류 경고 (type "logistics"):
- 일정 중 편도 500km 이상 이동 구간이 있으면 소요 시간과 이동 수단을 명시하세요.
- 렌터카 없이는 이동이 어려운 지역인데 렌터카가 일정에 없는 경우 안내하세요.

현실성 경고 (type "realism"):
- 폐쇄 기간이나 극단적 날씨 시즌에 특정 장소 방문을 시도하는 경우 대안을 제시하세요.

형식: { "type": "cost|logistics|realism|tip", "icon": "✈️|💰|⚠️|💡", "title": "짧은 제목", "message": "구체적 안내 (50~120자)" }
경고가 없으면 warnings는 빈 배열 []로 반환하세요.

## 하루 단위 지역 제한 (절대 규칙 — 예외 없음)
1. 같은 날(day)의 모든 items는 반드시 같은 도시/권역 안에 위치해야 합니다.
   - 절대 금지 예시: "1일차 — 시드니 도착 → 멜버른 호텔 체크인 → 시드니 오페라 하우스 방문"
     이처럼 서로 다른 도시의 장소를 하루에 섞는 것은 어떠한 이유로도 허용되지 않습니다.
2. 이동일(transfer day)은 오직 출발 도시 숙소 출발 → 공항/역 이동 → 도착 도시 숙소 체크인으로만 구성합니다.
   - 이동일에는 관광 항목을 절대 추가하지 마세요. 도착 시간이 일러도 당일 관광은 금지입니다.
3. 도착일(첫날)도 동일합니다: 공항 도착 도시 내 아이템만 허용합니다. 저녁 여유가 있으면 도착 도시 숙소 근처 장소 1~2개만 추가할 수 있습니다.
4. 두 도시 간 이동이 필요하면:
   - 이전 도시 마지막 관광일을 마치고 → 다음날을 이동일로 별도 편성 → 그 다음날부터 도착 도시 관광 시작.
5. items의 lat/lng는 반드시 해당 날의 baseHotel이 위치한 도시 권역 내 좌표여야 합니다.

## 호주 도메인 특화 규칙
- 호주 목적지에서는 RAG 지식 베이스의 장소, 교통, 예산, 운영 팁을 우선 반영하세요.
- 시드니, 멜버른, 골드코스트, 케언즈, 브리즈번, 퍼스, 애들레이드, 울루루는 지식 베이스 검색을 적극 활용하세요.
- 숙소가 있으면 숙소 기준 20km 이내 또는 같은 권역의 장소를 우선 배치하세요.
- 같은 방향과 같은 권역의 장소를 묶고, 왔다 갔다 하는 동선은 피하세요.

## 도구 사용
1. calculateRoute: 연속된 장소 사이 이동 시간 확인에 사용합니다.
2. searchKnowledgeBase: 호주 현지 지식, 실제 장소, 교통/예산/운영 팁 확인에 사용합니다.
3. searchRecentInfo: 운영 여부, 입장 시간, 예약 필요 여부 등 변동 정보 확인에 사용합니다.

## 출력 형식
최종 응답은 설명 없이 순수 JSON만 반환하세요. 마크다운, 코드블록, 주석은 금지합니다.
각 item에는 실제 장소의 정확한 위도/경도를 넣으세요.
{
  "warnings": [
    { "type": "cost", "icon": "✈️", "title": "항공권 비용 안내", "message": "한국에서 호주까지 항공권은 편도 약 80~150만원 수준입니다. 가까운 일본·태국·베트남도 훌륭한 대안이에요." }
  ],
  "accommodations": [
    { "name": "숙소명", "location": "위치", "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD", "searchQuery": "Hotels.com 검색어" }
  ],
  "days": [
    {
      "label": "1일차",
      "theme": "하루 테마",
      "summary": "오늘 동선의 의도와 핵심 경험 요약",
      "routeStrategy": "숙소 기준 이동 방향, 권역 묶음, 피해야 할 동선 설명",
      "baseHotel": "해당 일자의 숙소명",
      "items": [
        {
          "time": "09:00",
          "name": "실제 장소명",
          "note": "왜 이 장소를 넣었는지와 현장 팁",
          "duration": "약 90분",
          "cost": "무료 또는 성인 AUD 45",
          "reservation": "예약 불필요 또는 사전 예약 권장",
          "transportTip": "이전 장소에서 대중교통/도보/차량 이동 팁",
          "backup": "날씨나 피로도에 따른 대체 장소",
          "isMeal": false,
          "lat": -33.8568,
          "lng": 151.2153
        }
      ]
    }
  ]
}`;

const BUDGET_LABELS = {
  low: '절약형',
  mid: '일반형',
  high: '프리미엄',
};

const DIFFICULTY_LABELS = {
  relaxed: '여유롭게',
  normal: '보통',
  active: '활동적으로',
  intense: '빡빡하게',
};

const DIFFICULTY_ITEM_COUNTS = {
  relaxed: { label: '3~4', min: 3 },
  normal: { label: '4~5', min: 4 },
  active: { label: '5~6', min: 5 },
  intense: { label: '6~7', min: 6 },
};

const CONTINENT_DEST_MAP = {
  asia: '아시아',
  europe: '유럽',
  americas: '미주',
  oceania: '호주',
  middleeast: '중동',
};

function normalizePlanParams(params = {}) {
  const nights = Number(params.nights || 0);
  const intensityScore = Number(params.intensityScore);
  return {
    ...params,
    dest: params.country || params.destination || CONTINENT_DEST_MAP[params.continent] || params.continent || '목적지',
    nights,
    days: nights + 1,
    styles: Array.isArray(params.styles) ? params.styles : [],
    children: Number(params.children || 0),
    adults: Number(params.adults || 1),
    intensityScore: Number.isFinite(intensityScore) ? intensityScore : null,
    hasAccommodation: params.hasAccommodation ?? null,
    accommodations: Array.isArray(params.accommodations) ? params.accommodations : [],
  };
}

function buildAccommodationSection(hasAccommodation, accommodations) {
  if (hasAccommodation === false) {
    return '\n[숙소]\n숙소가 아직 정해지지 않았습니다. 일정에 맞는 최적 위치의 숙소를 추천하고 accommodations 배열에 포함하세요.';
  }
  if (hasAccommodation === true && accommodations.length > 0) {
    const lines = accommodations
      .map(acc => `- ${acc.checkIn} ~ ${acc.checkOut}: ${acc.name} (${acc.location})`)
      .join('\n');
    return `\n[예약된 숙소]\n${lines}\n각 일차의 동선은 해당 일자의 숙소 위치를 기준으로 구성하고, baseHotel 필드에 숙소명을 기입하세요.`;
  }
  return '';
}

function buildRagQuery({ dest, styles, mustVisit }) {
  return `${dest} 호주 여행 ${styles.join(' ')} ${mustVisit || ''}`.trim();
}

function australiaRegionPacing(days) {
  const tripDays = Number(days || 0);
  if (tripDays <= 4) {
    return { maxRegions: 1, maxDomesticTransfers: 0, minNightsPerRegion: 2 };
  }
  if (tripDays <= 6) {
    return { maxRegions: 2, maxDomesticTransfers: 1, minNightsPerRegion: 2 };
  }
  if (tripDays <= 9) {
    return { maxRegions: 3, maxDomesticTransfers: 2, minNightsPerRegion: 2 };
  }
  if (tripDays <= 12) {
    return { maxRegions: 4, maxDomesticTransfers: 3, minNightsPerRegion: 2 };
  }
  return { maxRegions: 5, maxDomesticTransfers: 4, minNightsPerRegion: 2 };
}

function buildAustraliaOptimizationSection({ dest, nights, days, mustVisit }) {
  const destination = String(dest || '').trim().toLowerCase();
  const requestedPlaces = String(mustVisit || '').toLowerCase();
  const isAustralia =
    ['호주', '오스트레일리아', 'australia', 'au'].includes(destination) ||
    destination.includes('australia') ||
    /(sydney|melbourne|cairns|uluru|ayers rock|brisbane|gold coast|perth|adelaide|tasmania|great barrier reef|시드니|멜버른|케언즈|울루루|브리즈번|골드코스트|퍼스|애들레이드|태즈메이니아|그레이트 배리어 리프)/.test(requestedPlaces);

  if (!isAustralia) return '';

  const pacing = australiaRegionPacing(days);

  return `

[Australia route feasibility rules — HARD CONSTRAINTS]
STEP 0 — Trip pacing before region selection:
  - For this ${nights} nights / ${days} days trip, use at most ${pacing.maxRegions} Australian region(s).
  - Use at most ${pacing.maxDomesticTransfers} domestic long-distance transfer day(s). A transfer day means domestic flight/train/long drive between Australian regions.
  - Prefer fewer regions with deeper stays over many regions with frequent flights. Do not add a city just because it is famous.
  - Each selected region should usually have at least ${pacing.minNightsPerRegion} nights. A 1-night region is allowed only for arrival/departure logistics or an explicit mustVisit.
  - If requested places exceed this pacing limit, include the most efficient set and put the rest in omittedPlaces with a clear reason.

STEP 1 — Region clustering (do this before writing any day):
  - Classify every requested place into a region: Sydney, Melbourne, Cairns/Great Barrier Reef, Brisbane/Gold Coast, Uluru, Perth, Adelaide, or Tasmania.
  - Group consecutive days by region. Never spread one region's sightseeing across non-consecutive days.
  - If the trip length (${nights} nights / ${days} days) cannot fit all regions, put skipped regions in omittedPlaces with a reason.
  - Once you leave a region, do not return to it later in the same itinerary unless the user explicitly requires a round trip.

STEP 2 — Day type assignment:
  - Assign each day one of three types BEFORE writing items:
    A) ARRIVAL DAY: flight arrives → taxi/train to hotel → check-in. Sightseeing only if arrival is before 15:00 AND only 1-2 places near the hotel.
    B) SIGHTSEEING DAY: all items within one region. baseHotel is in that region.
    C) TRANSFER DAY: depart previous hotel → airport/station → arrive new city → check in new hotel. NO sightseeing items.

STEP 3 — Same-day region lock (ABSOLUTE RULE):
  - Every item.lat/lng on a given day must belong to the same Australian region as that day's baseHotel.
  - FORBIDDEN example: Day 1 baseHotel is in Sydney, but items include a Melbourne hotel check-in or any place with Melbourne coordinates.
  - FORBIDDEN example: Sightseeing day in Brisbane, but one item has Gold Coast + another has Sydney coordinates.
  - If you see yourself writing items from two different cities on one day → STOP. Split into separate days or move one group to another day.
  - Exclude long-distance attractions unless the day is an accommodation-transfer day. A normal sightseeing day must not include any attraction more than 120km one-way from the day's base region.
  - Day tours are allowed only when a coach/bus round trip can realistically finish within 6 hours total. If the round trip is longer, omit the place or move accommodation to that region.

STEP 4 — Transfer day structure:
  - A transfer day contains ONLY: [previous-city hotel departure] → [airport or station] → [flight/train] → [new-city airport or station] → [new-city hotel check-in].
  - Do not add any tourist attraction, restaurant, or museum to a transfer day.
  - The transfer day's baseHotel is the NEW city's hotel (you sleep there that night).
  - Never schedule domestic flights on back-to-back days. Keep sightseeing days together inside the same region before moving on.

STEP 5 — Accommodation bookkeeping:
  - Add a separate accommodations[] entry for each region/city stay with correct checkIn/checkOut dates.
  - The checkIn/checkOut range must exactly cover the days whose baseHotel matches that accommodation name.
  - After arriving in a new city, ALL following sightseeing days use the new city's accommodation as baseHotel.

Return JSON may include:
  "includedPlaces": ["place or region name"],
  "omittedPlaces": [{ "name": "place", "reason": "why it does not fit this trip length/route" }]
`;
}

function buildInitialPrompt(params, ragContext = '') {
  const normalized = normalizePlanParams(params);
  const {
    dest,
    nights,
    days,
    startDate,
    endDate,
    budget,
    styles,
    difficulty,
    intensityScore,
    adults,
    children,
    mustVisit,
    hasAccommodation,
    accommodations,
  } = normalized;

  const travelerCount = adults + (children || 0);
  const travelers = `성인 ${adults}명${children > 0 ? `, 어린이 ${children}명` : ''}`;

  const rawBudgetText = params.budgetText || BUDGET_LABELS[budget] || budget || '';
  const budgetWon = (() => {
    const compact = String(rawBudgetText).replace(/,/g, '').replace(/\s+/g, '');
    const units = [
      { pattern: /(\d+(?:\.\d+)?)억/, multiplier: 100000000 },
      { pattern: /(\d+(?:\.\d+)?)만/, multiplier: 10000 },
      { pattern: /(\d+(?:\.\d+)?)천/, multiplier: 1000 },
    ];
    const unitTotal = units.reduce((sum, u) => {
      const m = compact.match(u.pattern);
      return m ? sum + Number(m[1]) * u.multiplier : sum;
    }, 0);
    if (unitTotal > 0) return unitTotal;
    const num = Number(compact.replace(/[^\d.]/g, ''));
    return Number.isFinite(num) ? num : 0;
  })();
  const perPersonWon = budgetWon > 0 && travelerCount > 1 ? Math.round(budgetWon / travelerCount) : 0;
  const perPersonText = perPersonWon > 0
    ? ` (1인당 약 ${perPersonWon >= 10000 ? `${Math.round(perPersonWon / 10000)}만원` : `${perPersonWon.toLocaleString()}원`})`
    : '';
  const budgetLine = rawBudgetText
    ? `항공권 제외 총 예산 ${rawBudgetText}${perPersonText}`
    : '미정';
  const accSection = buildAccommodationSection(hasAccommodation, accommodations);
  const australiaOptimizationSection = buildAustraliaOptimizationSection(normalized);
  const itemCount = DIFFICULTY_ITEM_COUNTS[difficulty] || DIFFICULTY_ITEM_COUNTS.normal;
  const dateRange = startDate && endDate
    ? `${startDate} ~ ${endDate} (${nights}박 ${days}일)`
    : `${nights}박 ${days}일`;

  return `${ragContext ? `[호주 RAG 지식 베이스]\n${ragContext}\n\n` : ''}[여행 요청]
- 목적지: ${dest}
- 여행 날짜: ${dateRange}
- 예산: ${budgetLine}
- 여행 스타일: ${styles.join(', ') || '자유'}
- 여행 강도: ${DIFFICULTY_LABELS[difficulty] || difficulty || '보통'}${intensityScore != null ? ` (${intensityScore}/100)` : ''} — 일반 관광일 하루 ${itemCount.label}개 장소
- 인원: ${travelers}
${mustVisit ? `- 꼭 방문할 곳: ${mustVisit}` : ''}
${params.travelPreference ? `- 여행 선호 방식: ${params.travelPreference}` : ''}${accSection}${australiaOptimizationSection}

도구를 사용해 ${days}일 여행 일정을 만들어 주세요.
반드시 1일차부터 ${days}일차까지 총 ${days}개의 day를 모두 포함하세요. 중간에 끊거나 생략하지 마세요.
${days <= 14 ? '이번 여행은 2주 이내 일정이므로 accommodations는 최대 3개까지만 포함하세요.' : ''}
투어 일정은 하루 왕복 이동 시간이 6시간을 넘지 않게 하고, 자동차 이동(렌터카, 택시, 차량 투어 포함)은 하루 총 300km 이상을 절대 배치하지 마세요.
각 일반 관광일마다 반드시 ${itemCount.label}개 장소를 포함하고, 최소 ${itemCount.min}개 미만으로 줄이지 마세요.
이동일/도착일처럼 항공·체크인 중심인 날만 예외적으로 장소 수를 줄일 수 있습니다.
장소 개수에는 실제 관광지, 실제 식당/카페, 실제 쇼핑 장소만 포함하세요. 숙소 출발/복귀 항목은 장소 개수에 포함하지 마세요.
숙소 위치를 기준으로 동선을 최적화하세요.
일정이 빈약하게 보이지 않도록 각 day에는 summary와 routeStrategy를 반드시 넣으세요.
각 item에는 note 외에도 duration, cost, reservation, transportTip, backup을 반드시 넣으세요.
note는 한 줄 설명이 아니라 "왜 이 장소를 이 시간대에 배치했는지"가 드러나게 2문장 이상으로 작성하세요.
모든 식사/카페 항목은 실제 상호명을 사용하세요. isMeal:true 항목에 상호명이 없으면 그 항목은 무효입니다.
각 식사 항목의 note에는 ① 왜 이 식당인지 (유명 이유 또는 현지 대표 음식), ② 반드시 시도해볼 메뉴명을 포함하세요.
accommodations의 checkIn/checkOut 날짜는 반드시 여행 날짜 범위(${startDate || '출발일'} ~ ${endDate || '귀국일'}) 안으로 설정하세요.`;
}

module.exports = {
  MAX_AGENT_ITERATIONS,
  AGENT_SYSTEM,
  normalizePlanParams,
  buildRagQuery,
  buildInitialPrompt,
  buildAccommodationSection,
};
