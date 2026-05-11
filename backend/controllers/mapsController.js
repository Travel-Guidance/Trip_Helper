'use strict';

const { requireEnv } = require('../utils/env')
const { createError } = require('../utils/errors')
const { geocodePlace } = require('../services/geocodeService')

const routeCache = new Map()
const ROUTE_CACHE_TTL = 60 * 60 * 1000  // 1시간

function getCachedRoute(key) {
  const item = routeCache.get(key)
  if (!item || item.expiresAt < Date.now()) { routeCache.delete(key); return null }
  return item.value
}
function setCachedRoute(key, value) {
  routeCache.set(key, { value, expiresAt: Date.now() + ROUTE_CACHE_TTL })
  return value
}

const getEmbedUrl = (req, res, next) => {
  try {
    const key = requireEnv('GOOGLE_MAPS_API_KEY')

    const { lat, lng } = req.query
    const query = String(req.query.query || '').trim()
    const target = lat && lng ? `${lat},${lng}` : query

    if (!target) throw createError('지도 검색어 또는 좌표가 필요합니다.', 400)

    const encodedTarget = encodeURIComponent(target)
    res.json({
      embedUrl: `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${encodedTarget}&zoom=15`,
      externalUrl: `https://www.google.com/maps/search/?api=1&query=${encodedTarget}`,
    })
  } catch (err) {
    next(err)
  }
}

// "써큘러 키 (Circular Quay), 호주" → "Circular Quay, 호주"
function simplifyName(name) {
  const english = name.match(/\(([A-Za-z][^)]+)\)/)
  return english ? english[1] + name.replace(/.*\)/, '') : name
}

function parseLatLng(str) {
  const m = String(str).match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/)
  return m ? { lat: parseFloat(m[1]), lng: parseFloat(m[2]) } : null
}

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatMins(totalMins) {
  const h = Math.floor(totalMins / 60)
  const m = totalMins % 60
  if (h === 0) return `약 ${m}분`
  return m === 0 ? `약 ${h}시간` : `약 ${h}시간 ${m}분`
}

function estimateByDistance(km) {
  if (km < 1.5) {
    const mins = Math.max(5, Math.round(km * 15))
    return { found: true, distance: `${Math.round(km * 1000)}m`, duration: formatMins(mins), durationSeconds: mins * 60, mode: 'walking', estimated: true }
  }
  if (km < 50) {
    const mins = Math.round(km * 2 + 5)   // 대중교통 평균 30km/h + 환승 5분
    return { found: true, distance: `${km.toFixed(1)}km`, duration: formatMins(mins), durationSeconds: mins * 60, mode: 'transit', estimated: true }
  }
  if (km < 400) {
    const mins = Math.round(km / 80 * 60) // 자동차 평균 80km/h
    return { found: true, distance: `${Math.round(km)}km`, duration: formatMins(mins), durationSeconds: mins * 60, mode: 'driving', estimated: true }
  }
  // 장거리 항공편: 800km/h + 공항 수속 2시간
  const mins = Math.round(km / 800 * 60) + 120
  return { found: true, distance: `${Math.round(km)}km`, duration: formatMins(mins), durationSeconds: mins * 60, mode: 'flying', estimated: true }
}

async function queryMatrix(origins, destinations, mode, key) {
  const params = new URLSearchParams({ origins, destinations, mode, key, language: 'ko' })
  const res = await fetch(`https://maps.googleapis.com/maps/api/distancematrix/json?${params}`)
  if (!res.ok) return null
  const data = await res.json()
  console.log('[mapsRoute] status:', data.status, '| element status:', data.rows?.[0]?.elements?.[0]?.status, '| error:', data.error_message)
  const element = data.rows?.[0]?.elements?.[0]
  return element?.status === 'OK' ? element : null
}

const getRoute = async (req, res, next) => {
  try {
    const key = requireEnv('GOOGLE_MAPS_API_KEY')
    const { origin, destination } = req.query

    if (!origin || !destination) throw createError('origin과 destination이 필요합니다.', 400)

    const o = simplifyName(origin)
    const d = simplifyName(destination)

    const cacheKey = `${o}||${d}`
    const cached = getCachedRoute(cacheKey)
    if (cached) return res.json(cached)

    // transit과 driving을 동시에 시도해 더 빠른 것 선택
    const [transitEl, drivingEl] = await Promise.all([
      queryMatrix(o, d, 'transit', key),
      queryMatrix(o, d, 'driving', key),
    ])

    let element = null
    let mode = 'transit'

    if (transitEl && drivingEl) {
      // 둘 다 성공 → 더 빠른 쪽 선택
      if (drivingEl.duration.value < transitEl.duration.value) {
        element = drivingEl; mode = 'driving'
      } else {
        element = transitEl; mode = 'transit'
      }
    } else {
      element = transitEl || drivingEl
      mode   = transitEl ? 'transit' : 'driving'
    }

    // 1.5km 이하면 도보로 전환
    if (element?.distance?.value <= 1500) {
      const walkEl = await queryMatrix(o, d, 'walking', key)
      if (walkEl) { element = walkEl; mode = 'walking' }
    }

    // 마지막 폴백
    if (!element) {
      const walkEl = await queryMatrix(o, d, 'walking', key)
      if (walkEl) { element = walkEl; mode = 'walking' }
    }

    const oCoords = parseLatLng(o)
    const dCoords = parseLatLng(d)

    // 400km 초과 도로 결과는 실제로 비행이므로 직선거리 기반 항공 추정으로 전환
    if (element?.distance?.value > 400000 && oCoords && dCoords) {
      const km = haversineKm(oCoords.lat, oCoords.lng, dCoords.lat, dCoords.lng)
      return res.json(setCachedRoute(cacheKey, estimateByDistance(km)))
    }

    if (!element) {
      if (oCoords && dCoords) {
        const km = haversineKm(oCoords.lat, oCoords.lng, dCoords.lat, dCoords.lng)
        return res.json(setCachedRoute(cacheKey, estimateByDistance(km)))
      }
      return res.json(setCachedRoute(cacheKey, { found: false }))
    }

    const result = {
      found:           true,
      distance:        element.distance?.text,
      duration:        element.duration?.text,
      durationSeconds: element.duration?.value ?? null,
      mode,
    }
    res.json(setCachedRoute(cacheKey, result))
  } catch (err) {
    next(err)
  }
}

const geocode = async (req, res, next) => {
  try {
    const query = String(req.query.query || '').trim()
    if (!query) throw createError('좌표를 찾을 장소명이 필요합니다.', 400)

    const result = await geocodePlace(query)
    if (!result) return res.json({ found: false })

    res.json({ found: true, ...result })
  } catch (err) {
    next(err)
  }
}

module.exports = { getEmbedUrl, getRoute, geocode }
