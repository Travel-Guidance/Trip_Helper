'use strict';

// TomTom Traffic Incidents API + Overpass API 기반 안전 경로 분석
// TomTom: developer.tomtom.com (무료 2,500건/일, 신용카드 불필요)
// Overpass: 완전 무료, API 키 불필요 (도로 조명 데이터)

const TOMTOM_BASE  = 'https://api.tomtom.com/traffic/services/5/incidentDetails';
const OVERPASS_API = 'https://overpass-api.de/api/interpreter';

const SEVERITY_WEIGHT = { 4: 3, 3: 2, 2: 1, 1: 0.5 }; // TomTom magnitudeOfDelay: 4=major

// km 단위 반경 → bbox (minLon,minLat,maxLon,maxLat)
function toBbox(lat, lng, radiusKm) {
  const delta = radiusKm / 111;
  return `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`;
}

async function fetchTomTomIncidents({ lat, lng, radiusKm = 2 }) {
  const apiKey = process.env.TOMTOM_API_KEY;
  if (!apiKey) return [];

  const bbox   = toBbox(lat, lng, radiusKm);
  const fields  = encodeURIComponent(
    '{incidents{type,properties{id,iconCategory,magnitudeOfDelay,events{description},startTime,from,to}}}'
  );
  const url = `${TOMTOM_BASE}?bbox=${bbox}&fields=${fields}&language=ko-KR&t=1111&timeValidityFilter=present&key=${apiKey}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) return [];

  const data = await res.json();
  return data?.incidents ?? [];
}

async function fetchLighting({ lat, lng, radiusM = 300 }) {
  const query = `
    [out:json][timeout:10];
    (
      node["highway"="street_lamp"](around:${radiusM},${lat},${lng});
      way["lit"="yes"](around:${radiusM},${lat},${lng});
    );
    out count;
  `;
  const res = await fetch(OVERPASS_API, {
    method:  'POST',
    body:    `data=${encodeURIComponent(query)}`,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    signal:  AbortSignal.timeout(10000),
  });
  if (!res.ok) return null;
  const data = await res.json();
  return Number(data?.elements?.[0]?.tags?.total ?? 0);
}

function calcRiskScore(incidents) {
  return incidents.reduce((sum, inc) => {
    const mag = inc.properties?.magnitudeOfDelay ?? 1;
    return sum + (SEVERITY_WEIGHT[mag] ?? 0.5);
  }, 0);
}

function lightingLabel(count) {
  if (count === null) return '조명 정보 없음';
  if (count >= 5)     return '조명 충분';
  if (count >= 1)     return '조명 보통';
  return '조명 부족';
}

function riskLevel(score) {
  if (score === 0) return 'safe';
  if (score <= 3)  return 'caution';
  return 'warn';
}

function buildRouteDesc({ level, total, lampCount }) {
  const parts = [];
  if (total === 0)    parts.push('사고 이력 없음');
  else                parts.push(`사고 ${total}건 감지`);
  parts.push(lightingLabel(lampCount));
  if (level === 'warn')    parts.push('우회 강력 권고');
  else if (level === 'caution') parts.push('야간 주의');
  return parts.join(' · ');
}

async function analyzeRoute({ lat, lng, radiusKm = 2 }) {
  const [incidents, lampCount] = await Promise.all([
    fetchTomTomIncidents({ lat, lng, radiusKm }),
    fetchLighting({ lat, lng, radiusM: 300 }),
  ]);

  const score = calcRiskScore(incidents);
  const level = riskLevel(score);
  const total = incidents.length;

  return {
    level,
    incidentCount: total,
    lighting:      lightingLabel(lampCount),
    safeRouteDesc: buildRouteDesc({ level, total, lampCount }),
    rawIncidents:  incidents.slice(0, 5).map(inc => ({
      title:    inc.properties?.events?.[0]?.description ?? inc.properties?.iconCategory ?? '사고',
      from:     inc.properties?.from ?? '',
      to:       inc.properties?.to   ?? '',
      severity: inc.properties?.magnitudeOfDelay ?? 1,
    })),
  };
}

module.exports = { analyzeRoute };
