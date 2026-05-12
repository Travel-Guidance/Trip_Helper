'use strict';

const LONG_SEGMENT_KM = 400;
const NORMAL_DAY_SEGMENT_KM = 100;
const SAME_DAY_RETURN_KM = 250;
const REGION_MOVE_KM = 350;

const AUSTRALIA_REGIONS = [
  { key: 'sydney', label: 'Sydney', aliases: ['sydney', '시드니'], lat: -33.8688, lng: 151.2093 },
  { key: 'melbourne', label: 'Melbourne', aliases: ['melbourne', '멜버른'], lat: -37.8136, lng: 144.9631 },
  { key: 'cairns', label: 'Cairns/Great Barrier Reef', aliases: ['cairns', '케언즈', 'great barrier reef', '그레이트 배리어 리프'], lat: -16.9186, lng: 145.7781 },
  { key: 'brisbane', label: 'Brisbane', aliases: ['brisbane', '브리즈번'], lat: -27.4698, lng: 153.0251 },
  { key: 'gold-coast', label: 'Gold Coast', aliases: ['gold coast', '골드코스트', '골드 코스트'], lat: -28.0167, lng: 153.4 },
  { key: 'uluru', label: 'Uluru', aliases: ['uluru', 'ayers rock', '울루루', '에어즈 록'], lat: -25.3444, lng: 131.0369 },
  { key: 'perth', label: 'Perth', aliases: ['perth', '퍼스'], lat: -31.9523, lng: 115.8613 },
  { key: 'adelaide', label: 'Adelaide', aliases: ['adelaide', '애들레이드'], lat: -34.9285, lng: 138.6007 },
  { key: 'tasmania', label: 'Tasmania', aliases: ['tasmania', 'hobart', '태즈메이니아', '호바트'], lat: -42.8821, lng: 147.3272 },
  { key: 'darwin', label: 'Darwin', aliases: ['darwin', '다윈'], lat: -12.4634, lng: 130.8456 },
  { key: 'canberra', label: 'Canberra', aliases: ['canberra', '캔버라'], lat: -35.2809, lng: 149.13 },
];

const AUSTRALIA_DESTINATIONS = new Set([
  '호주',
  '오스트레일리아',
  'australia',
  'au',
  'oceania',
]);

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function hasCoordinates(item) {
  return toNumber(item?.lat) != null && toNumber(item?.lng) != null;
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const radiusKm = 6371;
  const toRad = degree => degree * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function destinationText(params = {}) {
  return String(params.country || params.destination || params.dest || params.continent || '').trim();
}

function looksLikeAustraliaTrip(params = {}, plan = {}) {
  const dest = destinationText(params).toLowerCase();
  if (AUSTRALIA_DESTINATIONS.has(dest) || dest.includes('australia')) return true;
  if (textRegion(dest)) return true;

  const text = [
    params.mustVisit,
    ...(plan.includedPlaces || []),
    ...(plan.omittedPlaces || []).map(place => place?.name),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return Boolean(textRegion(text)) ||
    /(sydney|melbourne|cairns|uluru|ayers rock|brisbane|gold coast|perth|adelaide|tasmania|great barrier reef)/.test(text);
}

function isTransferItem(item = {}) {
  const text = `${item.name || ''} ${item.note || ''}`.toLowerCase();
  return /(flight|airport|transfer|train|station|check-?in|check-?out|domestic|terminal|항공|공항|비행|이동|체크인|체크아웃|기차|역)/.test(text);
}

function isVaguePlaceName(item = {}) {
  const name = String(item.name || '').trim().toLowerCase();
  if (!name) return true;

  return [
    /^점심\s*식사$/,
    /^저녁\s*식사$/,
    /^아침\s*식사$/,
    /^식사$/,
    /^자유\s*시간/,
    /^쇼핑$/,
    /^자유시간\s*및\s*쇼핑$/,
    /^카페$/,
    /^근처\s*(맛집|카페|식당)/,
    /^로컬\s*(맛집|카페|식당)/,
    /^현지\s*(맛집|카페|식당)/,
    /^lunch$/,
    /^dinner$/,
    /^breakfast$/,
    /^free\s*time/,
    /^shopping$/,
    /^local\s*(restaurant|cafe)/,
  ].some(pattern => pattern.test(name));
}

function dayLooksLikeTransferDay(items = []) {
  if (!items.length) return false;
  const transferCount = items.filter(isTransferItem).length;
  return transferCount >= 2 && items.length <= 4;
}

function formatKm(km) {
  return `${Math.round(km)}km`;
}

function itemLabel(item) {
  return String(item?.name || 'unnamed place');
}

function normalizeDate(value) {
  if (!value) return '';
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return '';
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function addDays(dateValue, days) {
  const match = String(dateValue || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return '';
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return '';
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function textRegion(value) {
  const text = String(value || '').toLowerCase();
  if (!text) return null;
  return AUSTRALIA_REGIONS.find(region =>
    region.aliases.some(alias => text.includes(alias))
  ) || null;
}

function nearestRegion(lat, lng) {
  const matches = AUSTRALIA_REGIONS
    .map(region => ({
      ...region,
      distanceKm: haversineKm(lat, lng, region.lat, region.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm);

  return matches[0] || null;
}

function estimateRegionFromItems(items = []) {
  const sightseeingItems = items.filter(item =>
    hasCoordinates(item) &&
    !isTransferItem(item) &&
    !item.isHotel
  );

  if (!sightseeingItems.length) return null;

  const votes = new Map();
  let latSum = 0;
  let lngSum = 0;

  sightseeingItems.forEach(item => {
    const lat = Number(item.lat);
    const lng = Number(item.lng);
    latSum += lat;
    lngSum += lng;
    const region = nearestRegion(lat, lng);
    if (!region) return;
    const current = votes.get(region.key) || { region, count: 0, distanceSum: 0 };
    current.count += 1;
    current.distanceSum += region.distanceKm;
    votes.set(region.key, current);
  });

  const center = {
    lat: latSum / sightseeingItems.length,
    lng: lngSum / sightseeingItems.length,
  };

  const best = [...votes.values()]
    .sort((a, b) => b.count - a.count || a.distanceSum - b.distanceSum)[0];

  if (!best) return null;

  return {
    ...best.region,
    center,
    itemCount: sightseeingItems.length,
  };
}

function accommodationText(accommodation = {}) {
  return [
    accommodation.name,
    accommodation.location,
    accommodation.searchQuery,
  ].filter(Boolean).join(' ');
}

function accommodationRegion(accommodation = {}) {
  const coords = accommodation.coordinates || {};
  const lat = toNumber(coords.lat ?? coords.latitude);
  const lng = toNumber(coords.lng ?? coords.longitude);
  if (lat != null && lng != null) return nearestRegion(lat, lng);
  return textRegion(accommodationText(accommodation));
}

function hotelRegionForDay(day = {}, plan = {}, date = '') {
  const baseHotel = String(day.baseHotel || '').trim();
  const accommodations = Array.isArray(plan.accommodations) ? plan.accommodations : [];
  const matched = accommodations.find(acc => {
    const checkIn = normalizeDate(acc.checkIn);
    const checkOut = normalizeDate(acc.checkOut);
    const coversDate = checkIn && checkOut && date ? date >= checkIn && date < checkOut : false;
    const nameMatches = baseHotel && String(acc.name || '').trim() === baseHotel;
    return coversDate || nameMatches;
  });

  if (matched) return accommodationRegion(matched);
  return textRegion(baseHotel);
}

function accommodationCoversRegionOnDate(plan = {}, region, date = '') {
  const accommodations = Array.isArray(plan.accommodations) ? plan.accommodations : [];
  return accommodations.some(acc => {
    const accRegion = accommodationRegion(acc);
    if (!accRegion || accRegion.key !== region.key) return false;

    const checkIn = normalizeDate(acc.checkIn);
    const checkOut = normalizeDate(acc.checkOut);
    if (!date || !checkIn || !checkOut) return true;
    return date >= checkIn && date < checkOut;
  });
}

function dayDate(params = {}, dayIndex) {
  const startDate = normalizeDate(params.startDate);
  return startDate ? addDays(startDate, dayIndex) : '';
}

function validateAccommodationMovement(plan, params, violations) {
  const summaries = plan.days.map((day, index) => {
    const region = estimateRegionFromItems(day.items || []);
    const date = dayDate(params, index);
    return {
      day,
      index,
      date,
      region,
      hotelRegion: hotelRegionForDay(day, plan, date),
      transferDay: dayLooksLikeTransferDay(day.items || []),
    };
  });

  let previous = summaries.find(summary => summary.region) || null;

  for (let index = previous ? previous.index + 1 : 1; index < summaries.length; index++) {
    const current = summaries[index];
    if (!current.region) continue;
    if (!previous || previous.region.key === current.region.key) {
      previous = current;
      continue;
    }

    const moveKm = haversineKm(
      previous.region.center.lat,
      previous.region.center.lng,
      current.region.center.lat,
      current.region.center.lng,
    );
    if (moveKm < REGION_MOVE_KM) {
      previous = current;
      continue;
    }

    const dayLabel = current.day.label || current.day.theme || `day ${index + 1}`;
    const transferBetween = summaries
      .slice(previous.index + 1, current.index + 1)
      .some(summary => summary.transferDay);
    const hasArrivalHotel = current.hotelRegion?.key === current.region.key;

    if (!hasArrivalHotel) {
      violations.push({
        day: dayLabel,
        type: 'arrival_region_base_hotel_missing',
        message: `${dayLabel} moves from ${previous.region.label} to ${current.region.label} (${formatKm(moveKm)}). After this long-distance move, day.baseHotel must be an accommodation in or near ${current.region.label}, not the previous region.`,
      });
    }

    if (!accommodationCoversRegionOnDate(plan, current.region, current.date)) {
      violations.push({
        day: dayLabel,
        type: 'arrival_region_accommodation_missing',
        message: `${dayLabel} needs an accommodation entry covering ${current.date || 'that night'} in ${current.region.label}. Add or adjust accommodations with checkIn/checkOut dates and use that accommodation as baseHotel after the move.`,
      });
    }

    if (!current.transferDay && !transferBetween) {
      violations.push({
        day: dayLabel,
        type: 'long_region_move_without_transfer_day',
        message: `${dayLabel} starts sightseeing in ${current.region.label} after leaving ${previous.region.label} (${formatKm(moveKm)}). Treat this as a long-distance transfer with arrival accommodation check-in before local sightseeing, or move sightseeing to the following day.`,
      });
    }

    previous = current;
  }
}

function validateAustraliaItinerary(plan, params = {}) {
  if (!plan?.days?.length || !looksLikeAustraliaTrip(params, plan)) {
    return { valid: true, violations: [] };
  }

  const violations = [];

  for (const day of plan.days) {
    for (const item of day.items || []) {
      if (isTransferItem(item)) continue;
      if (!isVaguePlaceName(item)) continue;

      violations.push({
        day: day.label || day.theme || 'day',
        type: 'vague_place_name',
        message: `${itemLabel(item)} is too vague for mapping and route planning. Replace it with a real venue or exact place name in the same region, with accurate coordinates.`,
      });
    }
  }

  for (const day of plan.days) {
    const items = Array.isArray(day.items) ? day.items.filter(hasCoordinates) : [];
    if (items.length < 2) continue;

    const transferDay = dayLooksLikeTransferDay(day.items || []);

    for (let index = 1; index < items.length; index++) {
      const previous = items[index - 1];
      const current = items[index];
      const km = haversineKm(
        Number(previous.lat),
        Number(previous.lng),
        Number(current.lat),
        Number(current.lng),
      );

      if (km > LONG_SEGMENT_KM && !transferDay) {
        violations.push({
          day: day.label || day.theme || 'day',
          type: 'long_same_day_segment',
          message: `${itemLabel(previous)} -> ${itemLabel(current)} is ${formatKm(km)} on the same day. Split this into a one-way transfer day or omit one region.`,
        });
      } else if (km > NORMAL_DAY_SEGMENT_KM && !transferDay && !isTransferItem(previous) && !isTransferItem(current)) {
        violations.push({
          day: day.label || day.theme || 'day',
          type: 'wide_sightseeing_day',
          message: `${itemLabel(previous)} -> ${itemLabel(current)} is ${formatKm(km)}. Keep normal sightseeing days within one region.`,
        });
      }
    }

    const first = items[0];
    const last = items[items.length - 1];
    const returnKm = haversineKm(Number(first.lat), Number(first.lng), Number(last.lat), Number(last.lng));
    const hasLongHop = violations.some(v => v.day === (day.label || day.theme || 'day') && v.type === 'long_same_day_segment');

    if (hasLongHop && returnKm < SAME_DAY_RETURN_KM && !transferDay) {
      violations.push({
        day: day.label || day.theme || 'day',
        type: 'same_day_long_return',
        message: `${day.label || 'This day'} appears to do a long-distance trip and return to the original region. Australian long-distance moves must not be day-trip round trips.`,
      });
    }
  }

  validateAccommodationMovement(plan, params, violations);

  return { valid: violations.length === 0, violations };
}

function buildItineraryRepairPrompt(plan, violations) {
  const summary = violations.map((violation, index) => `${index + 1}. [${violation.day}] ${violation.message}`).join('\n');

  return `The itinerary has unrealistic Australia routing. Fix it and return strict JSON only.

Violations:
${summary}

Rules for the correction:
- Do not choose a default city. Use the user's requested places and trip length.
- Cluster places by region/city first.
- Keep same-day sightseeing within one region.
- Any segment over 400km must be a one-way transfer day with arrival accommodation check-in, not a day-trip return.
- When moving between distant Australian regions, move the accommodation as well. The arrival day and all following local sightseeing days must use a baseHotel in the arrival region.
- Add a separate accommodations entry for each region/city stay. Its checkIn/checkOut dates must cover the days whose baseHotel uses that accommodation.
- If a violation says an arrival-region accommodation is missing, add or replace the accommodation for that region and update day.baseHotel to match it.
- Keep the rich itinerary fields. Each day must include summary and routeStrategy, and each item must include duration, cost, reservation, transportTip, and backup.
- Replace vague items such as "점심 식사", "자유시간 및 쇼핑", "근처 맛집", "로컬 카페", or "shopping" with real place names in the same region. Meals must use actual restaurant/cafe names.
- If the trip length cannot include all requested places, move the impossible places to omittedPlaces with reasons.
- Preserve the existing JSON shape and include includedPlaces and omittedPlaces.

Current itinerary JSON:
${JSON.stringify(plan)}`;
}

module.exports = {
  validateAustraliaItinerary,
  buildItineraryRepairPrompt,
};
