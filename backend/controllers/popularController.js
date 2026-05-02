const destinations = require('../models/popularDestinations');

function getPopular(_req, res) {
  res.json(destinations);
}

module.exports = { getPopular };
