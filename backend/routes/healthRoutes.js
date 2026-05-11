'use strict';

const { Router } = require('express');
const pool = require('../config/database');
const { QDRANT_URL, COLLECTION_NAME } = require('../rag/config');

const router = Router();

async function checkMysql() {
  await pool.query('SELECT 1');
  return { ok: true };
}

async function checkQdrant() {
  const response = await fetch(`${QDRANT_URL}/collections/${COLLECTION_NAME}`);
  if (response.status === 404) {
    return { ok: false, reason: 'collection_missing', collection: COLLECTION_NAME };
  }
  if (!response.ok) {
    return { ok: false, reason: `http_${response.status}`, collection: COLLECTION_NAME };
  }
  const data = await response.json();
  const points = data.result?.points_count ?? data.result?.vectors_count ?? null;
  return { ok: true, collection: COLLECTION_NAME, points };
}

router.get('/health', async (req, res) => {
  const services = {};

  try {
    services.mysql = await checkMysql();
  } catch (err) {
    services.mysql = { ok: false, reason: err.message };
  }

  try {
    services.qdrant = await checkQdrant();
  } catch (err) {
    services.qdrant = { ok: false, reason: err.message, collection: COLLECTION_NAME };
  }

  const ok = Object.values(services).every(service => service.ok);
  res.status(ok ? 200 : 503).json({
    ok,
    services,
    rag: {
      ready: Boolean(services.qdrant?.ok && services.qdrant.points !== 0),
      note: services.qdrant?.points === 0 ? 'Run npm run seed:vector to populate Qdrant.' : undefined,
    },
  });
});

module.exports = router;
