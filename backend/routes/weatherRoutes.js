'use strict';

const { Router } = require('express');
const { getDayWeatherDetail } = require('../services/weatherService');
const { createError } = require('../utils/errors');

const router = Router();

router.get('/weather/day', async (req, res, next) => {
  try {
    const destination = String(req.query.destination || '').trim();
    const date        = String(req.query.date || '').trim();
    if (!destination || !date) throw createError('destination과 date가 필요합니다.', 400);

    const data = await getDayWeatherDetail(destination, date);
    if (!data) return res.status(503).json({ error: '날씨 정보를 가져올 수 없습니다.' });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
