const { pickImage } = require('../data/hotelImages')

function getFallbackHotelImage(code) {
  return pickImage(code)
}

module.exports = { getFallbackHotelImage }
