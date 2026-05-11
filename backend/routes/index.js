const { Router } = require('express');

const flightRoutes       = require('./flightRoutes');
const orderRoutes        = require('./orderRoutes');
const seatRoutes         = require('./seatRoutes');
const popularRoutes      = require('./popularRoutes');
const esimRoutes         = require('./esimRoutes');
const accommodationRoutes = require('./accommodationRoutes');
const mapsRoutes         = require('./mapsRoutes');
const tourRoutes         = require('./tourRoutes');
const aiTravelRoutes     = require('./aiTravelRoutes');
const authRoutes         = require('./authRoutes');

const router = Router();

router.use(flightRoutes);
router.use(orderRoutes);
router.use(seatRoutes);
router.use(popularRoutes);
router.use(esimRoutes);
router.use(accommodationRoutes);
router.use(mapsRoutes);
router.use(tourRoutes);
router.use(aiTravelRoutes);
router.use(authRoutes);

module.exports = router;


