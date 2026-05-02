const flightService = require('../services/flightService');

async function getPlaces(req, res, next) {
  try {
    const results = await flightService.getPlaces(req.query.query);
    res.json(results);
  } catch (err) {
    next(err);
  }
}

async function searchFlights(req, res, next) {
  try {
    const data = await flightService.searchFlights(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getOffer(req, res, next) {
  try {
    const data = await flightService.getOffer(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { getPlaces, searchFlights, getOffer };
