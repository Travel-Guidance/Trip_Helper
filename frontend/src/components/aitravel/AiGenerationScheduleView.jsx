import React, { useState, useMemo, useEffect, useRef } from 'react'
import '../../styles/AiGenerationSchedule.css'
import { apiGet } from '../../api/apiClient'

const MAPS_KEY = 'AIzaSyDaVmYg-OdmcaT1qDjLA-J-n5-df0XyWSw'
const MAPS_SCRIPT_ID = 'google-maps-js-api'

const DESTINATION_IMAGES = {
  '시드니':    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=88',
  '멜버른':    'https://images.unsplash.com/photo-1545044846-351ba102b6d5?auto=format&fit=crop&w=1800&q=88',
  '골드코스트': 'https://images.unsplash.com/photo-1587400892770-8cce9b80c8c6?auto=format&fit=crop&w=1800&q=88',
  '케언즈':    'https://images.unsplash.com/photo-1559494007-9f5847c49d94?auto=format&fit=crop&w=1800&q=88',
  '호주':      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=88',
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

function getBgImage(dest) {
  if (!dest) return DEFAULT_IMAGE
  for (const [key, url] of Object.entries(DESTINATION_IMAGES)) {
    if (dest.includes(key)) return url
  }
  return DEFAULT_IMAGE
}

function ItemModal({ item, dest, onClose }) {
  const mapSrc = `https://www.google.com/maps/embed/v1/search?key=${MAPS_KEY}&q=${encodeURIComponent(item.name + ', ' + dest)}&zoom=15`

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
            <span className={`tag${item.isMeal ? ' meal' : ''}`}>{item.isMeal ? '식사' : '명소'}</span>
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

const MODE_ICON = { transit: '🚌', driving: '🚗', walking: '🚶', bicycling: '🚲' }
const MODE_LABEL = { transit: '대중교통', driving: '자동차', walking: '도보', bicycling: '자전거' }

async function fetchRoute(origin, destination) {
  try {
    const params = new URLSearchParams({ origin, destination, mode: 'transit' })
    return await apiGet(`/maps/route?${params}`)
  } catch {
    return null
  }
}

function loadGoogleMaps() {
  if (window.google?.maps) return Promise.resolve(window.google.maps)

  const existing = document.getElementById(MAPS_SCRIPT_ID)
  if (existing) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(window.google.maps), { once: true })
      existing.addEventListener('error', reject, { once: true })
    })
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.id = MAPS_SCRIPT_ID
    script.src = `https://maps.googleapis.com/maps/api/js?key=${MAPS_KEY}&loading=async`
    script.async = true
    script.defer = true
    script.onload = () => resolve(window.google.maps)
    script.onerror = reject
    document.head.appendChild(script)
  })
}

function pointFromItem(item) {
  const lat = Number(item?.lat)
  const lng = Number(item?.lng)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  return { lat, lng, title: item.name, time: item.time }
}

function clearMapOverlays(markersRef, polylineRef) {
  markersRef.current.forEach(marker => marker.setMap(null))
  markersRef.current = []
  if (polylineRef.current) polylineRef.current.setMap(null)
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
    return {
      ...point,
      lat: point.lat + Math.sin(angle) * distance,
      lng: point.lng + Math.cos(angle) * distance,
    }
  })
}

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

function drawRoute({ maps, map, points, markersRef, polylineRef }) {
  clearMapOverlays(markersRef, polylineRef)

  const bounds = new maps.LatLngBounds()
  const displayPoints = spreadOverlappingPoints(points)
  const path = displayPoints.map(point => {
    const position = { lat: point.lat, lng: point.lng }
    bounds.extend(position)
    return position
  })

  markersRef.current = displayPoints.map((point, index) => new maps.Marker({
    position: { lat: point.lat, lng: point.lng },
    map,
    icon: markerIcon(maps, index),
    title: point.title,
  }))

  polylineRef.current = new maps.Polyline({
    path,
    map,
    strokeColor: '#0099ff',
    strokeOpacity: 0.86,
    strokeWeight: 4,
  })

  map.fitBounds(bounds)
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

function RouteMap({ currentDay, activeDay, dest }) {
  const mapElRef = useRef(null)
  const mapRef = useRef(null)
  const markersRef = useRef([])
  const polylineRef = useRef(null)
  const [useFallback, setUseFallback] = useState(false)
  const items = useMemo(() => currentDay?.items ?? [], [currentDay])
  const fallbackSrc = useMemo(() => buildPlaceSrc(items, dest), [items, dest])

  useEffect(() => {
    if (items.length < 2 || !mapElRef.current) return undefined

    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setUseFallback(false)
    })

    loadGoogleMaps()
      .then(async maps => {
        if (cancelled || !mapElRef.current) return

        const fixedPoints = items.map(pointFromItem)
        let points = fixedPoints.filter(Boolean)

        if (points.length < 2) {
          const resolved = await Promise.all(items.map(async item => {
            const point = pointFromItem(item)
            if (point) return point
            const position = await geocodePlace(`${item.name}, ${dest}`)
            return position ? { ...position, title: item.name, time: item.time } : null
          }))
          if (cancelled) return
          points = resolved.filter(Boolean)
        }

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

        drawRoute({ maps, map: mapRef.current, points, markersRef, polylineRef })
      })
      .catch(() => {
        if (!cancelled) setUseFallback(true)
      })

    return () => { cancelled = true }
  }, [items, activeDay, dest])

  useEffect(() => () => {
    clearMapOverlays(markersRef, polylineRef)
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
}

export default function AiGenerationScheduleView({ planData, tripInfo, onReset, onTravelDurationClick }) {
  const [activeDay, setActiveDay] = useState(0)
  const [selectedItem, setSelectedItem] = useState(null)
  const [routeInfos, setRouteInfos] = useState([])

  const dest = tripInfo?.country || tripInfo?.continent || '목적지'
  const days = planData?.days ?? []
  const currentDay = days[activeDay] ?? days[0]
  const totalPlaces = days.reduce((sum, d) => sum + (d.items?.length ?? 0), 0)
  const mealCount = days.reduce((sum, d) => sum + (d.items?.filter(i => i.isMeal).length ?? 0), 0)
  const bgImage = getBgImage(dest)

  useEffect(() => {
    const items = currentDay?.items ?? []
    if (items.length < 2) return
    let cancelled = false
    Promise.resolve().then(() => {
      if (!cancelled) setRouteInfos([])
    })
    const pairs = items.slice(0, -1).map((item, i) => [
      item.name + ', ' + dest,
      items[i + 1].name + ', ' + dest,
    ])
    Promise.all(pairs.map(([o, d]) => fetchRoute(o, d))).then(results => {
      if (!cancelled) setRouteInfos(results)
    })
    return () => { cancelled = true }
  }, [activeDay, currentDay, dest])

  return (
    <div className="ai-generation-schedule-page">
      <div className="page">

        <header className="command">
          <div className="command-inner">
            <a className="brand" href="#"><span className="brand-icon">✈</span><span>폰가이즈</span></a>
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
              background: `linear-gradient(100deg, rgba(7,17,31,0.74), rgba(7,17,31,0.18) 54%, rgba(0,143,131,0.42)), url("${bgImage}") center/cover`,
            }}
          >
            <div className="hero-top">
              <div className="status">AI 일정 생성 완료</div>
              <div className="score-card">
                <span>총 방문지</span>
                <strong>{totalPlaces}곳</strong>
              </div>
            </div>
            <div>
              <h1 className="hero-title">{dest}</h1>
              <p className="hero-copy">{days.map(d => d.theme).join(' · ')}</p>
            </div>
          </article>

          <aside className="intel-card">
            <h2>여행 요약 리포트</h2>
            <div className="intel-grid">
              <div className="intel"><span>총 방문 포인트</span><strong>{totalPlaces}곳</strong></div>
              <div className="intel"><span>총 일수</span><strong>{days.length}일</strong></div>
              <div className="intel"><span>식사 포인트</span><strong>{mealCount}회</strong></div>
              <div className="intel"><span>여행 스타일</span><strong>{tripInfo?.styles?.[0] ?? '자유'}</strong></div>
            </div>
            <ul className="strategy">
              {days.slice(0, 3).map((day, i) => (
                <li key={i}>
                  <b>{i + 1}</b>
                  <span>{day.label}: {day.theme}</span>
                </li>
              ))}
            </ul>
          </aside>
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
                  </div>
                </header>
                <div className="time-grid">
                  {currentDay.items?.map((item, i) => (
                    <React.Fragment key={i}>
                      <div className="node">
                        <div className="node-time">{item.time}</div>
                        <div className="node-line">
                          <span className={`node-dot${item.isMeal ? ' meal' : ''}`}></span>
                        </div>
                        <section
                          className="node-card node-card-clickable"
                          onClick={() => setSelectedItem(item)}
                        >
                          <div className="node-top">
                            <h3>{item.name}</h3>
                            <span className={`tag${item.isMeal ? ' meal' : ''}`}>
                              {item.isMeal ? '식사' : '명소'}
                            </span>
                          </div>
                          <p>{item.note}</p>
                        </section>
                      </div>
                      {i < (currentDay.items.length - 1) && (
                        <div className="route-connector">
                          <div className="route-connector-line"></div>
                          <div className="route-connector-info">
                            {routeInfos[i] === undefined ? (
                              <span className="route-loading">이동시간 조회 중…</span>
                            ) : routeInfos[i]?.found ? (
                              <>
                                <span className="route-mode-icon">{MODE_ICON[routeInfos[i].mode] ?? '🚌'}</span>
                                <span className="route-duration">{routeInfos[i].duration}</span>
                                <span className="route-distance">· {routeInfos[i].distance}</span>
                                <span className="route-mode-label">({MODE_LABEL[routeInfos[i].mode] ?? '이동'})</span>
                              </>
                            ) : (
                              <span className="route-loading">이동</span>
                            )}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </article>
            )}
          </section>

          <aside className="panel map-shell">
            <h3>{activeDay + 1}일차 Google Maps 동선</h3>
            <div className="map">
              <RouteMap currentDay={currentDay} activeDay={activeDay} dest={dest} />
            </div>
            <ul className="map-focus">
              {currentDay?.items?.map((item, i) => (
                <li key={i} style={{ cursor: 'pointer' }} onClick={() => setSelectedItem(item)}>
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
