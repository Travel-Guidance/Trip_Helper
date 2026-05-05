const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const RAPIDAPI_HOST = 'hotels-com-provider.p.rapidapi.com';
const BASE_URL = `https://${RAPIDAPI_HOST}`;

function getHeaders() {
  return {
    'x-rapidapi-key': RAPIDAPI_KEY,
    'x-rapidapi-host': RAPIDAPI_HOST,
  };
}

module.exports = { BASE_URL, getHeaders };
