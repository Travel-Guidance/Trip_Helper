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

function buildAustraliaOptimizationSection({ dest, nights, days, mustVisit }) {
  const destination = String(dest || '').trim().toLowerCase();
  const requestedPlaces = String(mustVisit || '').toLowerCase();
  const isAustralia =
    ['호주', '오스트레일리아', 'australia', 'au'].includes(destination) ||
    destination.includes('australia') ||
    /(sydney|melbourne|cairns|uluru|ayers rock|brisbane|gold coast|perth|adelaide|tasmania|great barrier reef|시드니|멜버른|케언즈|울루루|브리즈번|골드코스트|퍼스|애들레이드|태즈메이니아|그레이트 배리어 리프)/.test(requestedPlaces);

  if (!isAustralia) return '';

  return `

[Australia route feasibility rules]
- Do not choose a default city. Build the route from the user's requested destination and mustVisit places.
- Before writing the day-by-day plan, classify every requested place into a practical region/city cluster such as Sydney, Melbourne, Cairns/Great Barrier Reef, Brisbane/Gold Coast, Uluru, Perth, Adelaide, or Tasmania.
- Optimize the order of those clusters for the trip length (${nights} nights / ${days} days). Places in the same cluster should be grouped together on the same or neighboring days.
- Do not force every requested place into the itinerary. If the trip length cannot realistically include a place or region, put it in omittedPlaces with a short reason.
- Long-distance moves between Australian regions are travel blocks, not normal sightseeing hops. Sydney, Melbourne, Cairns, Uluru, Perth, Adelaide, Brisbane/Gold Coast, and Tasmania must not be mixed as ordinary same-day sightseeing.
- If a long-distance move is needed, make that day a transfer day: previous accommodation departure -> airport/station/drive transfer -> arrival city accommodation check-in. Do not return to the departure city that day.
- After a long-distance move, baseHotel must be near the arrival region. Never fly out and back to the same baseHotel on the same day.
- Add a separate accommodations entry for each distant region/city stay. The checkIn/checkOut dates must match the days that use that accommodation as baseHotel.
- After the transfer day, all local sightseeing in the arrival region must depart from and return to the arrival-region accommodation.
- Within a normal sightseeing day, keep consecutive places in the same city/region. As a hard rule, avoid same-day consecutive sightseeing places over 100 km apart, and avoid any same-day segment over 400 km unless the whole day is clearly a one-way transfer day.
- Return JSON may include includedPlaces and omittedPlaces:
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

  const travelers = `성인 ${adults}명${children > 0 ? `, 어린이 ${children}명` : ''}`;
  const accSection = buildAccommodationSection(hasAccommodation, accommodations);
  const australiaOptimizationSection = buildAustraliaOptimizationSection(normalized);
  const itemCount = DIFFICULTY_ITEM_COUNTS[difficulty] || DIFFICULTY_ITEM_COUNTS.normal;
  const dateRange = startDate && endDate
    ? `${startDate} ~ ${endDate} (${nights}박 ${days}일)`
    : `${nights}박 ${days}일`;

  return `${ragContext ? `[호주 RAG 지식 베이스]\n${ragContext}\n\n` : ''}[여행 요청]
- 목적지: ${dest}
- 여행 날짜: ${dateRange}
- 예산: ${BUDGET_LABELS[budget] || budget || '미정'}
- 여행 스타일: ${styles.join(', ') || '자유'}
- 여행 강도: ${DIFFICULTY_LABELS[difficulty] || difficulty || '보통'}${intensityScore != null ? ` (${intensityScore}/100)` : ''} — 일반 관광일 하루 ${itemCount.label}개 장소
- 인원: ${travelers}
${mustVisit ? `- 꼭 방문할 곳: ${mustVisit}` : ''}${accSection}${australiaOptimizationSection}

도구를 사용해 ${days}일 여행 일정을 만들어 주세요.
반드시 1일차부터 ${days}일차까지 총 ${days}개의 day를 모두 포함하세요. 중간에 끊거나 생략하지 마세요.
각 일반 관광일마다 반드시 ${itemCount.label}개 장소를 포함하고, 최소 ${itemCount.min}개 미만으로 줄이지 마세요.
이동일/도착일처럼 항공·체크인 중심인 날만 예외적으로 장소 수를 줄일 수 있습니다.
장소 개수에는 실제 관광지, 실제 식당/카페, 실제 쇼핑 장소만 포함하세요. 숙소 출발/복귀 항목은 장소 개수에 포함하지 마세요.
숙소 위치를 기준으로 동선을 최적화하세요.
일정이 빈약하게 보이지 않도록 각 day에는 summary와 routeStrategy를 반드시 넣으세요.
각 item에는 note 외에도 duration, cost, reservation, transportTip, backup을 반드시 넣으세요.
note는 한 줄 설명이 아니라 "왜 이 장소를 이 시간대에 배치했는지"가 드러나게 2문장 이상으로 작성하세요.
모든 식사/카페 항목은 실제 상호명을 사용하고, 모호한 표현은 쓰지 마세요.
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
