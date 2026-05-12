'use strict';

const { embed } = require('./embed');
const store = require('./store');
const { filterByRadius, GEO_RADIUS_KM } = require('./geo');

async function searchKnowledge(
  query,
  { city = null, category = null, priceRange = null, styles = [], limit = 6, lat = null, lon = null, radiusKm = GEO_RADIUS_KM } = {},
) {
  const vector = await embed(query);

  // 좌표 필터 시 충분한 후보를 가져와 거리 필터 후 limit 맞춤
  const fetchLimit = lat != null && lon != null ? limit * 4 : limit;
  const results = await store.search(vector, { city, category, priceRange, styles, limit: fetchLimit });

  const mapped = results.map(result => ({
    score:       result.score,
    text:        result.payload?.text ?? '',
    destination: result.payload?.destination,
    city:        result.payload?.city,
    category:    result.payload?.category,
    title:       result.payload?.title,
    tags:        result.payload?.tags,
    price_range: result.payload?.price_range,
    hours:       result.payload?.hours,
    source:      result.payload?.source,
    chunk_index: result.payload?.chunk_index,
    lat:         result.payload?.lat ?? null,
    lng:         result.payload?.lng ?? null,
  }));

  if (lat != null && lon != null) {
    return filterByRadius(mapped, { lat, lon, radiusKm }).slice(0, limit);
  }
  return mapped;
}

module.exports = { searchKnowledge };
