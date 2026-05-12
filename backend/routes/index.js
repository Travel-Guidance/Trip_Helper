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
const bookingRoutes      = require('./bookingRoutes');
const exchangeRateRoutes = require('./exchangeRateRoutes');
const healthRoutes       = require('./healthRoutes');
const memoryRoutes       = require('./memoryRoutes');
const consulateRoutes    = require('./consulateRoutes');

const router = Router();

router.use(healthRoutes);
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
router.use(bookingRoutes);
router.use(exchangeRateRoutes);
router.use(memoryRoutes);
router.use(consulateRoutes);

module.exports = router;


