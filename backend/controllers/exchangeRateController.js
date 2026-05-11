'use strict';

const { getExchangeRate } = require('../services/exchangeRateService');

async function getRate(req, res, next) {
  try {
    const data = await getExchangeRate({
      currency: req.query.currency,
    });
    res.json(data);
  } catch (err) {
    if (err.status) {
      res.status(err.status).json({ error: err.message });
      return;
    }
    next(err);
  }
}

module.exports = { getRate };
