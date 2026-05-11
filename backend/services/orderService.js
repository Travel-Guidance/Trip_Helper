const flightService = require('./flightService');
const { genBookingRef, sendBookingEmail } = require('./emailService');
const pool = require('../config/database');

async function createOrder({ offer_id, passengers, services = [], userId = null }) {
  const offer = await flightService.getOffer(offer_id);
  const bookingRef = genBookingRef();

  let orderData;
  try {
    const data = await flightService.createDuffelOrder({
      offer_id,
      passengers,
      services,
      total_amount: offer.total_amount,
      total_currency: offer.total_currency,
    });
    orderData = { ...data, booking_reference: data.booking_reference || bookingRef };
  } catch (duffelErr) {
    const errMsg = duffelErr.errors?.[0]?.message || duffelErr.message || '';
    console.warn('Duffel order failed (demo fallback):', errMsg || JSON.stringify(duffelErr.errors));
    orderData = {
      id: 'demo_' + Math.random().toString(36).slice(2, 14),
      booking_reference: bookingRef,
      passengers: passengers.map(p => ({
        id: p.id,
        given_name: p.given_name,
        family_name: p.family_name,
        email: p.email,
        phone_number: p.phone_number,
        born_on: p.born_on,
        gender: p.gender,
        title: p.title,
      })),
      slices: offer.slices,
      total_amount: offer.total_amount,
      total_currency: offer.total_currency,
      base_amount: offer.base_amount,
      tax_amount: offer.tax_amount,
      payment_status: { awaiting_payment: false },
      created_at: new Date().toISOString(),
    };
  }

  const pax = passengers[0];
  if (pax?.email) {
    sendBookingEmail({
      to: pax.email,
      passengerName: `${pax.given_name} ${pax.family_name}`,
      bookingRef: orderData.booking_reference,
      slices: orderData.slices || [],
      totalAmount: orderData.total_amount,
      totalCurrency: orderData.total_currency,
    }).catch(err => console.error('Email error:', err.message));
  }

  if (userId) {
    pool.query(
      `INSERT INTO flight_bookings
         (user_id, booking_reference, offer_id, passengers, slices, total_amount, total_currency)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        orderData.booking_reference,
        offer_id,
        JSON.stringify(orderData.passengers || passengers),
        JSON.stringify(orderData.slices || []),
        orderData.total_amount || null,
        orderData.total_currency || 'USD',
      ]
    ).catch(err => console.error('flight_bookings save error:', err.message));
  }

  return orderData;
}

module.exports = { createOrder };
