const duffel = require('../config/duffel');

async function getPlaces(query) {
  if (!query || query.length < 2) return [];
  const { data } = await duffel.suggestions.list({ query });
  const results = [];
  const seen = new Set();
  for (const item of data || []) {
    if (item.type === 'airport' && item.iata_code && !seen.has(item.iata_code)) {
      seen.add(item.iata_code);
      results.push(item);
    } else if (item.type === 'city' && item.iata_city_code && !seen.has(item.iata_city_code)) {
      seen.add(item.iata_city_code);
      results.push(item);
      if (Array.isArray(item.airports)) {
        for (const ap of item.airports) {
          if (ap.iata_code && !seen.has(ap.iata_code)) {
            seen.add(ap.iata_code);
            results.push({ ...ap, city_name: item.name });
          }
        }
      }
    }
  }
  return results.slice(0, 8);
}

async function searchFlights({ origin, destination, departure_date, return_date, adults = 1, cabin_class = 'economy', trip_type = 'round' }) {
  const slices = [{ origin, destination, departure_date }];
  if (trip_type === 'round' && return_date) {
    slices.push({ origin: destination, destination: origin, departure_date: return_date });
  }
  const passengers = Array.from({ length: Number(adults) }, () => ({ type: 'adult' }));
  const { data } = await duffel.offerRequests.create({ slices, passengers, cabin_class, return_offers: true });
  return { offer_request_id: data.id, offers: data.offers || [] };
}

async function getOffer(id) {
  const { data } = await duffel.offers.get(id);
  return data;
}

async function createDuffelOrder({ offer_id, passengers, services = [], total_amount, total_currency }) {
  const { data } = await duffel.orders.create({
    selected_offers: [offer_id],
    passengers,
    ...(services.length > 0 && { services }),
    payments: [{ type: 'balance', amount: total_amount, currency: total_currency }],
    type: 'instant',
  });
  return data;
}

async function getOrder(id) {
  const { data } = await duffel.orders.get(id);
  return data;
}

async function getSeatMaps(offerId) {
  const { data } = await duffel.seatMaps.get({ offer_id: offerId });
  return data || [];
}

module.exports = { getPlaces, searchFlights, getOffer, createDuffelOrder, getOrder, getSeatMaps };
