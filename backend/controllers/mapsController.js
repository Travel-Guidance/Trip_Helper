const { requireEnv } = require('../utils/env')
const { createError } = require('../utils/errors')

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

    // transit 먼저 시도
    let element = await queryMatrix(o, d, 'transit', key)
    let mode = 'transit'

    if (element) {
      // 1km 이하면 도보로 전환
      if (element.distance?.value <= 1000) {
        const walkEl = await queryMatrix(o, d, 'walking', key)
        if (walkEl) { element = walkEl; mode = 'walking' }
      }
    } else {
      // transit 실패 → driving → walking 순 폴백
      for (const m of ['driving', 'walking']) {
        element = await queryMatrix(o, d, m, key)
        if (element) { mode = m; break }
      }
    }

    if (!element) return res.json({ found: false })

    res.json({
      found: true,
      distance: element.distance?.text,
      duration: element.duration?.text,
      mode,
    })
  } catch (err) {
    next(err)
  }
}

module.exports = { getEmbedUrl, getRoute }
