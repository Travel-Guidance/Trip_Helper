'use strict';

const { Router } = require('express');
const { getRouteIncidents } = require('../controllers/safetyController');

const router = Router();

// GET /api/safety/incidents?lat=-33.87&lng=151.21&radius=2&days=90
router.get('/safety/incidents', getRouteIncidents);

module.exports = router;
