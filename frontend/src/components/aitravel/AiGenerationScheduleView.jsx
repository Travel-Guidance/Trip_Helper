import React, { useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../styles/AiGenerationSchedule.css'
import { apiGet } from '../../api/apiClient'

const MAPS_KEY = 'AIzaSyDaVmYg-OdmcaT1qDjLA-J-n5-df0XyWSw'
const MAPS_SCRIPT_ID = 'google-maps-js-api'

const CITY_COUNTRY_CODE = {
  호주: 'AU', 시드니: 'AU', 멜버른: 'AU', 골드코스트: 'AU',
  케언즈: 'AU', 울루루: 'AU', 브리즈번: 'AU', 퍼스: 'AU', 애들레이드: 'AU',
  일본: 'JP', 도쿄: 'JP', 오사카: 'JP', 교토: 'JP', 후쿠오카: 'JP',
  태국: 'TH', 방콕: 'TH', 치앙마이: 'TH', 푸켓: 'TH',
  프랑스: 'FR', 파리: 'FR',
  이탈리아: 'IT', 로마: 'IT', 밀라노: 'IT',
  스페인: 'ES', 바르셀로나: 'ES', 마드리드: 'ES',
  인도네시아: 'ID', 발리: 'ID',
  싱가포르: 'SG',
  미국: 'US', 뉴욕: 'US',
  영국: 'GB', 런던: 'GB',
  베트남: 'VN', 호치민: 'VN', 하노이: 'VN',
  뉴질랜드: 'NZ',
}

function resolveCountryCode(location, fallback) {
  if (!location) return CITY_COUNTRY_CODE[fallback] || ''
  for (const [key, code] of Object.entries(CITY_COUNTRY_CODE)) {
    if (location.includes(key)) return code
  }
  return CITY_COUNTRY_CODE[fallback] || ''
}

const DESTINATION_IMAGES = {
  '시드니':    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=88',
  '멜버른':    'https://images.unsplash.com/photo-1545044846-351ba102b6d5?auto=format&fit=crop&w=1800&q=88',
  '골드코스트': 'https://images.unsplash.com/photo-1587400892770-8cce9b80c8c6?auto=format&fit=crop&w=1800&q=88',
  '케언즈':    'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=1800&q=88',
  '호주':      'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?auto=format&fit=crop&w=1800&q=88',
  '일본':      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1800&q=88',
  '도쿄':      'https://images.unsplash.com/photo-1542051841857-5f90071e7989?auto=format&fit=crop&w=1800&q=88',
  '오사카':    'https://images.unsplash.com/photo-1590559899731-a382839e5549?auto=format&fit=crop&w=1800&q=88',
  '프랑스':    'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1800&q=88',
  '파리':      'https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1800&q=88',
  '미국':      'https://images.unsplash.com/photo-1485738422979-f5c462d49f74?auto=format&fit=crop&w=1800&q=88',
  '태국':      'https://images.unsplash.com/photo-1508009603885-50cf7c8dd0d5?auto=format&fit=crop&w=1800&q=88',
  '베트남':    'https://images.unsplash.com/photo-1528360983277-13d401cdc186?auto=format&fit=crop&w=1800&q=88',
  '이탈리아':  'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1800&q=88',
}
const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1800&q=88'

function getItemType(item) {
  if (item?.isMeal) return { label: '식사', className: ' meal' }

  const text = `${item?.name || ''} ${item?.note || ''}`.toLowerCase()
  if (/공항|airport|\b[a-z]{3}\b/.test(text)) {
    return { label: '이동', className: ' transit' }
  }
  if (/숙소|호텔|hotel|resort|리조트|체크인|체크아웃|복귀/.test(text)) {
    return { label: '숙소', className: ' hotel' }
  }

  return { label: '명소', className: '' }
}

function getBgImage(dest) {
  if (!dest) return DEFAULT_IMAGE
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (dest.includes(key)) return url
  }
  return DEFAULT_IMAGE
}

function ItemModal({ item, dest, onClose }) {
  const mapSrc = `https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=${encodeURIComponent(item.name + ', ' + dest)}&zoom=15`
  const itemType = getItemType(item)

  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="item-modal-overlay" onClick={onClose}>
      <div className="item-modal" onClick={e => e.stopPropagation()}>
        <div className="item-modal-header">
          <div className="item-modal-meta">
            <span className={`tag${itemType.className}`}>{itemType.label}</span>
            <span className="item-modal-time">{item.time}</span>
          </div>
          <button className="item-modal-close" onClick={onClose}>✕</button>
        </div>

        <h2 className="item-modal-title">{item.name}</h2>
        <p className="item-modal-note">{item.note}</p>

        <div className="item-modal-map">
          <iframe
            key={mapSrc}
            src={mapSrc}
            style={{ width: '100%', height: '100%', border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  )
}

const MODE_ICON = { transit: '🚌', driving: '🚗', walking: '🚶', bicycling: '🚲', flying: '✈️' }
const MODE_LABEL = { transit: '대중교통', driving: '자동차', walking: '도보', bicycling: '자전거', flying: '항공' }

// "골드코스트 출발 (항공 2.5시간)" → { found:true, mode:'flying', duration:'2시간 30분', durationSeconds:9000 }
function extractFlightRouteFromName(name) {
  const m = String(name || '').match(/항공\s*(\d+(?:\.\d+)?)\s*시간/)
  if (!m) return null
  const totalMins = Math.round(parseFloat(m[1]) * 60)
  const h = Math.floor(totalMins / 60)
  const min = totalMins % 60
  const duration = h > 0 ? (min > 0 ? `${h}시간 ${min}분` : `${h}시간`) : `${min}분`
  return { found: true, mode: 'flying', duration, distance: '', durationSeconds: totalMins * 60 }
}

function distanceTextToKm(distance) {
  const text = String(distance || '').replace(/,/g, '')
  const km = text.match(/(\d+(?:\.\d+)?)\s*km/i)
  if (km) return Number(km[1]) || 0
  const m = text.match(/(\d+(?:\.\d+)?)\s*m/i)
  if (m) return (Number(m[1]) || 0) / 1000
  return 0
}

function isAirportItem(item) {
  return /공항|airport|\b[A-Z]{3}\b/i.test(`${item?.name || ''} ${item?.note || ''}`)
}

function normalizeRouteInfo(info, origin, destination) {
  if (!info?.found) return info
  const km = distanceTextToKm(info.distance)
  if (km >= 500 && !isAirportItem(origin) && !isAirportItem(destination)) {
    return { ...info, longDistanceWarning: true, mode: info.mode || 'flying' }
  }
  return info
}

// "약 6~7시간", "약 2시간" 등 → 최댓값(분) 반환
function parseNoteStayMins(note) {
  if (!note) return null
  const range = note.match(/(\d+(?:\.\d+)?)\s*~\s*(\d+(?:\.\d+)?)\s*시간/)
  if (range) return Math.round(parseFloat(range[2]) * 60)
  const single = note.match(/약?\s*(\d+(?:\.\d+)?)\s*시간/)
  if (single) return Math.round(parseFloat(single[1]) * 60)
  return null
}

function parseMinutes(timeStr) {
  if (!timeStr) return null
  const [h, m] = timeStr.split(':').map(Number)
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null
}

function routeDurationMinutes(routeInfo) {
  if (!routeInfo?.found) return null
  // durationSeconds 우선, 없으면 한국어 텍스트 파싱 ("5시간 53분", "30분" 등)
  if (routeInfo.durationSeconds) return routeInfo.durationSeconds / 60
  const text = routeInfo.duration || ''
  const h = text.match(/(\d+)\s*시간/)
  const m = text.match(/(\d+)\s*분/)
  const mins = (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0)
  return mins || null
}

function routeDistanceKm(routeInfo) {
  const text = String(routeInfo?.distance || '').replace(/,/g, '')
  const km = text.match(/(\d+(?:\.\d+)?)\s*km/i)
  if (km) return parseFloat(km[1])
  const meters = text.match(/(\d+(?:\.\d+)?)\s*m\b/i)
  if (meters) return parseFloat(meters[1]) / 1000
  return null
}

function isTransferLikeItem(item = {}) {
  const text = `${item.name || ''} ${item.note || ''}`.toLowerCase()
  if (/(hotel|resort|inn|숙소|호텔|리조트).*(출발|도착|체크인|체크아웃|departure|arrival|check-?in|check-?out)/.test(text)) return true
  return /(flight|airport|transfer|domestic|terminal|train|rail|항공|공항|비행|국내선|장거리 이동|숙소 이동|도시 이동|기차|열차)/.test(text)
}

function shouldSuppressRoute(routeInfo, fromItem, toItem) {
  if (!routeInfo?.found) return false
  if (isTransferLikeItem(fromItem) || isTransferLikeItem(toItem)) return false
  if (routeInfo.longDistanceWarning) return false
  return false
}

function minsToTime(mins) {
  if (mins == null) return null
  const total = Math.round(mins)
  const h = Math.floor(total / 60) % 24
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function compactItemDetails(item) {
  return [
    item.duration ? { label: '체류', value: item.duration } : null,
    item.cost ? { label: '비용', value: item.cost } : null,
    item.reservation ? { label: '예약', value: item.reservation } : null,
  ].filter(Boolean)
}

function expandedItemDetails(item) {
  return [
    item.transportTip ? { label: '이동 팁', value: item.transportTip } : null,
    item.backup ? { label: '대안', value: item.backup } : null,
  ].filter(Boolean)
}

// routeInfos 기반으로 각 항목의 실제 도착 시간 재계산
// null routeInfo(아웃라이어 건너뜀) = 원래 AI 시간 유지
function buildAdjustedTimes(items, routeInfos) {
  if (!items.length || !routeInfos.length) return items.map(it => it.time)
  const MIN_STAY  = 30
  const MIDNIGHT  = 24 * 60  // 1440분

  const result = [parseMinutes(items[0].time)]

  for (let i = 0; i < items.length - 1; i++) {
    const prev = result[i]
    if (prev == null) { result.push(parseMinutes(items[i + 1].time)); continue }

    const info = routeInfos[i]
    if (info === null) { result.push(parseMinutes(items[i + 1].time)); continue }

    const travelMins = routeDurationMinutes(info) ?? 0
    const origGap    = (parseMinutes(items[i + 1].time) ?? 0) - parseMinutes(items[i].time)
    const stayMins   = Math.max(MIN_STAY, (origGap > 0 ? origGap : 90) - travelMins)
    result.push(prev + stayMins + travelMins)
  }

  // 마지막 항목이 자정을 넘으면 전체 시간을 비례 압축
  const last = result[result.length - 1]
  if (last != null && last >= MIDNIGHT) {
    const first = result[0] ?? 0
    const span  = last - first
    const cap   = MIDNIGHT - 1 - first  // 23:59까지
    result.forEach((t, i) => {
      if (t != null && i > 0) result[i] = Math.round(first + (t - first) * cap / span)
    })
  }

  return result.map(minsToTime)
}

function itemToRoutePoint(item, dest) {
  const lat = Number(item?.lat)
  const lng = Number(item?.lng)
  // 좌표가 있으면 "lat,lng" 형식으로 넘겨 지오코딩 오류를 방지
  if (Number.isFinite(lat) && Number.isFinite(lng)) return `${lat},${lng}`
  return `${item.name}, ${dest}`
}

function normalizeHotelCoordinates(coords) {
  if (!coords) return null
  const lat = Number(coords.lat ?? coords.latitude)
  const lng = Number(coords.lng ?? coords.longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng }
}

function parseDate(value) {
  if (!value) return null
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

function addDays(dateValue, days) {
  const date = parseDate(dateValue)
  if (!date) return ''
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

function readStoredStayBookings() {
  if (typeof window === 'undefined') return []
  try {
    const many = JSON.parse(sessionStorage.getItem('stay_bookings') || '[]')
    if (Array.isArray(many) && many.length) return many
  } catch {}

  try {
    const one = JSON.parse(sessionStorage.getItem('stay_booking') || 'null')
    return one ? [one] : []
  } catch {
    return []
  }
}

function bookingCoversDate(booking, date) {
  if (!date) return true
  const checkIn = booking?.check_in || booking?.checkIn
  const checkOut = booking?.check_out || booking?.checkOut
  if (!checkIn || !checkOut) return true
  return date >= checkIn && date < checkOut
}

function hotelPointFromBooking(booking, dest) {
  const hotel = booking?.hotel || {}
  const coordinates = normalizeHotelCoordinates(hotel.coordinates || booking?.coordinates)
  const name = hotel.name || booking?.hotelName || '숙소'
  const location = hotel.location || booking?.location || dest

  return {
    time: '08:30',
    name,
    note: `${location} 기준 동선`,
    isHotel: true,
    ...(coordinates || {}),
  }
}

function buildRouteItemsWithHotel(items, hotelPoint) {
  if (!hotelPoint || !items.length) return items
  return [
    { ...hotelPoint, time: items[0]?.time || '08:30', name: `${hotelPoint.name} 출발` },
    ...items,
    { ...hotelPoint, time: '22:00', name: `${hotelPoint.name} 복귀` },
  ]
}

async function fetchRoute(origin, destination) {
  try {
    const params = new URLSearchParams({ origin, destination, mode: 'transit' })
    return await apiGet(`/maps/route?${params}`)
  } catch {
    return null
  }
}

let _mapsReadyPromise = null

function loadGoogleMaps() {
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps)
  if (_mapsReadyPromise) return _mapsReadyPromise

  _mapsReadyPromise = new Promise((resolve, reject) => {
    const cbName = '__googleMapsReady__'
    window[cbName] = () => {
      delete window[cbName]
      _mapsReadyPromise = null
      resolve(window.google.maps)
    }
    const script = document.createElement('script')
    script.id = MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&callback=${cbName}&loading=async`
    script.async = true
    script.defer = true
    script.onerror = () => {
      delete window[cbName]
      _mapsReadyPromise = null
      reject(new Error('Google Maps load failed'))
    }
    document.head.appendChild(script)
  })

  return _mapsReadyPromise
}

function pointFromItem(item) {
  const lat = Number(item?.lat)
  const lng = Number(item?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng, title: item.name, time: item.time }
}


function clearMapOverlays(markersRef, polylinesRef) {
  markersRef.current.forEach(marker => marker.setMap(null))
  markersRef.current = []
  polylinesRef.current.forEach(polyline => polyline.setMap(null))
  polylinesRef.current = []
}

function clearSpiderOverlays(spiderRef) {
  if (!spiderRef.current) return
  spiderRef.current.spiderMarkers.forEach(m => m.setMap(null))
  spiderRef.current.spiderLines.forEach(l => l.setMap(null))
  spiderRef.current = null
}

function filterOutliers(points) {
  if (points.length < 3) return points
  const centerLat = points.reduce((s, p) => s + p.lat, 0) / points.length
  const centerLng = points.reduce((s, p) => s + p.lng, 0) / points.length
  const distKm = (p) => {
    const dlat = (p.lat - centerLat) * 111
    const dlng = (p.lng - centerLng) * 111 * Math.cos(centerLat * Math.PI / 180)
    return Math.sqrt(dlat * dlat + dlng * dlng)
  }
  // 중심에서 150km 초과 좌표는 AI가 잘못 생성한 것으로 간주해 제거
  const filtered = points.filter(p => distKm(p) < 150)
  return filtered.length >= 2 ? filtered : points
}

function dedupeSequentialPoints(points, minDistance = 0.0002) {
  return points.filter((point, index) => {
    const prev = points[index - 1]
    if (!prev) return true
    return Math.hypot(point.lat - prev.lat, point.lng - prev.lng) > minDistance
  })
}

function spreadOverlappingPoints(points) {
  const seen = new Map()
  return points.map(point => {
    const key = `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`
    const count = seen.get(key) || 0
    seen.set(key, count + 1)
    if (!count) return point
    const angle = count * 1.8
    const distance = 0.00018 * Math.ceil(count / 2)
    return { ...point, lat: point.lat + Math.sin(angle) * distance, lng: point.lng + Math.cos(angle) * distance }
  })
}

const ROUTE_SEGMENT_COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899']

function markerIcon(maps, index) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="42" viewBox="0 0 42 54">
      <path d="M21 2C10.5 2 2 10.5 2 21c0 14.7 19 31 19 31s19-16.3 19-31C40 10.5 31.5 2 21 2Z" fill="#ef4444" stroke="#ffffff" stroke-width="3"/>
      <text x="21" y="27" text-anchor="middle" font-family="Arial, sans-serif" font-size="15" font-weight="800" fill="#ffffff">${index + 1}</text>
    </svg>
  `
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(32, 42),
    anchor: new maps.Point(16, 40),
  }
}

function clusterIcon(maps, count) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
      <circle cx="20" cy="20" r="18" fill="#475569" stroke="#fff" stroke-width="3"/>
      <circle cx="20" cy="20" r="13" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
      <text x="20" y="17" text-anchor="middle" font-family="Arial,sans-serif" font-size="9" font-weight="700" fill="rgba(255,255,255,0.8)">묶음</text>
      <text x="20" y="28" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="800" fill="#fff">${count}곳</text>
    </svg>
  `
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new maps.Size(40, 40),
    anchor: new maps.Point(20, 20),
  }
}

function computeClusters(map, points, threshold = 30) {
  const proj = map.getProjection()
  const scale = proj ? Math.pow(2, map.getZoom()) : 0
  const toPixel = (lat, lng) => {
    if (!proj) return { x: 0, y: 0 }
    const p = proj.fromLatLngToPoint(new window.google.maps.LatLng(lat, lng))
    return { x: p.x * scale, y: p.y * scale }
  }

  const px = points.map(p => toPixel(p.lat, p.lng))
  const assigned = new Array(points.length).fill(false)
  const clusters = []

  for (let i = 0; i < points.length; i++) {
    if (assigned[i]) continue
    const members = [{ point: points[i], idx: i }]
    assigned[i] = true

    if (proj) {
      for (let j = i + 1; j < points.length; j++) {
        if (assigned[j]) continue
        if (Math.hypot(px[i].x - px[j].x, px[i].y - px[j].y) <= threshold) {
          members.push({ point: points[j], idx: j })
          assigned[j] = true
        }
      }
    }

    const centroid = {
      lat: members.reduce((s, m) => s + m.point.lat, 0) / members.length,
      lng: members.reduce((s, m) => s + m.point.lng, 0) / members.length,
    }
    clusters.push({ centroid, members })
  }

  return clusters
}

function drawMarkersForClusters(maps, map, clusters, markersRef, spiderRef) {
  markersRef.current.forEach(m => m.setMap(null))
  markersRef.current = []

  clusters.forEach(cluster => {
    let marker
    if (cluster.members.length === 1) {
      const { point, idx } = cluster.members[0]
      marker = new maps.Marker({
        position: { lat: point.lat, lng: point.lng },
        map,
        icon: markerIcon(maps, idx),
        title: point.title,
        zIndex: 20 + idx,
      })
    } else {
      marker = new maps.Marker({
        position: cluster.centroid,
        map,
        icon: clusterIcon(maps, cluster.members.length),
        title: cluster.members.map(m => m.point.title).join(' · '),
        zIndex: 10,
      })
      marker.addListener('click', () => {
        const key = cluster.members.map(m => m.idx).sort().join(',')
        if (spiderRef.current?.key === key) {
          clearSpiderOverlays(spiderRef)
        } else {
          const group = cluster.members.map(m => ({ ...m.point, index: m.idx }))
          openSpider(maps, map, cluster.centroid, group, key, spiderRef)
        }
      })
    }
    markersRef.current.push(marker)
  })
}

function openSpider(maps, map, center, group, key, spiderRef) {
  clearSpiderOverlays(spiderRef)
  const count = group.length
  const zoom = map.getZoom() || 13
  const metersPerPx = 156543.03392 * Math.cos(center.lat * Math.PI / 180) / Math.pow(2, zoom)
  const spread = Math.max(0.001, (70 * metersPerPx) / 111319)
  const angleStep = (Math.PI * 2) / count
  const spiderLines = []
  const spiderMarkers = []

  group.forEach((point, i) => {
    const angle = -Math.PI / 2 + angleStep * i
    const pos = {
      lat: center.lat + spread * Math.sin(angle),
      lng: center.lng + spread * Math.cos(angle),
    }
    spiderLines.push(new maps.Polyline({
      path: [center, pos],
      map,
      strokeColor: '#64748b',
      strokeOpacity: 0.6,
      strokeWeight: 2,
      zIndex: 5,
    }))
    spiderMarkers.push(new maps.Marker({
      position: pos,
      map,
      icon: markerIcon(maps, point.index),
      title: `${point.title} (${point.time})`,
      zIndex: 30 + point.index,
    }))
  })

  spiderRef.current = { key, spiderMarkers, spiderLines }
}

async function geocodePlace(query) {
  try {
    const data = await apiGet(`/maps/geocode?query=${encodeURIComponent(query)}`)
    if (!data?.found) return null
    return { lat: data.lat, lng: data.lng }
  } catch {
    return null
  }
}

function buildPlaceSrc(items, dest) {
  if (!items?.length) return null
  const query = `${items.map(item => item.name).join(', ')}, ${dest}`
  const params = new URLSearchParams({
    key: MAPS_KEY,
    q: query,
    zoom: '14',
  })
  return `https://www.google.com/maps/embed/v1/search?${params}`
}

const RouteMap = forwardRef(function RouteMap({ routeItems, activeDay, dest }, ref) {
  const mapElRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const polylinesRef = useRef([])
  const spiderRef = useRef(null)
  const mapClickListenerRef = useRef(null)
  const idleListenerRef = useRef(null)
  const geocodedRef = useRef([])
  const [useFallback, setUseFallback] = useState(false)

  useImperativeHandle(ref, () => ({
    focusMarker(index) {
      const map = mapRef.current
      const pos = geocodedRef.current[index]
      if (!map || !pos) return
      map.panTo({ lat: pos.lat, lng: pos.lng })
      map.setZoom(17)
    }
  }))
  const spotItems = useMemo(
    () => (routeItems ?? []).filter(item => !item.isHotel),
    [routeItems]
  )
  const fallbackSrc = useMemo(() => buildPlaceSrc(spotItems, dest), [spotItems, dest])

  useEffect(() => {
    if (spotItems.length < 2 || !mapElRef.current) return undefined

    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setUseFallback(false)
    })

    loadGoogleMaps()
      .then(async maps => {
        if (cancelled || !mapElRef.current) return

        const resolved = await Promise.all(spotItems.map(async item => {
          const point = pointFromItem(item)
          if (point) return point
          const position = await geocodePlace(`${item.name}, ${dest}`)
          return position ? { ...position, title: item.name, time: item.time } : null
        }))
        if (cancelled) return
        geocodedRef.current = resolved
        const points = filterOutliers(resolved.filter(Boolean))

        if (points.length < 2) {
          setUseFallback(true)
          return
        }

        if (!mapRef.current) {
          mapRef.current = new maps.Map(mapElRef.current, {
            center: points[0],
            zoom: 12,
            mapTypeId: 'roadmap',
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          })
        }

        const map = mapRef.current

        // 겹친 마커 제거 후 폴리라인 그리기
        clearMapOverlays(markersRef, polylinesRef)
        clearSpiderOverlays(spiderRef)

        const markerPoints = spreadOverlappingPoints(points)
        const orderedLinePoints = dedupeSequentialPoints(markerPoints)
        const linePoints = orderedLinePoints.length >= 2 ? orderedLinePoints : markerPoints
        const bounds = new maps.LatLngBounds()
        linePoints.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }))

        polylinesRef.current = linePoints.slice(0, -1).map((point, i) => {
          const next = linePoints[i + 1]
          return new maps.Polyline({
            path: [
              { lat: point.lat, lng: point.lng },
              { lat: next.lat, lng: next.lng },
            ],
            map,
            strokeColor: ROUTE_SEGMENT_COLORS[i % ROUTE_SEGMENT_COLORS.length],
            strokeOpacity: 0.88,
            strokeWeight: 4,
          })
        })

        if (mapClickListenerRef.current) maps.event.removeListener(mapClickListenerRef.current)
        mapClickListenerRef.current = map.addListener('click', () => clearSpiderOverlays(spiderRef))

        if (idleListenerRef.current) maps.event.removeListener(idleListenerRef.current)
        idleListenerRef.current = map.addListener('idle', () => {
          if (cancelled) return
          clearSpiderOverlays(spiderRef)
          const clusters = computeClusters(map, markerPoints)
          drawMarkersForClusters(maps, map, clusters, markersRef, spiderRef)
        })

        map.fitBounds(bounds)
      })
      .catch(() => {
        if (!cancelled) setUseFallback(true)
      })

    return () => { cancelled = true }
  }, [spotItems, activeDay, dest, routeItems])

  useEffect(() => () => {
    clearMapOverlays(markersRef, polylinesRef)
    clearSpiderOverlays(spiderRef)
    if (window.google?.maps) {
      if (mapClickListenerRef.current) window.google.maps.event.removeListener(mapClickListenerRef.current)
      if (idleListenerRef.current) window.google.maps.event.removeListener(idleListenerRef.current)
    }
    mapRef.current = null
  }, [])

  if (useFallback && fallbackSrc) {
    return (
      <iframe
        key={fallbackSrc}
        src={fallbackSrc}
        style={{ width: '100%', height: '100%', border: 0 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    )
  }

  return <div className="route-map-canvas" ref={mapElRef} />
})

export default function AiGenerationScheduleView({ planData, tripInfo, onReset, onTravelDurationClick }) {
  const navigate = useNavigate()
  const [activeDay, setActiveDay] = useState(0)
  const [selectedItem, setSelectedItem] = useState(null)
  const [routeInfos, setRouteInfos] = useState([])
  const [openPanel, setOpenPanel] = useState(null)
  const togglePanel = id => setOpenPanel(prev => prev === id ? null : id)
  const routeMapRef = useRef(null)

  const dest = tripInfo?.country || tripInfo?.continent || '목적지'
  const days = planData?.days ?? []
  const currentDay = days[activeDay] ?? days[0]
  const totalPlaces = days.reduce((sum, d) => sum + (d.items?.length ?? 0), 0)
  const mealCount = days.reduce((sum, d) => sum + (d.items?.filter(i => i.isMeal).length ?? 0), 0)
  const bgImage = getBgImage(dest)
  const currentItems = currentDay?.items ?? []
  const activeStayBooking = useMemo(() => {
    const date = addDays(tripInfo?.startDate, activeDay)
    return readStoredStayBookings().find(booking => bookingCoversDate(booking, date)) || null
  }, [activeDay, tripInfo?.startDate])

  const activeAiAccom = useMemo(() => {
    const accoms = planData?.accommodations
    if (!Array.isArray(accoms) || !accoms.length) return null
    if (tripInfo?.startDate) {
      const date = addDays(tripInfo.startDate, activeDay)
      const match = accoms.find(acc => acc.coordinates && bookingCoversDate(acc, date))
      if (match) return match
    }
    return accoms.find(acc => acc.coordinates) || null
  }, [activeDay, planData?.accommodations, tripInfo?.startDate])

  const activeHotelPoint = useMemo(() => {
    if (activeStayBooking) return hotelPointFromBooking(activeStayBooking, dest)
    if (activeAiAccom?.coordinates) {
      return {
        time: '08:30',
        name: activeAiAccom.name || '숙소',
        note: `${activeAiAccom.location || dest} 기준 동선`,
        isHotel: true,
        lat: activeAiAccom.coordinates.lat,
        lng: activeAiAccom.coordinates.lng,
      }
    }
    return null
  }, [activeStayBooking, activeAiAccom, dest])
  const routeItems = useMemo(
    () => buildRouteItemsWithHotel(currentItems, activeHotelPoint),
    [currentItems, activeHotelPoint]
  )
  const hasHotelRoute = routeItems.length > currentItems.length
  const placeRouteInfos = hasHotelRoute
    ? routeInfos.slice(1, Math.max(1, currentItems.length))
    : routeInfos

  const adjustedTimes = useMemo(
    () => buildAdjustedTimes(currentItems, placeRouteInfos),
    [currentItems, placeRouteInfos]
  )

  useEffect(() => {
    const items = routeItems
    if (items.length < 2) return
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setRouteInfos([])
    })

    Promise.all(
      items.slice(0, -1).map((item, i) => {
        // 항목 이름에 명시된 항공 시간이 있으면 API 호출 없이 바로 사용
        const flightInfo = extractFlightRouteFromName(item.name)
        if (flightInfo) return Promise.resolve(flightInfo)
        return fetchRoute(itemToRoutePoint(item, dest), itemToRoutePoint(items[i + 1], dest))
          .then(info => normalizeRouteInfo(info, item, items[i + 1]))
      })
    ).then(results => {
        if (!cancelled) {
          setRouteInfos(results.map((info, i) =>
            shouldSuppressRoute(info, items[i], items[i + 1]) ? null : info
          ))
        }
      })
    return () => { cancelled = true }
  }, [activeDay, routeItems, dest])

  return (
    <div className="ai-generation-schedule-page">
      <div className="page">

        <header className="command">
          <div className="command-inner">
            <a className="brand" href="/home"><span className="brand-icon">✈</span><span>폰가이즈</span></a>
            <div className="route-pill">
              <strong>{dest}</strong>
              <span>{tripInfo?.nights}박 {(tripInfo?.nights ?? 0) + 1}일</span>
              {tripInfo?.styles?.slice(0, 2).map(s => <span key={s}>{s}</span>)}
            </div>
            <div className="command-actions">
              <button className="action light" type="button" onClick={onReset}>다시 만들기</button>
              {onTravelDurationClick && (
                <button className="action light" type="button" onClick={onTravelDurationClick}>일정중</button>
              )}
            </div>
          </div>
        </header>

        <section className="overview">
          <article
            className="hero-card"
            style={{
              background: `linear-gradient(160deg, rgba(7,17,31,0.88) 0%, rgba(7,17,31,0.52) 55%, rgba(0,143,131,0.42) 100%), url("${bgImage}") center/cover`,
            }}
          >
            <div className="hero-top">
              <div className="status">AI 일정 생성 완료</div>
            </div>
            <div className="hero-body">
              <h1 className="hero-title">{dest}</h1>
              {/* <p className="hero-copy">{days.map(d => d.theme).join(' · ')}</p> */}
            </div>
            <div className="hero-stats-bar">
              <div className="hero-stat"><span>총 방문지</span><strong>{totalPlaces}곳</strong></div>
              <div className="hero-stat"><span>총 일수</span><strong>{days.length}일</strong></div>
              <div className="hero-stat"><span>식사</span><strong>{mealCount}회</strong></div>
              <div className="hero-stat"><span>여행 스타일</span><strong>{tripInfo?.styles?.[0] ?? '자유'}</strong></div>
            </div>
          </article>

          {(planData?.warnings?.length > 0 ||
            planData?.feasibility?.status === 'needs_adjustment' ||
            planData?.feasibility?.status === 'impossible' ||
            planData?.omittedPlaces?.length > 0 ||
            planData?.accommodations?.length > 0) && (
            <div className="accordion-block">
              {planData?.warnings?.length > 0 && (
                <div className={`acd-panel warnings-panel${openPanel === 'warnings' ? ' open' : ''}`}>
                  <button className="acd-header" onClick={() => togglePanel('warnings')}>
                    <span className="acd-icon">⚠️</span>
                    <span className="acd-title">여행 전 꼭 확인하세요</span>
                    <span className="acd-badge">{planData.warnings.length}건</span>
                    <svg className="acd-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="acd-wrap">
                    <div className="acd-body">
                      <div className="acd-inner">
                        <div className="warnings-list">
                          {planData.warnings.map((w, i) => (
                            <div key={i} className={`warning-item warning-${w.type}`}>
                              <span className="warning-icon">{w.icon}</span>
                              <div className="warning-body">
                                <p className="warning-title">{w.title}</p>
                                <p className="warning-message">{w.message}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {(planData?.feasibility?.status === 'needs_adjustment' ||
                planData?.feasibility?.status === 'impossible' ||
                planData?.omittedPlaces?.length > 0) && (
                <div className={`acd-panel omitted-panel${openPanel === 'adjustments' ? ' open' : ''}`}>
                  <button className="acd-header" onClick={() => togglePanel('adjustments')}>
                    <span className="acd-icon">✏️</span>
                    <span className="acd-title">조정된 요청</span>
                    {planData?.omittedPlaces?.length > 0 && (
                      <span className="acd-badge">{planData.omittedPlaces.length}건</span>
                    )}
                    <svg className="acd-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="acd-wrap">
                    <div className="acd-body">
                      <div className="acd-inner">
                        {planData?.feasibility?.message && (
                          <p className="omitted-summary">{planData.feasibility.message}</p>
                        )}
                        {planData?.feasibility?.suggestedAdjustments?.length > 0 && (
                          <div className="adjustment-list">
                            {planData.feasibility.suggestedAdjustments.map((item, i) => (
                              <span key={i}>{item}</span>
                            ))}
                          </div>
                        )}
                        {planData?.omittedPlaces?.length > 0 && (
                          <div className="omitted-list">
                            {planData.omittedPlaces.map((place, i) => (
                              <div key={i} className="omitted-item">
                                <p className="omitted-name">{place.name}</p>
                                <p className="omitted-reason">{place.reason}</p>
                                {place.alternative && (
                                  <p className="omitted-alt">대안: {place.alternative}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {planData?.accommodations?.length > 0 && (
                <div className={`acd-panel accom-panel${openPanel === 'accommodations' ? ' open' : ''}`}>
                  <button className="acd-header" onClick={() => togglePanel('accommodations')}>
                    <span className="acd-icon">🏨</span>
                    <span className="acd-title">숙소 정보</span>
                    <span className="acd-badge">{planData.accommodations.length}곳</span>
                    <svg className="acd-chevron" width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M4.5 6.75L9 11.25L13.5 6.75" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <div className="acd-wrap">
                    <div className="acd-body">
                      <div className="acd-inner">
                        <div className="accom-list">
                          {planData.accommodations.map((acc, i) => (
                            <div key={i} className="accom-item">
                              <div className="accom-info">
                                <p className="accom-name">🏨 {acc.name}</p>
                                <p className="accom-location">{acc.location}</p>
                                {acc.checkIn && acc.checkOut && (
                                  <p className="accom-dates">{acc.checkIn} ~ {acc.checkOut}</p>
                                )}
                              </div>
                              <button
                                className="accom-book-btn"
                                onClick={() => {
                                  const countryCode = resolveCountryCode(acc.location, dest)
                                  const params = new URLSearchParams({
                                    countryKey:  acc.location || dest,
                                    countryCode,
                                    destination: acc.searchQuery || acc.location || dest,
                                    checkIn:     acc.checkIn  || '',
                                    checkOut:    acc.checkOut || '',
                                    guests:      String(tripInfo?.adults  || 2),
                                    children:    String(tripInfo?.children || 0),
                                  })
                                  navigate(`/accommodation/results?${params}`)
                                }}
                              >
                                예약하러 가기
                              </button>
                            </div>
                          ))}
                        </div>
                        {planData.accommodations.length > 1 && (
                          <button
                            className="accom-book-all-btn"
                            onClick={() => {
                              const queue = planData.accommodations.map(acc => ({
                                name:        acc.name,
                                countryKey:  acc.location || dest,
                                countryCode: resolveCountryCode(acc.location, dest),
                                destination: acc.searchQuery || acc.location || dest,
                                checkIn:     acc.checkIn  || '',
                                checkOut:    acc.checkOut || '',
                                guests:      String(tripInfo?.adults  || 2),
                                children:    String(tripInfo?.children || 0),
                              }))
                              sessionStorage.setItem('accom_booking_queue', JSON.stringify(queue))
                              sessionStorage.setItem('accom_booking_index', '0')
                              sessionStorage.setItem('accom_return_url', window.location.pathname + window.location.search)
                              sessionStorage.setItem('accom_booking_source', 'ai-generation-schedule')
                              const { name: _n, ...first } = queue[0]
                              navigate(`/accommodation/results?${new URLSearchParams(first)}`)
                            }}
                          >
                            전체 숙소 한번에 예약하기 ({planData.accommodations.length}곳)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        <main className="workspace">
          <aside className="left-rail panel route-index">
            <h3>일정 바로가기</h3>
            {days.map((day, i) => (
              <button
                key={i}
                className={`day-button${activeDay === i ? ' active' : ''}`}
                onClick={() => setActiveDay(i)}
              >
                <strong>{String(i + 1).padStart(2, '0')}</strong>
                <span>
                  <p>{day.label}</p>
                  <span>{day.theme}</span>
                </span>
              </button>
            ))}
            <div className="legend">
              <div className="legend-row"><span className="legend-dot"></span>명소/이동</div>
              <div className="legend-row"><span className="legend-dot transit"></span>공항/이동</div>
              <div className="legend-row"><span className="legend-dot meal"></span>식사</div>
            </div>
          </aside>

          <section className="feed">
            {currentDay && (
              <article className="day-module">
                <header className="module-head">
                  <div>
                    <p className="module-kicker">{currentDay.label}</p>
                    <h2>{currentDay.theme}</h2>
                    {currentDay.summary && <p className="day-summary">{currentDay.summary}</p>}
                    {currentDay.routeStrategy && <p className="route-strategy">동선 전략: {currentDay.routeStrategy}</p>}
                  </div>
                </header>
                <div className="time-grid">
                  {currentDay.items?.map((item, i) => {
                    const itemType = getItemType(item)
                    return (
                    <React.Fragment key={i}>
                      <div className="node">
                        <div className="node-time">{adjustedTimes[i] ?? item.time}</div>
                        <div className="node-line">
                          <span className={`node-dot${itemType.className}`}></span>
                        </div>
                        <section
                          className="node-card node-card-clickable"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="node-top">
                            <h3>{item.name}</h3>
                            <span className={`tag${itemType.className}`}>{itemType.label}</span>
                          </div>
                          <p>{item.note}</p>
                          {compactItemDetails(item).length > 0 && (
                            <div className="metrics">
                              {compactItemDetails(item).map(detail => (
                                <span className="metric" key={`${detail.label}-${detail.value}`}>
                                  {detail.label}: {detail.value}
                                </span>
                              ))}
                            </div>
                          )}
                          {expandedItemDetails(item).length > 0 && (
                            <div className="item-extra">
                              {expandedItemDetails(item).map(detail => (
                                <p key={detail.label}>
                                  <strong>{detail.label}</strong>
                                  <span>{detail.value}</span>
                                </p>
                              ))}
                            </div>
                          )}
                          {parseNoteStayMins(item.note) && (
                            <span className="stay-duration-badge">
                              ⏱ 체류 약 {(() => {
                                const m = parseNoteStayMins(item.note)
                                const h = Math.floor(m / 60)
                                const min = m % 60
                                return h > 0 ? (min > 0 ? `${h}시간 ${min}분` : `${h}시간`) : `${min}분`
                              })()}
                            </span>
                          )}
                        </section>
                      </div>
                      {i < (currentDay.items.length - 1) && (
                        <div className="route-connector">
                          <div className="route-connector-line"></div>
                          <div className="route-connector-info">
                            {placeRouteInfos[i] === undefined ? (
                              <span className="route-loading">이동시간 조회 중…</span>
                            ) : placeRouteInfos[i]?.found ? (
                              <>
                                <span className="route-mode-icon">{placeRouteInfos[i].longDistanceWarning ? '⚠️' : (MODE_ICON[placeRouteInfos[i].mode] ?? '🚌')}</span>
                                <span className="route-duration">{placeRouteInfos[i].longDistanceWarning ? '장거리' : placeRouteInfos[i].duration}</span>
                                <span className="route-distance">· {placeRouteInfos[i].distance}</span>
                                <span className="route-mode-label">({MODE_LABEL[placeRouteInfos[i].mode] ?? '이동'})</span>
                              </>
                            ) : (
                              <span className="route-loading">
                                {placeRouteInfos[i]?.distance ? `이동 · ${placeRouteInfos[i].distance}` : '이동'}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                    )
                  })}
                </div>
              </article>
            )}
          </section>

          <aside className="panel map-shell">
            <h3>{activeDay + 1}일차 Google Maps 동선</h3>
            <div className="map">
              <RouteMap ref={routeMapRef} routeItems={routeItems} activeDay={activeDay} dest={dest} />
            </div>
            <ul className="map-focus">
              {routeItems.filter(item => !item.isHotel).map((item, i) => (
                <li key={i} style={{ cursor: 'pointer' }} onClick={() => routeMapRef.current?.focusMarker(i)}>
                  <b>{i + 1}</b>
                  {item.name}
                  <span>{item.time}</span>
                </li>
              ))}
            </ul>
          </aside>
        </main>

      </div>

      {selectedItem && (
        <ItemModal
          item={selectedItem}
          dest={dest}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  )
}
