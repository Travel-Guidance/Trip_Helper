const { Router } = require('express');

const flightRoutes = require('./flightRoutes');
const orderRoutes = require('./orderRoutes');
const seatRoutes = require('./seatRoutes');
const popularRoutes = require('./popularRoutes');
const esimRoutes = require('./esimRoutes');
const accomodationRoutes = require('./accomodationRoutes');
const mapsRoutes = require('./mapsRoutes');
const tourRoutes = require('./tourRoutes');

const router = Router();

router.use(flightRoutes);
router.use(orderRoutes);
router.use(seatRoutes);
router.use(popularRoutes);
router.use(esimRoutes);
router.use(accomodationRoutes);
router.use(mapsRoutes);
router.use(tourRoutes);

module.exports = router;
