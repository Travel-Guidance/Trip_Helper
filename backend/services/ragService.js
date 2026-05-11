'use strict';

const { searchKnowledge } = require('../rag/retrieval');
const { formatContext } = require('../rag/contextFormat');
const { runAgent } = require('./agentService');

const CITY_ALIASES = {
  호주: null,
  오스트레일리아: null,
  australia: null,
  au: null,
  시드니: '시드니',
  sydney: '시드니',
  멜버른: '멜버른',
  melbourne: '멜버른',
  골드코스트: '골드코스트',
  'gold coast': '골드코스트',
  케언즈: '케언즈',
  cairns: '케언즈',
  브리즈번: '브리즈번',
  brisbane: '브리즈번',
  퍼스: '퍼스',
  perth: '퍼스',
  애들레이드: '애들레이드',
  adelaide: '애들레이드',
  울루루: '울루루',
  uluru: '울루루',
  'ayers rock': '울루루',
};

const AUSTRALIA_DESTINATIONS = new Set(Object.keys(CITY_ALIASES));

const PRICE_RANGE_MAP = {
  low: 'low',
  mid: 'mid',
  high: 'high',
};

function normalizeDestination(destination) {
  return String(destination || '').trim().toLowerCase();
}

function isAustraliaDestination(destination) {
  const key = normalizeDestination(destination);
  return AUSTRALIA_DESTINATIONS.has(key);
}

function resolveCityFilter(destination) {
  const key = normalizeDestination(destination);
  return CITY_ALIASES[key] ?? null;
}

function buildDebug({ enabled, reason, dest, query, city, count = 0 }) {
  return { enabled, reason, dest: dest || null, query: query || null, city: city || null, count };
}

async function retrieveContext(
  query,
  { limit = 6, dest = null, budget = null, category = null, lat = null, lon = null, debug = false } = {},
) {
  const city = resolveCityFilter(dest);

  if (dest && !isAustraliaDestination(dest)) {
    const meta = buildDebug({ enabled: false, reason: 'unsupported_destination', dest, query, city });
    console.log(`[RAG] skipped dest="${dest}" reason=${meta.reason}`);
    return debug ? { context: '', meta } : '';
  }

  const priceRange = budget ? PRICE_RANGE_MAP[budget] : null;
  const results = await searchKnowledge(query, { city, category, priceRange, limit, lat, lon });
  const context = formatContext(results);
  const meta = buildDebug({
    enabled: true,
    reason: results.length ? 'hit' : 'miss',
    dest,
    query,
    city,
    count: results.length,
  });

  console.log(`[RAG] ${meta.reason} dest="${dest || 'all-australia'}" city="${city || 'all'}" count=${results.length} query="${query}"`);
  return debug ? { context, meta } : context;
}

async function generateTravelPlan(params) {
  return runAgent(params);
}

module.exports = {
  generateTravelPlan,
  retrieveContext,
  resolveCityFilter,
  isAustraliaDestination,
};
