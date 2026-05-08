const { getEmbedding, generateText } = require('./geminiService');
const qdrant = require('../config/qdrant');
const { runAgent } = require('./agentService');

const TRAVEL_SYSTEM = `당신은 전문 여행 플래너 AI입니다.
주어진 여행 지식 베이스 컨텍스트를 최대한 활용하여 구체적이고 실용적인 여행 일정을 생성합니다.
모든 응답은 한국어로 하며, 구체적인 시간·장소·예산·팁을 포함해야 합니다.`;

// 국가명/대륙명 → 도시 목록 매핑 (Qdrant city 필드와 일치)
const CITY_MAP = {
  '호주': ['시드니', '멜버른', '골드코스트', '케언즈', '울루루', '브리즈번'],
  '시드니': ['시드니'], '멜버른': ['멜버른'], '골드코스트': ['골드코스트'],
  '케언즈': ['케언즈'], '울루루': ['울루루'], '브리즈번': ['브리즈번'],
};

// 예산 키 → price_range 매핑
const PRICE_RANGE_MAP = { low: 'low', mid: 'mid', high: 'high' };

async function retrieveContext(query, { limit = 6, dest = null, budget = null } = {}) {
  const vector = await getEmbedding(query);

  // dest가 매핑된 도시 목록에 있으면 도시 필터 적용
  const cities = dest ? (CITY_MAP[dest] ?? null) : null;
  const priceRange = budget ? (PRICE_RANGE_MAP[budget] ?? null) : null;

  let results;
  if (cities) {
    // 첫 번째 도시로 필터 검색 + 공통 팁 포함 (searchByParams 내부에서 '공통' any 포함)
    results = await qdrant.searchByParams(vector, { limit, city: cities[0], priceRange });
  } else {
    results = await qdrant.search(vector, limit);
  }

  return results.map(r => r.payload?.text ?? '').filter(Boolean).join('\n\n---\n\n');
}

async function generateTravelPlan(params) {
  return runAgent(params);
}

module.exports = { generateTravelPlan, retrieveContext };
