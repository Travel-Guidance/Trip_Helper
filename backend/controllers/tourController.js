const tourService = require('../services/tourService');

async function searchTours(req, res, next) {
  try {
    const data = await tourService.searchTours(req.query);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getTourDetail(req, res, next) {
  try {
    const data = await tourService.getTourDetail(req.params.placeId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

async function getTourPhoto(req, res, next) {
  try {
    const photoUri = await tourService.getTourPhotoUri(req.query.name);
    res.set('Cache-Control', 'public, max-age=3600');
    res.redirect(photoUri);
  } catch (err) {
    next(err);
  }
}

module.exports = { searchTours, getTourDetail, getTourPhoto };
