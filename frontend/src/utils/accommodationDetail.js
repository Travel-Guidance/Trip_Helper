import { formatKrwPrice } from './currency'

const AMENITY_LABELS = {
  spa: '스파',
  'parking available': '주차 가능',
  'free wifi': '무료 WiFi',
  restaurant: '레스토랑',
  'air conditioning': '에어컨',
  gym: '피트니스 센터',
  'pet friendly': '반려동물 동반 가능',
  pool: '수영장',
  bar: '바',
  'bar/lounge': '바/라운지',
  breakfast: '아침 식사',
  '24-hour front desk': '24시간 프런트 데스크',
  'non-smoking rooms': '금연 객실',
  'luggage storage': '짐 보관',
}

export function formatDate(value) {
  if (!value) return '날짜 미정'
  const date = new Date(`${value}T00:00:00`)
  return `${date.getMonth() + 1}월 ${date.getDate()}일`
}

export function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function formatAmenity(value) {
  const text = String(value || '').trim()
  return AMENITY_LABELS[text.toLowerCase()] || text
}

export function cleanTotalText(value) {
  return String(value || '').replace(/^총\s*요금:\s*/i, '').trim()
}

export function parseKrwText(value) {
  const num = Number(String(value || '').replace(/[^\d]/g, ''))
  return Number.isFinite(num) && num > 0 ? num : 0
}

export function getHotelExternalUrl(hotel, hotelId) {
  if (hotel.externalUrl) return hotel.externalUrl
  if (hotel.link?.startsWith('http')) return hotel.link
  if (hotel.link?.startsWith('/')) return `https://kr.hotels.com${hotel.link}`
  return hotelId ? `https://kr.hotels.com/ho${hotelId}/` : ''
}

export function buildRoomOptions({ offers, hotel, detail, uniqueGallery, roomFacilities, currency }) {
  const nightlyPrice = Number(hotel.price || 0)
  const displayPrice = hotel.displayPrice || formatKrwPrice(nightlyPrice, currency)
  const totalPriceText = cleanTotalText(hotel.totalPriceText)

  if (offers.length > 0) {
    return offers.map(room => ({
      id: room.id,
      name: room.name,
      rateName: room.rateName,
      images: room.images?.map(img => img.url).filter(Boolean) || [],
      amenities: room.amenities?.map(formatAmenity).slice(0, 6) || [],
      price: room.nightlyText || formatKrwPrice(room.nightlyPrice, currency),
      totalText: cleanTotalText(room.totalText),
      badge: room.badge,
      paymentModel: room.paymentModel,
      periodText: hotel.pricePeriodText,
    }))
  }

  return [{
    id: 'standard',
    name: hotel.name || detail?.name || '객실',
    images: uniqueGallery,
    amenities: roomFacilities,
    price: displayPrice,
    previousPrice: hotel.previousPrice,
    totalText: totalPriceText,
    taxText: hotel.taxText,
    periodText: hotel.pricePeriodText,
  }]
}
