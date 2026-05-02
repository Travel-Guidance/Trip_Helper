const orderService = require('../services/orderService');
const flightService = require('../services/flightService');

async function createOrder(req, res, next) {
  try {
    const { offer_id, passengers, services = [] } = req.body;
    const orderData = await orderService.createOrder({ offer_id, passengers, services });
    res.json(orderData);
  } catch (err) {
    const msg = err.errors?.[0]?.message || err.message || '예약 처리 중 오류가 발생했습니다';
    next(Object.assign(err, { message: msg }));
  }
}

async function getOrder(req, res, next) {
  try {
    const data = await flightService.getOrder(req.params.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, getOrder };
