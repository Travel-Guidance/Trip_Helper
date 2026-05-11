'use strict';

const { requireEnv } = require('../utils/env');

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

function normalizeCurrency(currency) {
  const value = String(currency || '').trim().toUpperCase();
  return /^[A-Z]{3}$/.test(value) ? value : '';
}

async function fetchRateFromApi(currency) {
  if (currency === 'KRW') return 1;

  const key = requireEnv('EXCHANGE_RATE_API_KEY');
  const response = await fetch(`https://v6.exchangerate-api.com/v6/${key}/pair/${currency}/KRW`);
  if (!response.ok) {
    throw new Error('환율 API 응답을 받지 못했습니다.');
  }

  const data = await response.json();
  if (data.result !== 'success' || !Number.isFinite(Number(data.conversion_rate))) {
    throw new Error('환율 정보를 가져오지 못했습니다.');
  }

  return Number(data.conversion_rate);
}

async function getExchangeRate({ currency }) {
  const resolvedCurrency = normalizeCurrency(currency);
  if (!resolvedCurrency) {
    const err = new Error('확정된 ISO 4217 통화 코드가 필요합니다.');
    err.status = 400;
    throw err;
  }

  const cached = cache.get(resolvedCurrency);
  const now = Date.now();
  if (cached && now - cached.fetchedAtMs < CACHE_TTL_MS) {
    return { ...cached.data, cached: true };
  }

  const rateToKrw = await fetchRateFromApi(resolvedCurrency);
  const data = {
    currency: resolvedCurrency,
    rateToKrw,
    base: resolvedCurrency,
    quote: 'KRW',
    fetchedAt: new Date(now).toISOString(),
  };
  cache.set(resolvedCurrency, { data, fetchedAtMs: now });
  return { ...data, cached: false };
}

module.exports = { getExchangeRate };
