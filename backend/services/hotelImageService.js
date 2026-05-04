const { BASE_URL, getHeaders } = require('../config/hotelbeds')
const { pickImage } = require('../data/hotelImages')

const HOTEL_IMAGE_BASE_URL = 'https://photos.hotelbeds.com/giata/bigger'

function buildHotelImageUrl(path) {
  return `${HOTEL_IMAGE_BASE_URL}/${path}`
}

function getFallbackHotelImage(code) {
  return pickImage(code)
}

function buildHotelImages(hotel, code) {
  const images = (hotel.images || [])
    .filter(img => img.path)
    .slice(0, 12)
    .map(img => ({
      type: img.imageTypeCode,
      url:  buildHotelImageUrl(img.path),
    }))

  return images.length ? images : [{ type: 'fallback', url: getFallbackHotelImage(code) }]
}

async function fetchHotelImages(codes) {
  if (!codes.length) return {}
  try {
    const qs = new URLSearchParams({
      codes:    codes.join(','),
      language: 'ENG',
      fields:   'images',
      from:     '1',
      to:       String(codes.length),
    })
    const res = await fetch(
      `${BASE_URL}/hotel-content-api/1.0/hotels?${qs}`,
      { method: 'GET', headers: getHeaders() }
    )
    if (!res.ok) return {}

    const json = await res.json()
    const map = {}
    for (const h of (json.hotels || [])) {
      const imgs = h.images || []
      const best =
        imgs.find(i => i.imageTypeCode === 'GEN') ||
        imgs.find(i => i.imageTypeCode === 'HAB') ||
        imgs[0]
      if (best?.path) {
        map[String(h.code)] = buildHotelImageUrl(best.path)
      }
    }
    return map
  } catch {
    return {}
  }
}

module.exports = {
  fetchHotelImages,
  buildHotelImages,
  getFallbackHotelImage,
}
