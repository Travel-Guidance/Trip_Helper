const flightService = require('../services/flightService');

async function getSeatMaps(req, res, next) {
  try {
    const data = await flightService.getSeatMaps(req.params.offerId);
    res.json(data);
  } catch (err) {
    const duffelErrors = err.errors;
    if (duffelErrors?.length) {
      const first = duffelErrors[0];
      console.error('Seat map error:', first.code, '-', first.message);
      if (first.code === 'not_supported' || first.code === 'not_found') {
        return res.json([]);
      }
    }
    next(err);
  }
}

module.exports = { getSeatMaps };
