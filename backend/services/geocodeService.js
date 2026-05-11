'use strict';

const { requireEnv } = require('../utils/env');

function hasCoordinates(item) {
  return Number.isFinite(Number(item?.lat)) && Number.isFinite(Number(item?.lng));
}

function destinationText(params = {}) {
  return params.country || params.destination || params.dest || params.continent || '';
}

async function geocodePlace(query, key = requireEnv('GOOGLE_MAPS_API_KEY')) {
  const address = String(query || '').trim();
  if (!address) return null;

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
    const items = await Promise.all((day.items || []).map(async item => {
      if (hasCoordinates(item)) return item;

      const query = [item.name, destination].filter(Boolean).join(', ');
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
