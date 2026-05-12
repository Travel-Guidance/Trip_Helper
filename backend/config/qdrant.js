'use strict';

const {
  QDRANT_URL,
  COLLECTION_NAME: COLLECTION,
  VECTOR_SIZE,
} = require('../rag/config');

async function qdrantFetch(path, method = 'GET', body = null) {
  const options = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) options.body = JSON.stringify(body);

  const response = await fetch(`${QDRANT_URL}${path}`, options);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Qdrant ${method} ${path} failed with ${response.status}: ${text}`);
  }

  return response.json();
}

async function ensureCollection() {
  try {
    await qdrantFetch(`/collections/${COLLECTION}`);
    console.log(`Qdrant collection "${COLLECTION}" ready`);
  } catch {
    await qdrantFetch(`/collections/${COLLECTION}`, 'PUT', {
      vectors: { size: VECTOR_SIZE, distance: 'Cosine' },
    });
    console.log(`Qdrant collection "${COLLECTION}" created`);
  }
}

async function deleteCollection() {
  return qdrantFetch(`/collections/${COLLECTION}`, 'DELETE');
}

async function upsert(points) {
  return qdrantFetch(`/collections/${COLLECTION}/points`, 'PUT', { points });
}

async function search(vector, limit = 5, filter = null) {
  const body = { vector, limit, with_payload: true };
  if (filter) body.filter = filter;

  const result = await qdrantFetch(`/collections/${COLLECTION}/points/search`, 'POST', body);
  return result.result;
}

async function searchByParams(vector, { limit = 5, city = null, category = null, priceRange = null, styles = [] } = {}) {
  const must = [];

  if (city) must.push({ key: 'city', match: { any: [city, '공통'] } });
  if (category) must.push({ key: 'category', match: { value: category } });
  if (priceRange) must.push({ key: 'price_range', match: { value: priceRange } });

  const filter = must.length ? { must } : null;

  // styles는 must가 있을 때만 should로 추가 (scoring boost)
  // must 없이 should만 있으면 Qdrant가 최소 1개 매칭을 강제해 결과가 줄어들 수 있음
  if (must.length > 0 && styles.length > 0) {
    filter.should = styles.map(style => ({ key: 'tags', match: { value: style } }));
  }

  return search(vector, limit, filter);
}

module.exports = {
  ensureCollection,
  deleteCollection,
  upsert,
  search,
  searchByParams,
  COLLECTION,
  VECTOR_SIZE,
};
