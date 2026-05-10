'use strict';

const MAX_AGENT_ITERATIONS = 6;

const AGENT_SYSTEM = `당신은 동선 최적화 전문 여행 플래너 AI입니다.
여러 곳을 나열하는 것보다 이동 낭비 없이 효율적으로 돌아볼 수 있는 일정을 만드는 것이 최우선입니다.

## 시간 배정 원칙 (가장 중요 — 반드시 준수)
일정의 각 항목 시간은 반드시 아래 공식을 지켜 계산하세요.

  다음 장소 시작시간 = 현재 장소 시작시간 + 현재 장소 체류시간 + calculateRoute로 확인한 실제 이동시간

장소별 기본 체류시간:
- 공항 도착 / 호텔 체크인·체크아웃 / 픽업 이동: 30분
- 카페·간단한 식사: 60분
- 레스토랑 식사: 90분
- 일반 명소·관광지: 90분
- 대형 테마파크·국립공원·투어: 180~240분

calculateRoute 없이 임의로 시간을 추측하지 마세요.
연속된 두 항목 사이에는 반드시 calculateRoute를 한 번 호출해 이동시간을 확인하고 위 공식으로 시간을 배정하세요.

하루 일정 시간 제약 (절대 준수):
- 첫 번째 항목은 08:00 이후로 시작하세요.
- 마지막 항목(숙소 복귀 또는 저녁 일정)은 반드시 23:00 이전에 시작해야 합니다.
- 위 공식으로 계산했을 때 23:00을 초과할 것 같으면 방문지를 줄이거나 체류시간을 단축하세요.

## 동선 최적화 원칙
- 하루 일정은 반드시 숙소 → 인근 장소들 → 숙소 방향으로 흐르게 구성하세요.
- 같은 방향·같은 구역 장소끼리 묶어 배치하세요. 왔다 갔다 동선 절대 금지.
- 하루 방문지는 4~6곳으로 제한하세요.
- 오전에 먼 곳, 오후에 숙소 방향으로 돌아오는 흐름을 기본으로 하세요.
- 식사 장소는 이동 동선 위에 있는 곳으로 선택하세요.

## 숙소 기준 원칙
- 모든 방문지는 해당 날 숙소로부터 반드시 20km 이내여야 합니다.
- baseHotel 필드에 해당 날 숙소명을 반드시 기입하세요.
- 숙소가 바뀌는 날에는 오전 관광 → 체크아웃 → 이동 → 체크인 순으로 구성하세요.
- 숙소 미예약 시: 해당 날 관광 구역 중심부에 위치한 숙소를 추천하세요.

## 도구 사용
1. calculateRoute: 연속된 모든 장소 사이에 호출해 이동시간을 확인하고 시간을 배정하세요. (필수)
2. searchKnowledgeBase: 숙소 lat·lon을 반드시 함께 전달해 근거리 장소만 검색하세요.
3. searchRecentInfo: 운영 여부, 입장 시간, 예약 필요 여부 등 변동 정보 확인에만 사용하세요.

## 출력 형식
최종 응답은 아래 JSON만 반환하세요. 마크다운·코드블록·설명 문장 없이 순수 JSON만 출력하세요.
각 item의 lat/lng는 실제 장소의 정확한 위도/경도(소수점 4자리 이상)를 넣으세요.
공항·숙소 같은 이동 항목도 해당 건물의 실제 좌표를 넣으세요.
{
  "accommodations": [
    { "name": "숙소명", "location": "위치(도시명)", "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD", "searchQuery": "Hotels.com 영문 검색어" }
  ],
  "days": [
    {
      "label": "1일차",
      "theme": "하루 테마 (동선 기준 구역명 포함)",
      "baseHotel": "해당 일 숙소명",
      "items": [
        { "time": "09:00", "name": "장소명", "note": "상세 설명, 입장료, 소요 시간, 예약 팁", "isMeal": false, "lat": 37.5665, "lng": 126.9780 }
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

const CONTINENT_DEST_MAP = {
  asia:       '아시아',
  europe:     '유럽',
  americas:   '미주',
  oceania:    '호주',
  middleeast: '중동',
};

function normalizePlanParams(params = {}) {
  const nights = Number(params.nights || 0);
  return {
    ...params,
    dest: params.country || CONTINENT_DEST_MAP[params.continent] || params.continent || '목적지',
    nights,
    days: nights + 1,
    styles: Array.isArray(params.styles) ? params.styles : [],
    children: Number(params.children || 0),
    adults: Number(params.adults || 1),
    hasAccommodation: params.hasAccommodation ?? null,
    accommodations: Array.isArray(params.accommodations) ? params.accommodations : [],
  };
}

function buildAccommodationSection(hasAccommodation, accommodations) {
  if (hasAccommodation === false) {
    return '\n[숙소]\n미예약 상태입니다. 일정에 맞는 최적 위치 숙소를 추천하고 accommodations 배열에 포함해 주세요.';
  }
  if (hasAccommodation === true && accommodations.length > 0) {
    const lines = accommodations
      .map(acc => `- ${acc.checkIn} ~ ${acc.checkOut}: ${acc.name} (${acc.location})`)
      .join('\n');
    return `\n[예약된 숙소]\n${lines}\n각 일차의 동선은 해당 날 숙소 위치 기준으로 구성하고, baseHotel 필드에 숙소명을 기입하세요.`;
  }
  return '';
}

function buildRagQuery({ dest, styles }) {
  return `${dest} 여행 ${styles.join(' ')}`.trim();
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
    adults,
    children,
    mustVisit,
    hasAccommodation,
    accommodations,
  } = normalized;

  const travelers = `성인 ${adults}명${children > 0 ? `, 어린이 ${children}명` : ''}`;
  const accSection = buildAccommodationSection(hasAccommodation, accommodations);
  const dateRange = startDate && endDate
    ? `${startDate} ~ ${endDate} (${nights}박 ${days}일)`
    : `${nights}박 ${days}일`;

  return `${ragContext ? `[여행 지식 베이스]\n${ragContext}\n\n` : ''}[여행 요청]
- 목적지: ${dest}
- 여행 날짜: ${dateRange}
- 예산: ${BUDGET_LABELS[budget] || budget || '미정'}
- 여행 스타일: ${styles.join(', ') || '자유'}
- 여행 강도: ${DIFFICULTY_LABELS[difficulty] || difficulty || '보통'}
- 인원: ${travelers}
${mustVisit ? `- 꼭 방문할 곳: ${mustVisit}` : ''}${accSection}

도구를 사용해 ${days}일 여행 일정을 만들어 주세요.
각 일차마다 5~7개 항목을 포함하고, 숙소 위치를 기준으로 동선을 최적화하세요.
accommodations의 checkIn/checkOut 날짜는 반드시 위 여행 날짜 범위(${startDate || '출발일'} ~ ${endDate || '귀국일'}) 내로 설정하세요.`;
}

module.exports = {
  MAX_AGENT_ITERATIONS,
  AGENT_SYSTEM,
  normalizePlanParams,
  buildRagQuery,
  buildInitialPrompt,
  buildAccommodationSection,
};
