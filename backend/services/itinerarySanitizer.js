'use strict';

const NORMAL_SIGHTSEEING_MAX_KM = 120;
const TOUR_ROUNDTRIP_MAX_KM = 240; // about 6 hours round trip by bus at ~80km/h
const CROSS_REGION_MAX_KM = 300;

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

const AUSTRALIA_DESTINATIONS = new Set(['호주', '오스트레일리아', 'australia', 'au', 'oceania']);

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

function textRegion(value) {
  const text = String(value || '').toLowerCase();
  if (!text) return null;
  return AUSTRALIA_REGIONS.find(region =>
    region.aliases.some(alias => text.includes(alias))
  ) || null;
}

function isAustraliaTrip(params = {}, plan = {}) {
  const dest = destinationText(params).toLowerCase();
  if (AUSTRALIA_DESTINATIONS.has(dest) || dest.includes('australia')) return true;
  if (textRegion(dest)) return true;

  const planText = [
    params.mustVisit,
    plan?.accommodations?.map(acc => `${acc.name || ''} ${acc.location || ''}`).join(' '),
    plan?.days?.map(day => `${day.theme || ''} ${(day.items || []).map(item => item.name).join(' ')}`).join(' '),
  ].filter(Boolean).join(' ');

  return Boolean(textRegion(planText));
}

function nearestRegion(lat, lng) {
  return AUSTRALIA_REGIONS
    .map(region => ({
      ...region,
      distanceKm: haversineKm(lat, lng, region.lat, region.lng),
    }))
    .sort((a, b) => a.distanceKm - b.distanceKm)[0] || null;
}

function isTransferItem(item = {}) {
  const text = `${item.name || ''} ${item.note || ''} ${item.transportTip || ''}`.toLowerCase();
  if (/(hotel|resort|inn|숙소|호텔|리조트).*(출발|도착|체크인|체크아웃|departure|arrival|check-?in|check-?out)/.test(text)) {
    return true;
  }
  return /(flight|airport|transfer|domestic|terminal|train|rail|항공|공항|비행|국내선|장거리 이동|숙소 이동|도시 이동|기차|열차)/.test(text);
}

function isHotelItem(item = {}) {
  return Boolean(item.isHotel) || /(hotel|resort|inn|숙소|호텔|리조트|체크인|체크아웃|복귀)/i.test(`${item.name || ''} ${item.note || ''}`);
}

function isTourItem(item = {}) {
  return /(tour|day trip|coach|bus tour|투어|원데이|당일|버스|코치|현지투어)/i.test(`${item.name || ''} ${item.note || ''} ${item.transportTip || ''}`);
}

function formatKm(km) {
  return `${Math.round(km)}km`;
}

function itemLabel(item) {
  return String(item?.name || '장소');
}

function primaryRegionForDay(items = []) {
  const votes = new Map();
  items.forEach(item => {
    if (!hasCoordinates(item) || isTransferItem(item) || isHotelItem(item)) return;
    const region = nearestRegion(Number(item.lat), Number(item.lng));
    if (!region) return;
    const current = votes.get(region.key) || { region, count: 0 };
    current.count += 1;
    votes.set(region.key, current);
  });

  return [...votes.values()].sort((a, b) => b.count - a.count)[0]?.region || null;
}

function accommodationRegion(accommodation = {}) {
  const coords = accommodation.coordinates || {};
  const lat = toNumber(coords.lat ?? coords.latitude);
  const lng = toNumber(coords.lng ?? coords.longitude);
  if (lat != null && lng != null) return nearestRegion(lat, lng);
  return textRegion(`${accommodation.name || ''} ${accommodation.location || ''} ${accommodation.searchQuery || ''}`);
}

function dayBaseRegion(day = {}, plan = {}) {
  const baseHotel = String(day.baseHotel || '').trim();
  const accommodations = Array.isArray(plan.accommodations) ? plan.accommodations : [];
  const matched = accommodations.find(acc => baseHotel && String(acc.name || '').trim() === baseHotel);
  return accommodationRegion(matched) || textRegion(baseHotel);
}

function shouldRemoveLongSightseeingItem(item, primaryRegion) {
  if (!primaryRegion || !hasCoordinates(item) || isTransferItem(item) || isHotelItem(item)) {
    return null;
  }

  const lat = Number(item.lat);
  const lng = Number(item.lng);
  const itemRegion = nearestRegion(lat, lng);
  const distanceFromPrimaryKm = haversineKm(primaryRegion.lat, primaryRegion.lng, lat, lng);

  if (isTourItem(item)) {
    if (distanceFromPrimaryKm > TOUR_ROUNDTRIP_MAX_KM) {
      return {
        distanceKm: distanceFromPrimaryKm,
        reason: `투어로 보기에도 왕복 6시간 기준을 넘는 장거리입니다. ${primaryRegion.label} 기준 약 ${formatKm(distanceFromPrimaryKm)} 떨어져 있습니다.`,
      };
    }
    return null;
  }

  if (itemRegion?.key !== primaryRegion.key && distanceFromPrimaryKm > CROSS_REGION_MAX_KM) {
    return {
      distanceKm: distanceFromPrimaryKm,
      reason: `같은 날 ${primaryRegion.label} 권역 일정에 섞인 다른 권역 장소입니다. 약 ${formatKm(distanceFromPrimaryKm)} 떨어져 숙소 이동일 없이는 제외했습니다.`,
    };
  }

  if (distanceFromPrimaryKm > NORMAL_SIGHTSEEING_MAX_KM) {
    return {
      distanceKm: distanceFromPrimaryKm,
      reason: `일반 관광 동선 기준인 편도 ${NORMAL_SIGHTSEEING_MAX_KM}km를 넘습니다. 약 ${formatKm(distanceFromPrimaryKm)} 떨어져 제외했습니다.`,
    };
  }

  return null;
}

function sanitizeAustraliaItinerary(plan, params = {}) {
  if (!plan?.days?.length || !isAustraliaTrip(params, plan)) return plan;

  const omitted = [];
  const days = plan.days.map(day => {
    const items = Array.isArray(day.items) ? day.items : [];
    const primaryRegion = dayBaseRegion(day, plan) || primaryRegionForDay(items);
    if (!primaryRegion) return day;

    const filteredItems = items.filter(item => {
      const removal = shouldRemoveLongSightseeingItem(item, primaryRegion);
      if (!removal) return true;

      omitted.push({
        name: itemLabel(item),
        reason: `${day.label || day.theme || '해당 일자'}: ${removal.reason}`,
        distanceKm: Math.round(removal.distanceKm),
      });
      return false;
    });

    return {
      ...day,
      items: filteredItems.length ? filteredItems : items,
    };
  });

  if (!omitted.length) return { ...plan, days };

  return {
    ...plan,
    days,
    omittedPlaces: [
      ...(Array.isArray(plan.omittedPlaces) ? plan.omittedPlaces : []),
      ...omitted,
    ],
    warnings: [
      ...(Array.isArray(plan.warnings) ? plan.warnings : []),
      {
        type: 'logistics',
        icon: '⚠️',
        title: '장거리 관광지 자동 제외',
        message: `숙소 이동이나 왕복 6시간 이내 투어로 보기 어려운 장거리 장소 ${omitted.length}곳을 일정에서 제외했습니다.`,
      },
    ],
  };
}

module.exports = {
  sanitizeAustraliaItinerary,
};
