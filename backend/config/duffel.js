require('dotenv').config();
const { Duffel } = require('@duffel/api');

module.exports = new Duffel({ token: process.env.DUFFEL_ACCESS_TOKEN });
