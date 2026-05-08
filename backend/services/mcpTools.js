const { getEmbedding } = require('./geminiService');
const qdrant = require('../config/qdrant');

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

/* ─── Gemini Function Calling 도구 스키마 정의 ─────────── */
const toolDefinitions = [
  {
    name: 'searchKnowledgeBase',
    description: '내장 여행 지식 베이스에서 관련 장소·팁·일정 정보를 검색합니다. 특정 도시나 카테고리의 상세 여행 정보가 필요할 때 사용하세요.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: '검색할 내용 (예: "시드니 해산물 맛집", "케언즈 스노클링 투어")',
        },
        city: {
          type: 'STRING',
          description: '검색할 도시명 (예: 시드니, 멜버른, 골드코스트)',
        },
        category: {
          type: 'STRING',
          description: '카테고리 (landmark, nature, food, activity, transport, culture, shopping, accommodation)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'searchRecentInfo',
    description: '웹에서 최신 관광 정보·이벤트·가격·영업 정보를 검색합니다. 현재 운영 여부, 최신 입장료, 시즌 이벤트 등을 확인할 때 사용하세요.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: '검색할 내용 (예: "시드니 오페라하우스 2025 투어 가격", "케언즈 그레이트배리어리프 현재 상태")',
        },
        country: {
          type: 'STRING',
          description: '검색 대상 국가 (기본값: Australia)',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'calculateRoute',
    description: '두 장소 사이의 이동 시간과 거리를 계산합니다. 일정 동선 최적화에 사용하세요.',
    parameters: {
      type: 'OBJECT',
      properties: {
        origin: {
          type: 'STRING',
          description: '출발지 (예: "Sydney Opera House", "Bondi Beach")',
        },
        destination: {
          type: 'STRING',
          description: '도착지 (예: "Taronga Zoo", "Sydney Fish Market")',
        },
        mode: {
          type: 'STRING',
          description: '이동 수단: driving, walking, transit (기본값: transit)',
        },
      },
      required: ['origin', 'destination'],
    },
  },
];

/* ─── 도구 실행 함수들 ──────────────────────────────────── */

async function searchKnowledgeBase({ query, city = null, category = null }) {
  try {
    const vector = await getEmbedding(query);
    const results = await qdrant.searchByParams(vector, {
      limit: 5,
      city: city || null,
      category: category || null,
    });

    if (!results || results.length === 0) {
      return { found: false, message: '관련 정보를 찾을 수 없습니다.' };
    }

    return {
      found: true,
      results: results.map(r => ({
        city: r.payload?.city,
        category: r.payload?.category,
        text: r.payload?.text,
        tags: r.payload?.tags,
        price_range: r.payload?.price_range,
        hours: r.payload?.hours,
        score: r.score,
      })),
    };
  } catch (err) {
    return { found: false, error: err.message };
  }
}

async function searchRecentInfo({ query, country = 'Australia' }) {
  if (!TAVILY_API_KEY) {
    return simulateRecentInfo(query);
  }

  try {
    const res = await fetch('https://api.tavily.com/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        api_key: TAVILY_API_KEY,
        query: `${query} ${country} travel guide`,
        search_depth: 'basic',
        max_results: 5,
        include_answer: true,
        include_raw_content: false,
      }),
    });

    if (!res.ok) throw new Error(`Tavily error: ${res.status}`);
    const data = await res.json();

    return {
      found: true,
      answer: data.answer || null,
      results: (data.results || []).map(r => ({
        title: r.title,
        url: r.url,
        content: r.content?.slice(0, 300),
      })),
    };
  } catch (err) {
    return simulateRecentInfo(query);
  }
}

async function calculateRoute({ origin, destination, mode = 'transit' }) {
  if (!GOOGLE_MAPS_API_KEY) {
    return simulateRoute(origin, destination, mode);
  }

  try {
    const params = new URLSearchParams({
      origins: origin,
      destinations: destination,
      mode,
      key: GOOGLE_MAPS_API_KEY,
      language: 'ko',
      region: 'AU',
    });

    const res = await fetch(
      `https://maps.googleapis.com/maps/api/distancematrix/json?${params}`
    );

    if (!res.ok) throw new Error(`Maps API error: ${res.status}`);
    const data = await res.json();

    const element = data.rows?.[0]?.elements?.[0];
    if (!element || element.status !== 'OK') {
      return simulateRoute(origin, destination, mode);
    }

    return {
      found: true,
      origin: data.origin_addresses?.[0],
      destination: data.destination_addresses?.[0],
      distance: element.distance?.text,
      duration: element.duration?.text,
      mode,
    };
  } catch (err) {
    return simulateRoute(origin, destination, mode);
  }
}

/* ─── API 없을 때 시뮬레이션 폴백 ─────────────────────── */

function simulateRecentInfo(query) {
  const lowerQuery = query.toLowerCase();
  const snippets = {
    '오페라하우스': '시드니 오페라하우스 가이드 투어는 성인 45달러, 매일 09:00~17:00 운영 중. 한국어 오디오 가이드 포함.',
    '그레이트배리어리프': '그레이트 배리어 리프 당일 투어 130~180달러. 현재 산호 백화 현상 모니터링 중이나 북부 리프는 양호.',
    '울루루': '울루루 국립공원 3일 입장권 38달러. 2019년부터 등반 금지. 베이스 워크·일출 투어 운영 중.',
    '멜버른커피': '멜버른 스페셜티 카페 플랫화이트 4~5달러. Patricia Coffee Brewers, Seven Seeds 현재 영업 중.',
  };

  let content = '관련 최신 정보를 찾았습니다.';
  for (const [key, val] of Object.entries(snippets)) {
    if (lowerQuery.includes(key)) { content = val; break; }
  }

  return {
    found: true,
    answer: content,
    results: [{ title: `${query} 여행 정보`, content }],
    simulated: true,
  };
}

function simulateRoute(origin, destination, mode) {
  const routes = {
    'opera house_bondi': { distance: '8.5 km', duration: '35분' },
    'bondi_fish market': { distance: '6.2 km', duration: '28분' },
    'cbd_taronga': { distance: '5.8 km', duration: '25분(페리)' },
    'flinders_queen victoria': { distance: '1.2 km', duration: '15분' },
  };

  const key = `${origin}_${destination}`.toLowerCase().replace(/\s+/g, '');
  const found = Object.entries(routes).find(([k]) => key.includes(k.split('_')[0]) && key.includes(k.split('_')[1]));

  return {
    found: true,
    origin,
    destination,
    distance: found ? found[1].distance : '약 5~10 km',
    duration: found ? found[1].duration : '약 20~40분',
    mode,
    simulated: !found,
  };
}

/* ─── 도구 실행 디스패처 ───────────────────────────────── */
async function executeTool(name, args) {
  switch (name) {
    case 'searchKnowledgeBase': return searchKnowledgeBase(args);
    case 'searchRecentInfo':    return searchRecentInfo(args);
    case 'calculateRoute':      return calculateRoute(args);
    default: return { error: `알 수 없는 도구: ${name}` };
  }
}

module.exports = { toolDefinitions, executeTool };
