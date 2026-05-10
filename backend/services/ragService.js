'use strict';

const { searchKnowledge } = require('../rag/retrieval');
const { formatContext } = require('../rag/contextFormat');
const { runAgent } = require('./agentService');

const CITY_MAP = {
  호주: ['시드니', '멜버른', '골드코스트', '케언즈', '울루루', '브리즈번', '퍼스', '애들레이드'],
  시드니: ['시드니'],
  멜버른: ['멜버른'],
  골드코스트: ['골드코스트'],
  케언즈: ['케언즈'],
  울루루: ['울루루'],
  브리즈번: ['브리즈번'],
  퍼스: ['퍼스'],
  애들레이드: ['애들레이드'],
};

const PRICE_RANGE_MAP = {
  low: 'low',
  mid: 'mid',
  high: 'high',
};

function resolveCityFilter(destination) {
  const cities = destination ? CITY_MAP[destination] : null;
  return cities?.length === 1 ? cities[0] : null;
}

async function retrieveContext(query, { limit = 6, dest = null, budget = null, category = null, lat = null, lon = null } = {}) {
  if (dest && !CITY_MAP[dest]) return '';

  const city = resolveCityFilter(dest);
  const priceRange = budget ? PRICE_RANGE_MAP[budget] : null;
  const results = await searchKnowledge(query, { city, category, priceRange, limit, lat, lon });
  return formatContext(results);
}

async function generateTravelPlan(params) {
  return runAgent(params);
}

module.exports = { generateTravelPlan, retrieveContext, resolveCityFilter };
