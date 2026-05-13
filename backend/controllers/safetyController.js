'use strict';

const { analyzeRoute } = require('../services/safetyService');
const { createError }  = require('../utils/errors');

async function getRouteIncidents(req, res) {
  const lat      = parseFloat(req.query.lat);
  const lng      = parseFloat(req.query.lng);
  const radiusKm = parseFloat(req.query.radius ?? '2');
  const days     = parseInt(req.query.days     ?? '90', 10);

  if (isNaN(lat) || isNaN(lng)) {
    throw createError('lat, lng는 필수 숫자 파라미터입니다.', 400);
  }

  const result = await analyzeRoute({ lat, lng, radiusKm, days });
  res.json(result);
}

module.exports = { getRouteIncidents };
