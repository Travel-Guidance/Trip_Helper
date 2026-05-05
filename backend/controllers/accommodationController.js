const accommodationService = require('../services/accommodationService');

async function searchStays(req, res, next) {
  try {
    const data = await accommodationService.searchStays(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getStayDetail(req, res, next) {
  try {
    const data = await accommodationService.getStayDetail(req.params.hotelCode);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getStayOffers(req, res, next) {
  try {
    const data = await accommodationService.getStayOffers({
      hotelId: req.params.hotelCode,
      checkIn: req.query.checkIn,
      checkOut: req.query.checkOut,
      guests: req.query.guests,
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function createMockStayBooking(req, res, next) {
  try {
    const data = await accommodationService.createMockStayBooking(req.body);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { searchStays, getStayDetail, getStayOffers, createMockStayBooking };


