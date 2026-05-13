'use strict';

// Open-Meteo 기반 여행 기간 날씨 조회 서비스 (API 키 불필요)

const FORECAST_MAX_DAYS = 16;

const { toEnglishName } = require('../data/countries');

// WMO 날씨 코드 → 한국어 레이블
const WMO_LABELS = {
  0: '맑음', 1: '대체로 맑음', 2: '구름 많음', 3: '흐림',
  45: '안개', 48: '안개',
  51: '이슬비', 53: '이슬비', 55: '이슬비',
  61: '비', 63: '비', 65: '강한 비',
  71: '눈', 73: '눈', 75: '강한 눈', 77: '싸락눈',
  80: '소나기', 81: '소나기', 82: '강한 소나기',
  85: '눈 소나기', 86: '눈 소나기',
  95: '뇌우', 96: '뇌우', 99: '뇌우',
};

function wmoLabel(code) {
  return WMO_LABELS[code] ?? '흐림';
}

function outdoorRecommendation(precipProb, code) {
  if (precipProb >= 60 || (code >= 61 && code <= 99)) return '실내 위주 권장';
  if (precipProb >= 35) return '우산 준비, 실내 비중 높임';
  return '야외 활동 적합';
}

function daysFromToday(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return (new Date(dateStr) - today) / 86400000;
}

async function geocodeDestination(destination) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(destination)}&count=1&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Geocoding HTTP ${res.status}`);
  const data = await res.json();
  const hit = data.results?.[0];
  if (!hit) return null;
  return { lat: hit.latitude, lng: hit.longitude };
}

async function fetchForecast(lat, lng, startDate, endDate) {
  // 예보 범위는 최대 16일이므로 endDate를 클램핑
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxEnd = new Date(today);
  maxEnd.setDate(today.getDate() + FORECAST_MAX_DAYS - 1);
  const clampedEnd = new Date(endDate) > maxEnd ? maxEnd.toISOString().slice(0, 10) : endDate;

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}`
    + `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_probability_max`
    + `&timezone=auto&start_date=${startDate}&end_date=${clampedEnd}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast HTTP ${res.status}`);
  return res.json();
}

async function fetchClimateArchive(lat, lng, startDate, endDate) {
  // 과거 동일 시기 데이터로 기후 패턴 추정 (전년도 같은 날짜 사용)
  const refYear = new Date().getFullYear() - 1;
  const archiveStart = `${refYear}${startDate.slice(4)}`;
  const archiveEnd = `${refYear}${endDate.slice(4)}`;

  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}`
    + `&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum`
    + `&timezone=auto&start_date=${archiveStart}&end_date=${archiveEnd}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Archive HTTP ${res.status}`);
  const data = await res.json();

  // precipitation_sum(mm) → 강수확률(%) 근사 변환
  if (data.daily?.precipitation_sum) {
    data.daily.precipitation_probability_max = data.daily.precipitation_sum.map(mm => {
      if (mm == null) return 30;
      if (mm > 10) return 85;
      if (mm > 5)  return 65;
      if (mm > 1)  return 45;
      return 15;
    });
  }
  return data;
}

function formatSummary(dailyData, startDate) {
  const { time, weathercode, temperature_2m_max, temperature_2m_min, precipitation_probability_max } = dailyData.daily || {};
  if (!time?.length) return '';

  const start = new Date(startDate);
  return time.map((_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const label = `${date.getMonth() + 1}/${date.getDate()}`;
    const code = weathercode?.[i] ?? 2;
    const tMax = temperature_2m_max?.[i]?.toFixed(0) ?? '?';
    const tMin = temperature_2m_min?.[i]?.toFixed(0) ?? '?';
    const precip = precipitation_probability_max?.[i] ?? 30;
    const rec = outdoorRecommendation(precip, code);
    return `  ${label}: ${wmoLabel(code)}, ${tMin}~${tMax}°C, 강수확률 ${precip}% → ${rec}`;
  }).join('\n');
}

async function getWeatherForTrip(destination, startDate, endDate) {
  if (!destination || !startDate || !endDate) return null;

  try {
    const coords = await geocodeDestination(toEnglishName(destination));
    if (!coords) {
      console.warn(`[Weather] 좌표 조회 실패: ${destination}`);
      return null;
    }

    const { lat, lng } = coords;
    const startDiff = daysFromToday(startDate);

    const data = startDiff <= FORECAST_MAX_DAYS
      ? await fetchForecast(lat, lng, startDate, endDate)
      : await fetchClimateArchive(lat, lng, startDate, endDate);

    const isArchive = startDiff > FORECAST_MAX_DAYS;
    const summary = formatSummary(data, startDate);
    if (!summary) return null;

    const header = isArchive
      ? `[여행 기간 날씨 — 전년도 동기 기후 패턴 기반]`
      : `[여행 기간 날씨 — Open-Meteo 실제 예보]`;
    return `${header}\n${summary}`;
  } catch (err) {
    console.warn(`[Weather] 조회 실패: ${err.message}`);
    return null;
  }
}

// ── 날씨 아이콘 ────────────────────────────────────────────────
function weatherIcon(code) {
  if (code === 0) return '☀';
  if (code <= 2)  return '🌤';
  if (code === 3) return '☁';
  if (code <= 48) return '🌫';
  if (code <= 55) return '🌦';
  if (code <= 65) return '🌧';
  if (code <= 77) return '❄';
  if (code <= 82) return '⛈';
  if (code <= 86) return '🌨';
  return '⛈';
}

// ── 시간대 평균 계산 ────────────────────────────────────────────
function avgHours(arr, start, end) {
  if (!Array.isArray(arr)) return null;
  const slice = arr.slice(start, end + 1).filter(v => v != null);
  if (!slice.length) return null;
  return Math.round(slice.reduce((a, b) => a + b, 0) / slice.length);
}

// ── 옷차림 추천 ─────────────────────────────────────────────────
function buildOutfitAdvice(morning, afternoon, evening, isRainy, isSnowy, precipProb) {
  const items = [];
  const temps = [morning, afternoon, evening].filter(v => v != null);
  const maxTemp = temps.length ? Math.max(...temps) : null;
  const minTemp = temps.length ? Math.min(...temps) : null;
  const swing   = maxTemp != null && minTemp != null ? maxTemp - minTemp : 0;

  // 강수
  if (isSnowy) {
    items.push('두꺼운 패딩 또는 코트', '기모 내복', '방수 장갑', '방수 부츠');
  } else if (isRainy || precipProb >= 60) {
    items.push('방수 재킷 또는 우비', '접이식 우산', '미끄럼방지 밑창 신발');
  } else if (precipProb >= 35) {
    items.push('접이식 우산 (예비)');
  }

  // 기온 기반 의류
  if (maxTemp < 5) {
    items.unshift('두꺼운 패딩', '기능성 내복', '두꺼운 장갑');
  } else if (maxTemp < 12) {
    items.unshift('두꺼운 코트 또는 패딩', '따뜻한 니트');
  } else if (maxTemp < 18) {
    items.unshift('가벼운 재킷 또는 카디건', '긴소매 상의');
  } else if (maxTemp < 25) {
    items.unshift('얇은 겉옷 (아침·저녁 대비)');
  } else {
    items.unshift('통기성 좋은 얇은 옷', '선크림');
  }

  // 시간대별 설명
  const parts = [];
  if (morning != null) {
    if      (morning <= 10) parts.push(`아침(${morning}°)은 꽤 추워요`);
    else if (morning <= 15) parts.push(`아침(${morning}°)은 쌀쌀해요`);
    else if (morning >= 26) parts.push(`아침(${morning}°)부터 더워요`);
    else                    parts.push(`아침(${morning}°)은 선선해요`);
  }
  if (afternoon != null) {
    if      (afternoon >= 30) parts.push(`낮(${afternoon}°)은 무더워요 — 반팔 OK`);
    else if (afternoon >= 24) parts.push(`낮(${afternoon}°)은 꽤 따뜻해요`);
    else if (afternoon >= 18) parts.push(`낮(${afternoon}°)은 적당해요`);
    else if (afternoon <= 10) parts.push(`낮(${afternoon}°)도 추워요`);
    else                      parts.push(`낮(${afternoon}°)은 쌀쌀해요`);
  }
  if (evening != null) {
    if      (evening <= 8)  parts.push(`저녁(${evening}°)은 많이 추워져요`);
    else if (evening <= 14) parts.push(`저녁(${evening}°)은 쌀쌀해지니 겉옷 필수`);
    else if (evening >= 24) parts.push(`저녁(${evening}°)도 따뜻해요`);
    else                    parts.push(`저녁(${evening}°)은 선선해요`);
  }

  let summary = parts.join(' → ');
  if (swing >= 12) summary += `. 일교차가 ${swing}°나 돼요 — 레이어링이 핵심입니다.`;
  else if (swing >= 7) summary += `. 일교차가 있으니 겉옷을 챙기세요.`;
  if (isRainy) summary += (summary ? ' ' : '') + '비가 오니 우산은 필수예요.';

  return { summary, items: [...new Set(items)] };
}

// ── 하루 시간대별 날씨 상세 조회 ────────────────────────────────
async function fetchHourlyForecast(lat, lng, date) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}`
    + `&hourly=temperature_2m,apparent_temperature,precipitation_probability,weathercode`
    + `&timezone=auto&start_date=${date}&end_date=${date}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo forecast ${res.status}`);
  return res.json();
}

async function fetchHourlyArchive(lat, lng, date) {
  // 전년도 같은 날짜로 기후 패턴 추정
  const refYear   = new Date().getFullYear() - 1;
  const archiveDate = `${refYear}${date.slice(4)}`;
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}`
    + `&hourly=temperature_2m,apparent_temperature,precipitation_sum,weathercode`
    + `&timezone=auto&start_date=${archiveDate}&end_date=${archiveDate}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Open-Meteo archive ${res.status}`);
  const data = await res.json();
  // precipitation_sum(mm) → 강수확률 근사
  if (data.hourly?.precipitation_sum) {
    data.hourly.precipitation_probability = data.hourly.precipitation_sum.map(mm => {
      if (mm == null) return 20;
      if (mm > 5)  return 85;
      if (mm > 2)  return 60;
      if (mm > 0)  return 40;
      return 10;
    });
  }
  return data;
}

async function getDayWeatherDetail(destination, date) {
  if (!destination || !date) return null;
  try {
    const coords = await geocodeDestination(toEnglishName(destination));
    if (!coords) return null;
    const { lat, lng } = coords;

    const isBeyondForecast = daysFromToday(date) > FORECAST_MAX_DAYS;
    const data = isBeyondForecast
      ? await fetchHourlyArchive(lat, lng, date)
      : await fetchHourlyForecast(lat, lng, date);

    const { temperature_2m, apparent_temperature, precipitation_probability, weathercode } = data.hourly || {};
    if (!temperature_2m) return null;

    const morningTemp    = avgHours(temperature_2m, 7, 10);
    const afternoonTemp  = avgHours(temperature_2m, 12, 16);
    const eveningTemp    = avgHours(temperature_2m, 18, 21);
    const morningFeels   = avgHours(apparent_temperature, 7, 10);
    const afternoonFeels = avgHours(apparent_temperature, 12, 16);
    const eveningFeels   = avgHours(apparent_temperature, 18, 21);

    const maxPrecip     = Math.max(...(precipitation_probability || [0]));
    const dominantCode  = weathercode?.[13] ?? weathercode?.[0] ?? 2;
    const isRainy = maxPrecip >= 60 || (dominantCode >= 61 && dominantCode <= 99);
    const isSnowy = dominantCode >= 71 && dominantCode <= 86;

    const outfit = buildOutfitAdvice(morningTemp, afternoonTemp, eveningTemp, isRainy, isSnowy, maxPrecip);

    return {
      date,
      icon: weatherIcon(dominantCode),
      weatherLabel: wmoLabel(dominantCode),
      isRainy,
      isSnowy,
      precipProb: maxPrecip,
      morning:   { temp: morningTemp,   feels: morningFeels },
      afternoon: { temp: afternoonTemp, feels: afternoonFeels },
      evening:   { temp: eveningTemp,   feels: eveningFeels },
      outfit,
    };
  } catch (err) {
    console.warn(`[Weather] 시간대 조회 실패: ${err.message}`);
    return null;
  }
}

module.exports = { getWeatherForTrip, getDayWeatherDetail };
