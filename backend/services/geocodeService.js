'use strict';

const { requireEnv } = require('../utils/env');

function hasCoordinates(item) {
  return Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lng));
}

function cleanPlaceName(name) {
  return String(name || '')
    .trim()
    .replace(/\s+(체크인|체크아웃|도착|출발|복귀|방문|관광|구경|산책|탐방)$/g, '')
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

function distanceKm(a, b) {
  const lat1 = Number(a?.lat);
  const lng1 = Number(a?.lng);
  const lat2 = Number(b?.lat);
  const lng2 = Number(b?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return Infinity;

  const toRad = value => value * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const sLat1 = toRad(lat1);
  const sLat2 = toRad(lat2);
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(sLat1) * Math.cos(sLat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function shouldVerifyExistingCoordinates(item) {
  if (!hasCoordinates(item)) return true;
  if (item?.isMeal) return false;
  return true;
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
  const maxCoordinateDriftKm = 0.75;

  const days = await Promise.all(plan.days.map(async day => {
    const items = await Promise.all((day.items || []).map(async item => {
      if (!shouldVerifyExistingCoordinates(item)) return item;

      const placeName = cleanPlaceName(item.name);
      const query = [placeName || item.name, destination].filter(Boolean).join(', ');
      if (!query) return item;

      if (!cache.has(query)) {
        cache.set(query, geocodePlace(query, key));
      }

      const result = await cache.get(query);
      if (!result) return item;
      if (hasCoordinates(item) && distanceKm(item, result) <= maxCoordinateDriftKm) return item;

      return {
        ...item,
        lat: result.lat,
        lng: result.lng,
      };
    }));

    return { ...day, items };
  }));

  return { ...plan, days };
}

module.exports = { geocodePlace, enrichPlanWithCoordinates };
