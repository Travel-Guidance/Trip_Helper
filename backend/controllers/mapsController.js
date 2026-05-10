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

    if (!element) return res.json(setCachedRoute(cacheKey, { found: false }))

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
