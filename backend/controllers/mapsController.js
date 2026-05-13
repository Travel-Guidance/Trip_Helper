'use strict';

const { requireEnv } = require('../utils/env')
const { createError } = require('../utils/errors')
const { geocodePlace } = require('../services/geocodeService')

const routeCache = new Map()
const emergencyPlacesCache = new Map()
const ROUTE_CACHE_TTL = 60 * 60 * 1000  // 1시간
const EMERGENCY_PLACES_CACHE_TTL = 30 * 60 * 1000
const EMERGENCY_PLACE_TYPES = [
  { key: 'police', type: 'police', label: '경찰서' },
  { key: 'fire_station', type: 'fire_station', label: '소방서' },
  { key: 'hospital', type: 'hospital', label: '병원' },
]
const AMENITY_PLACE_TYPES = [
  { key: 'pharmacy', type: 'pharmacy', label: '약국', icon: '💊' },
  { key: 'hospital', type: 'hospital', label: '병원', icon: '🏥' },
  { key: 'convenience_store', type: 'convenience_store', label: '편의점', icon: '🛒' },
  { key: 'atm', type: 'atm', label: 'ATM', icon: '💸' },
  { key: 'public_bathroom', type: 'public_bathroom', label: '공공 화장실', icon: '🚻' },
]

const INDOOR_PLACE_TYPES = [
  {
    key: 'museum',
    types: ['museum', 'natural_history_museum', 'science_museum', 'history_museum', 'childrens_museum'],
    label: '박물관', icon: '🏛',
  },
  {
    key: 'art',
    types: ['art_gallery', 'art_studio', 'performing_arts_theater'],
    label: '미술관·공연', icon: '🎨',
  },
  {
    key: 'shopping',
    types: ['shopping_mall', 'department_store', 'market'],
    label: '쇼핑몰·백화점', icon: '🛍',
  },
  {
    key: 'entertainment',
    types: ['movie_theater', 'amusement_center', 'bowling_alley', 'casino', 'comedy_club', 'karaoke'],
    label: '엔터테인먼트', icon: '🎬',
  },
  {
    key: 'nature_indoor',
    types: ['aquarium', 'zoo', 'botanical_garden'],
    label: '아쿠아리움·동물원', icon: '🐟',
  },
  {
    key: 'culture',
    types: ['library', 'cultural_center', 'community_center', 'convention_center', 'exhibition_hall'],
    label: '문화시설', icon: '📚',
  },
  {
    key: 'wellness',
    types: ['spa', 'fitness_center', 'swimming_pool', 'sauna'],
    label: '스파·웰니스', icon: '🧖',
  },
]


function getCachedRoute(key) {
  const item = routeCache.get(key)
  if (!item || item.expiresAt < Date.now()) { routeCache.delete(key); return null }
  return item.value
}
function setCachedRoute(key, value) {
  routeCache.set(key, { value, expiresAt: Date.now() + ROUTE_CACHE_TTL })
  return value
}
function getCachedEmergencyPlaces(key) {
  const item = emergencyPlacesCache.get(key)
  if (!item || item.expiresAt < Date.now()) { emergencyPlacesCache.delete(key); return null }
  return item.value
}
function setCachedEmergencyPlaces(key, value) {
  emergencyPlacesCache.set(key, { value, expiresAt: Date.now() + EMERGENCY_PLACES_CACHE_TTL })
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

function normalizeEmergencyPlace(place, category) {
  const lat = place.location?.latitude
  const lng = place.location?.longitude
  return {
    id: place.id,
    category: category.key,
    categoryLabel: category.label,
    name: place.displayName?.text || category.label,
    address: place.formattedAddress || '',
    rating: place.rating || null,
    openNow: place.regularOpeningHours?.openNow ?? null,
    phoneNumber: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
    googleMapsUri: place.googleMapsUri || '',
    lat,
    lng,
  }
}

async function searchNearbyEmergencyPlaces({ lat, lng, radius, category, key }) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.regularOpeningHours',
        'places.internationalPhoneNumber',
        'places.nationalPhoneNumber',
        'places.googleMapsUri',
      ].join(','),
    },
    body: JSON.stringify({
      includedTypes: [category.type],
      languageCode: 'ko',
      rankPreference: 'DISTANCE',
      maxResultCount: 3,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius,
        },
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google Places ${response.status}: ${text}`)
  }

  const data = await response.json()
  return (data.places || []).map(place => normalizeEmergencyPlace(place, category))
}

const getEmergencyPlaces = async (req, res, next) => {
  try {
    const key = requireEnv('GOOGLE_MAPS_API_KEY')
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const radius = Math.min(Math.max(Number(req.query.radius) || 3000, 500), 10000)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw createError('lat과 lng가 필요합니다.', 400)
    }

    const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)},${Math.round(radius)}`
    const cached = getCachedEmergencyPlaces(cacheKey)
    if (cached) return res.json(cached)

    const groups = await Promise.all(EMERGENCY_PLACE_TYPES.map(async category => ({
      ...category,
      places: await searchNearbyEmergencyPlaces({ lat, lng, radius, category, key }),
    })))

    const result = {
      found: groups.some(group => group.places.length > 0),
      center: { lat, lng },
      radius,
      groups,
      mapUrl: `https://www.google.com/maps/search/emergency+services/@${lat},${lng},14z`,
    }

    res.json(setCachedEmergencyPlaces(cacheKey, result))
  } catch (err) {
    next(err)
  }
}

function normalizeAmenityPlace(place, category, center) {
  const lat = place.location?.latitude
  const lng = place.location?.longitude
  const meters = Number.isFinite(lat) && Number.isFinite(lng)
    ? Math.round(haversineKm(center.lat, center.lng, lat, lng) * 1000)
    : null

  const walkMinutes = meters == null ? null : Math.max(1, Math.round(meters / 80))

  return {
    id: place.id,
    category: category.key,
    categoryLabel: category.label,
    icon: category.icon,
    name: place.displayName?.text || category.label,
    address: place.formattedAddress || '',
    rating: place.rating || null,
    openNow: place.regularOpeningHours?.openNow ?? null,
    googleMapsUri: place.googleMapsUri || '',
    lat,
    lng,
    distanceMeters: meters,
    distanceText: meters == null ? '' : meters < 1000 ? `${meters}m` : `${(meters / 1000).toFixed(1)}km`,
    durationText: walkMinutes == null ? '' : `도보 ${walkMinutes}분`,
  }
}

async function searchNearbyAmenities({ lat, lng, radius, category, key }) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.regularOpeningHours',
        'places.googleMapsUri',
      ].join(','),
    },
    body: JSON.stringify({
      includedTypes: [category.type],
      languageCode: 'ko',
      rankPreference: 'DISTANCE',
      maxResultCount: 3,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius,
        },
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google Places ${response.status}: ${text}`)
  }

  const data = await response.json()
  return (data.places || []).map(place => normalizeAmenityPlace(place, category, { lat, lng }))
}

const getNearbyAmenities = async (req, res, next) => {
  try {
    const key = requireEnv('GOOGLE_MAPS_API_KEY')
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const radius = Math.min(Math.max(Number(req.query.radius) || 1500, 300), 5000)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw createError('lat과 lng가 필요합니다.', 400)
    }

    const groups = await Promise.all(AMENITY_PLACE_TYPES.map(async category => ({
      ...category,
      places: await searchNearbyAmenities({ lat, lng, radius, category, key }),
    })))

    res.json({
      found: groups.some(group => group.places.length > 0),
      center: { lat, lng },
      radius,
      groups,
    })
  } catch (err) {
    next(err)
  }
}

async function searchNearbyIndoor({ lat, lng, radius, category, key }) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': [
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.location',
        'places.rating',
        'places.regularOpeningHours',
        'places.googleMapsUri',
      ].join(','),
    },
    body: JSON.stringify({
      includedTypes: category.types,
      languageCode: 'ko',
      rankPreference: 'POPULARITY',
      maxResultCount: 5,
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius,
        },
      },
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Google Places ${response.status}: ${text}`)
  }

  const data = await response.json()
  return (data.places || []).map(place => normalizeAmenityPlace(place, category, { lat, lng }))
}

const CAFE_PLACE_TYPES = [
  { key: 'cafe',    types: ['cafe', 'coffee_shop'],       label: '카페',     icon: '☕' },
  { key: 'bakery',  types: ['bakery', 'pastry_shop'],     label: '베이커리',  icon: '🥐' },
  { key: 'dessert', types: ['dessert_shop', 'ice_cream_shop'], label: '디저트', icon: '🍨' },
]

async function searchNearbyCafes({ lat, lng, radius, category, key }) {
  const response = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': [
        'places.id', 'places.displayName', 'places.formattedAddress',
        'places.location', 'places.rating', 'places.regularOpeningHours', 'places.googleMapsUri',
      ].join(','),
    },
    body: JSON.stringify({
      includedTypes: category.types,
      languageCode: 'ko',
      rankPreference: 'POPULARITY',
      maxResultCount: 4,
      locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius } },
    }),
  })
  if (!response.ok) return []
  const data = await response.json()
  return (data.places || []).map(place => normalizeAmenityPlace(place, category, { lat, lng }))
}

const getNearbyCafes = async (req, res, next) => {
  try {
    const key    = requireEnv('GOOGLE_MAPS_API_KEY')
    const lat    = Number(req.query.lat)
    const lng    = Number(req.query.lng)
    const radius = Math.min(Math.max(Number(req.query.radius) || 800, 200), 2000)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) throw createError('lat과 lng가 필요합니다.', 400)

    const groups = await Promise.all(
      CAFE_PLACE_TYPES.map(async cat => ({
        key: cat.key, label: cat.label, icon: cat.icon,
        places: await searchNearbyCafes({ lat, lng, radius, category: cat, key }),
      }))
    )
    res.json({ found: groups.some(g => g.places.length > 0), center: { lat, lng }, radius, groups })
  } catch (err) {
    next(err)
  }
}

const getIndoorPlaces = async (req, res, next) => {
  try {
    const key    = requireEnv('GOOGLE_MAPS_API_KEY')
    const lat    = Number(req.query.lat)
    const lng    = Number(req.query.lng)
    const radius = Math.min(Math.max(Number(req.query.radius) || 2000, 300), 5000)

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      throw createError('lat과 lng가 필요합니다.', 400)
    }

    const groups = await Promise.all(
      INDOOR_PLACE_TYPES.map(async category => {
        const places = await searchNearbyIndoor({ lat, lng, radius, category, key }).catch(() => [])
        return { key: category.key, label: category.label, icon: category.icon, places }
      })
    )

    res.json({
      found: groups.some(g => g.places.length > 0),
      center: { lat, lng },
      radius,
      groups,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { getEmbedUrl, getRoute, geocode, getEmergencyPlaces, getNearbyAmenities, getIndoorPlaces, getNearbyCafes }
