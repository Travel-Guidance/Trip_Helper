'use strict';

const MAX_AGENT_ITERATIONS = 6;

const AGENT_SYSTEM = `당신은 전문 여행 플래너 AI 에이전트입니다.
사용자의 여행 조건과 숙소 정보를 바탕으로 동선을 최적화한 일정을 생성합니다.

숙소 기반 동선 원칙:
- 각 일차의 일정은 해당 날 숙소 위치에서 가까운 곳부터 구성하고, baseHotel 필드에 숙소명을 기입하세요.
- 모든 방문지는 해당 날 숙소로부터 30km 이내여야 합니다. 멀리 떨어진 장소는 제외하세요.
- 숙소가 바뀌는 이동일에는 체크아웃 → 이동 → 체크인 항목을 포함하세요.
- 도시나 지역을 이동할 경우 이동 시간을 반드시 일정에 반영하세요.
- 숙소 미예약 시: 최적 위치 숙소를 일차별로 추천하고 accommodations 배열에 포함하세요.

도구 사용 원칙:
1. searchKnowledgeBase: 장소 검색 시 반드시 해당 날 숙소의 lat·lon을 함께 전달해 근거리 결과만 받으세요.
2. searchRecentInfo: 최신 가격, 운영 여부, 이벤트처럼 변동 가능한 정보를 확인할 때 사용합니다.
3. calculateRoute: 장소 사이의 이동 시간과 거리를 확인해 동선을 최적화할 때 사용합니다.

최종 응답은 반드시 아래 JSON 형식만 반환하세요. 마크다운 코드블록이나 설명 문장은 넣지 마세요.
{
  "accommodations": [
    { "name": "숙소명", "location": "위치(도시명)", "checkIn": "YYYY-MM-DD", "checkOut": "YYYY-MM-DD", "searchQuery": "Hotels.com 검색어" }
  ],
  "days": [
    {
      "label": "1일차",
      "theme": "하루 테마",
      "baseHotel": "해당 일 숙소명",
      "items": [
        { "time": "09:00", "name": "장소명", "note": "상세 설명, 가격, 예약 팁", "isMeal": false }
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

  return `${ragContext ? `[여행 지식 베이스]\n${ragContext}\n\n` : ''}[여행 요청]
- 목적지: ${dest}
- 기간: ${nights}박 ${days}일
- 예산: ${BUDGET_LABELS[budget] || budget || '미정'}
- 여행 스타일: ${styles.join(', ') || '자유'}
- 여행 강도: ${DIFFICULTY_LABELS[difficulty] || difficulty || '보통'}
- 인원: ${travelers}
${mustVisit ? `- 꼭 방문할 곳: ${mustVisit}` : ''}${accSection}

도구를 사용해 ${days}일 여행 일정을 만들어 주세요.
각 일차마다 5~7개 항목을 포함하고, 숙소 위치를 기준으로 동선을 최적화하세요.`;
}

module.exports = {
  MAX_AGENT_ITERATIONS,
  AGENT_SYSTEM,
  normalizePlanParams,
  buildRagQuery,
  buildInitialPrompt,
  buildAccommodationSection,
};
