'use strict';

const CITY_COORDS = {
  '시드니':    { lat: -33.8688, lon: 151.2093 },
  '멜버른':    { lat: -37.8136, lon: 144.9631 },
  '골드코스트': { lat: -28.0167, lon: 153.4000 },
  '케언즈':    { lat: -16.9203, lon: 145.7703 },
  '울루루':    { lat: -25.3444, lon: 131.0369 },
  '브리즈번':  { lat: -27.4698, lon: 153.0251 },
  '퍼스':      { lat: -31.9505, lon: 115.8605 },
  '애들레이드': { lat: -34.9285, lon: 138.6007 },
  '도쿄':      { lat: 35.6762,  lon: 139.6503 },
  '오사카':    { lat: 34.6937,  lon: 135.5023 },
  '교토':      { lat: 35.0116,  lon: 135.7681 },
  '파리':      { lat: 48.8566,  lon: 2.3522   },
  '로마':      { lat: 41.9028,  lon: 12.4964  },
  '바르셀로나': { lat: 41.3851,  lon: 2.1734   },
  '방콕':      { lat: 13.7563,  lon: 100.5018 },
  '싱가포르':  { lat: 1.3521,   lon: 103.8198 },
  '뉴욕':      { lat: 40.7128,  lon: -74.0060 },
  '발리':      { lat: -8.3405,  lon: 115.0920 },
};

const GEO_RADIUS_KM = 30;

function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function resolveCoords(locationText) {
  if (!locationText) return null;
  for (const [city, coords] of Object.entries(CITY_COORDS)) {
    if (locationText.includes(city)) return coords;
  }
  return null;
}

function filterByRadius(results, { lat, lon, radiusKm = GEO_RADIUS_KM }) {
  return results.filter(r => {
    if (r.lat == null || r.lng == null) return true;
    return haversineKm(lat, lon, r.lat, r.lng) <= radiusKm;
  });
}

module.exports = { haversineKm, resolveCoords, filterByRadius, CITY_COORDS, GEO_RADIUS_KM };
