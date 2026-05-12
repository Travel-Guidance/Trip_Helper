'use strict';

const qdrant = require('../config/qdrant');

async function ensureCollection({ recreate = false } = {}) {
  if (recreate) {
    await qdrant.deleteCollection().catch(() => {});
  }
  await qdrant.ensureCollection();
}

async function upsertBatch(points) {
  return qdrant.upsert(points);
}

async function search(vector, { city = null, category = null, priceRange = null, styles = [], limit = 6 } = {}) {
  return qdrant.searchByParams(vector, { limit, city, category, priceRange, styles });
}

module.exports = { ensureCollection, upsertBatch, search };
