'use strict';

const { requireEnv } = require('../utils/env');

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

const CURRENCY_BY_DESTINATION = {
  일본: 'JPY', 도쿄: 'JPY', 오사카: 'JPY', 교토: 'JPY', 후쿠오카: 'JPY',
  태국: 'THB', 방콕: 'THB', 푸켓: 'THB',
  베트남: 'VND', 하노이: 'VND', 다낭: 'VND', 호치민: 'VND',
  싱가포르: 'SGD',
  인도네시아: 'IDR', 발리: 'IDR',
  대만: 'TWD', 홍콩: 'HKD', 말레이시아: 'MYR', 필리핀: 'PHP',
  중국: 'CNY', 인도: 'INR',
  호주: 'AUD', 시드니: 'AUD', 멜버른: 'AUD', 골드코스트: 'AUD', 케언즈: 'AUD',
  뉴질랜드: 'NZD',
  미국: 'USD', 뉴욕: 'USD', 하와이: 'USD', 괌: 'USD', 사이판: 'USD',
  캐나다: 'CAD', 멕시코: 'MXN', 브라질: 'BRL', 페루: 'PEN', 아르헨티나: 'ARS',
  영국: 'GBP', 런던: 'GBP',
  스위스: 'CHF',
  체코: 'CZK', 헝가리: 'HUF', 폴란드: 'PLN',
  튀르키예: 'TRY', 터키: 'TRY',
  두바이: 'AED', UAE: 'AED', '두바이(UAE)': 'AED',
  모로코: 'MAD', 이집트: 'EGP', 케냐: 'KES', 남아공: 'ZAR',
  프랑스: 'EUR', 파리: 'EUR', 이탈리아: 'EUR', 로마: 'EUR', 스페인: 'EUR', 바르셀로나: 'EUR',
  독일: 'EUR', 포르투갈: 'EUR', 그리스: 'EUR', 네덜란드: 'EUR', 오스트리아: 'EUR',
  아일랜드: 'EUR', 벨기에: 'EUR', 핀란드: 'EUR',
};

function normalizeText(value) {
  return String(value || '').trim();
}

function resolveCurrency({ destination = '', currency = '' } = {}) {
  const explicit = normalizeText(currency).toUpperCase();
  if (/^[A-Z]{3}$/.test(explicit)) return explicit;

  const text = normalizeText(destination);
  const direct = text.toUpperCase();
  if (/^[A-Z]{3}$/.test(direct)) return direct;

  const found = Object.entries(CURRENCY_BY_DESTINATION)
    .find(([name]) => text.toLowerCase().includes(name.toLowerCase()));
  return found?.[1] || null;
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

async function getExchangeRate({ destination, currency }) {
  const resolvedCurrency = resolveCurrency({ destination, currency });
  if (!resolvedCurrency) {
    const err = new Error('여행지의 통화를 확인하지 못했습니다.');
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

module.exports = { getExchangeRate, resolveCurrency };
