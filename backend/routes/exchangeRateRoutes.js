const { Router } = require('express');
const { getRate } = require('../controllers/exchangeRateController');

const router = Router();

router.get('/exchange-rate', getRate);

module.exports = router;
