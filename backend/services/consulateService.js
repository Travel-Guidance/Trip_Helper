// 외교부 재외공관 정보를 조회하고 캐싱하는 서비스
'use strict'

const { requireEnv } = require('../utils/env')
const { findCountryByDestination } = require('../data/countries')

const MOFA_API_URL = 'https://apis.data.go.kr/1262000/EmbassyService2/getEmbassyList2'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

const consulateCache = new Map()

function normalizeItems(json) {
  const items = json?.response?.body?.items?.item
    ?? json?.body?.items?.item
    ?? json?.items?.item
    ?? json?.data
    ?? []

  if (Array.isArray(items)) return items
  return items ? [items] : []
}

async function fetchConsulates(params) {
  const key = requireEnv('MOFA_API_KEY').trim()
  const query = new URLSearchParams({
    pageNo: '1',
    numOfRows: '20',
    returnType: 'JSON',
    ...params,
  })
  const serviceKey = key.includes('%') ? key : encodeURIComponent(key)
  const url = `${MOFA_API_URL}?serviceKey=${serviceKey}&${query}`
  const res = await fetch(url)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`MOFA API 오류: ${res.status} ${text.slice(0, 160)}`)
  }
  const json = await res.json()
  const items = normalizeItems(json)
  if (!Array.isArray(items)) throw new Error('MOFA API 응답 형식 오류')
  return items
}

async function getCachedConsulates(cacheKey, params) {
  const now = Date.now()
  const cached = consulateCache.get(cacheKey)
  if (cached && now - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.data
  }
  const data = await fetchConsulates(params)
  consulateCache.set(cacheKey, { data, fetchedAt: now })
  return data
}

function resolveCountry(destination) {
  if (!destination) return null
  const dest = destination.trim()
  const country = findCountryByDestination(dest)
  return country || { nameKo: dest, iso2: '' }
}

function getField(item, ...keys) {
  for (const key of keys) {
    if (item[key] != null && item[key] !== '') return item[key]
  }
  return ''
}

async function getConsulateByDestination(destination) {
  const country = resolveCountry(destination)
  if (!country) return null

  let list = await getCachedConsulates(
    `country:${country.nameKo}`,
    { 'cond[country_nm::EQ]': country.nameKo }
  )
  if (!list.length && country.iso2) {
    list = await getCachedConsulates(
      `iso:${country.iso2}`,
      { 'cond[country_iso_alp2::EQ]': country.iso2 }
    )
  }
  if (!list.length) return null

  // 대사관 > 총영사관 > 첫 번째 순으로 우선순위
  const pick =
    list.find(c => getField(c, 'embassy_ty_cd_nm', '재외공관 유형')?.includes('대사관') && !getField(c, 'embassy_ty_cd_nm', '재외공관 유형')?.includes('총')) ||
    list.find(c => getField(c, 'embassy_ty_cd_nm', '재외공관 유형')?.includes('총영사관')) ||
    list[0]

  const lat = parseFloat(getField(pick, 'embassy_lat', '재외공관 위도'))
  const lng = parseFloat(getField(pick, 'embassy_lng', '재외공관 경도'))

  return {
    name: getField(pick, 'embassy_kor_nm', '재외공관명'),
    type: getField(pick, 'embassy_ty_cd_nm', '재외공관 유형'),
    phone: getField(pick, 'tel_no', '전화번호'),
    emergencyPhone: getField(pick, 'urgency_tel_no', '긴급전화번호'),
    callCenter: getField(pick, 'center_tel_no', '영사콜센터번호'),
    address: getField(pick, 'embassy_addr', 'emblgbd_addr', '재외공관주소'),
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    countryName: getField(pick, 'country_nm', '국가명') || country.nameKo,
  }
}

module.exports = { getConsulateByDestination }
