// 외교부 재외공관 정보를 조회하고 캐싱하는 서비스
'use strict'

const { requireEnv } = require('../utils/env')
const { findCountryByDestination } = require('../data/countries')

const MOFA_API_URL = 'https://api.odcloud.kr/api/15076569/v1/uddi:7692653c-21f9-4396-b6b3-f3f0cdbe9370'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

let consulateCache = { data: null, fetchedAt: 0 }

async function fetchAllConsulates() {
  const key = requireEnv('MOFA_API_KEY')
  const url = `${MOFA_API_URL}?serviceKey=${encodeURIComponent(key)}&page=1&perPage=500&returnType=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error(`MOFA API 오류: ${res.status}`)
  const json = await res.json()
  if (!Array.isArray(json.data)) throw new Error('MOFA API 응답 형식 오류')
  return json.data
}

async function getAllConsulates() {
  const now = Date.now()
  if (consulateCache.data && now - consulateCache.fetchedAt < CACHE_TTL_MS) {
    return consulateCache.data
  }
  const data = await fetchAllConsulates()
  consulateCache = { data, fetchedAt: now }
  return data
}

function resolveCountryName(destination, allConsulates) {
  if (!destination) return null
  const dest = destination.trim()
  const countryNames = [...new Set(allConsulates.map(c => c['국가명']).filter(Boolean))]

  if (countryNames.includes(dest)) return dest

  const partial = countryNames.find(cn => dest.includes(cn) || cn.includes(dest))
  if (partial) return partial

  const country = findCountryByDestination(dest)
  if (country && countryNames.includes(country.nameKo)) return country.nameKo

  return null
}

async function getConsulateByDestination(destination) {
  const all = await getAllConsulates()
  const countryName = resolveCountryName(destination, all)
  if (!countryName) return null

  const list = all.filter(c => c['국가명'] === countryName)
  if (!list.length) return null

  // 대사관 > 총영사관 > 첫 번째 순으로 우선순위
  const pick =
    list.find(c => c['재외공관 유형']?.includes('대사관') && !c['재외공관 유형']?.includes('총')) ||
    list.find(c => c['재외공관 유형']?.includes('총영사관')) ||
    list[0]

  const lat = parseFloat(pick['재외공관 위도'])
  const lng = parseFloat(pick['재외공관 경도'])

  return {
    name: pick['재외공관명'] || '',
    type: pick['재외공관 유형'] || '',
    phone: pick['전화번호'] || '',
    emergencyPhone: pick['긴급전화번호'] || '',
    callCenter: pick['영사콜센터번호'] || '',
    address: pick['재외공관주소'] || '',
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    countryName,
  }
}

module.exports = { getConsulateByDestination }
