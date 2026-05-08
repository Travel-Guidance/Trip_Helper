const QDRANT_URL = process.env.QDRANT_URL || 'http://localhost:6333';
const COLLECTION = 'travel_knowledge';
const VECTOR_SIZE = 3072; // gemini-embedding-001 차원

async function qdrantFetch(path, method = 'GET', body = null) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${QDRANT_URL}${path}`, opts);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Qdrant ${method} ${path} → ${res.status}: ${text}`);
  }
  return res.json();
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

async function upsert(points) {
  return qdrantFetch(`/collections/${COLLECTION}/points`, 'PUT', { points });
}

async function search(vector, limit = 5, filter = null) {
  const body = { vector, limit, with_payload: true };
  if (filter) body.filter = filter;
  const res = await qdrantFetch(`/collections/${COLLECTION}/points/search`, 'POST', body);
  return res.result;
}

// city / category / price_range 조합 필터 검색
async function searchByParams(vector, { limit = 5, city = null, category = null, priceRange = null } = {}) {
  const must = [];
  if (city)       must.push({ key: 'city',        match: { any: [city, '공통'] } });
  if (category)   must.push({ key: 'category',    match: { value: category } });
  if (priceRange) must.push({ key: 'price_range', match: { value: priceRange } });

  const filter = must.length > 0 ? { must } : null;
  return search(vector, limit, filter);
}

module.exports = { ensureCollection, upsert, search, searchByParams, COLLECTION, VECTOR_SIZE };
