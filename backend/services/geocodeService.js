'use strict';

const { requireEnv } = require('../utils/env');

function hasCoordinates(item) {
  return Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lng));
}

function cleanPlaceName(name) {
  const raw = String(name || '').trim();

  // 괄호 안 영문명 우선 추출: "더치 베이커리 (The Dutchy's Bakery & Cafe) 브런치" → "The Dutchy's Bakery & Cafe"
  const englishInParens = raw.match(/\(([A-Za-z][^)]{3,})\)/);
  if (englishInParens) return englishInParens[1].trim();

  return raw
    .replace(/\s+(체크인|체크아웃|도착|출발|복귀|방문|관광|구경|산책|탐방|브런치|투어|전망대)$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function knownPlaceCoordinates(query) {
  const text = cleanPlaceName(query).toLowerCase();
  if (/four seasons hotel sydney|four seasons sydney|199 george st/.test(text)) {
    return {
      lat: -33.8615815,
      lng: 151.2076503,
      formattedAddress: '199 George St, The Rocks NSW 2000 Australia',
    };
  }
  if (/달링하버\s*(레스토랑|식당|맛집)|darling harbour\s*(restaurant|dining)/.test(text)) {
    return {
      lat: -33.8722257,
      lng: 151.2020367,
      formattedAddress: "Nick's Seafood Restaurant, The Promenade, Cockle Bay Wharf, Darling Harbour NSW 2000 Australia",
    };
  }
  return null;
}

function destinationText(params = {}) {
  return params.country || params.destination || params.dest || params.continent || '';
}


const VAGUE_NAME_PATTERNS = [
  /^자유\s*시간/,
  /^휴식$/,
  /^호텔\s*휴식/,
  /^체크\s*인\s*후/,
  /^이동\s*후\s*휴식/,
  /^(점심|저녁|아침)\s*식사$/,
  /^(근처|로컬|현지|추천)\s*(맛집|카페|식당)/,
  /^쇼핑$/,
  /^산책$/,
];

const HOTEL_ITEM_PATTERNS = [
  /숙소\s*(출발|복귀|도착)/,
  /호텔\s*(출발|복귀|도착|체크인|체크아웃)/,
  /(출발|복귀)$/,
];

function isVagueItem(item) {
  const name = String(item?.name || '').trim().toLowerCase();
  return !name || VAGUE_NAME_PATTERNS.some(p => p.test(name));
}

function isHotelItem(item) {
  const name = String(item?.name || '').trim();
  return HOTEL_ITEM_PATTERNS.some(p => p.test(name));
}

function shouldVerifyExistingCoordinates(item) {
  return !isVagueItem(item);
}

async function geocodePlace(query, key = requireEnv('GOOGLE_MAPS_API_KEY')) {
  const address = String(query || '').trim();
  if (!address) return null;

  const known = knownPlaceCoordinates(address);
  if (known) return known;

  const params = new URLSearchParams({
    address,
    key,
    language: 'ko',
  });

  const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?${params}`);
  if (!response.ok) return null;

  const data = await response.json();
  const location = data.results?.[0]?.geometry?.location;
  if (data.status !== 'OK' || !location) return null;

  return {
    lat: location.lat,
    lng: location.lng,
    formattedAddress: data.results[0].formatted_address,
  };
}

async function enrichPlanWithCoordinates(plan, params = {}) {
  if (!plan?.days?.length) return plan;

  let key;
  try {
    key = requireEnv('GOOGLE_MAPS_API_KEY');
  } catch {
    return plan;
  }

  const destination = destinationText(params);
  const cache = new Map();

  const days = await Promise.all(plan.days.map(async day => {
    const cityContext = day.baseHotel || destination;
    const items = await Promise.all((day.items || []).map(async item => {
      if (!shouldVerifyExistingCoordinates(item)) return item;

      // geocodeQuery(영문 장소명)가 있으면 그대로 사용, 없으면 기존 로직
      const query = item.geocodeQuery
        ? String(item.geocodeQuery).trim()
        : (() => {
            const placeName = isHotelItem(item)
              ? (day.baseHotel || cleanPlaceName(item.name))
              : cleanPlaceName(item.name);
            return [placeName || item.name, cityContext].filter(Boolean).join(', ');
          })();
      if (!query) return item;

      if (!cache.has(query)) {
        cache.set(query, geocodePlace(query, key));
      }

      const result = await cache.get(query);
      if (!result) return item;

      return {
        ...item,
        lat: result.lat,
        lng: result.lng,
      };
    }));

    return { ...day, items };
  }));

  const accommodations = Array.isArray(plan.accommodations)
    ? await Promise.all(plan.accommodations.map(async acc => {
        if (acc.coordinates) return acc;

        const query = [acc.name, acc.location || destination].filter(Boolean).join(', ');
        if (!query) return acc;

        if (!cache.has(query)) {
          cache.set(query, geocodePlace(query, key));
        }

        const result = await cache.get(query);
        if (!result) return acc;

        return { ...acc, coordinates: { lat: result.lat, lng: result.lng } };
      }))
    : plan.accommodations;

  return { ...plan, days, accommodations };
}

module.exports = { geocodePlace, enrichPlanWithCoordinates };
