'use strict';

const { Router } = require('express');
const pool = require('../config/database');
const requireAuth = require('../middlewares/requireAuth');

const router = Router();

function normalizeJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

// GET /api/bookings — 내 예약 전체 (항공 + 숙소 + AI 일정)
router.get('/bookings', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;

    const [flights] = await pool.query(
      `SELECT id, booking_reference, offer_id, status,
              passengers, slices, total_amount, total_currency, created_at
       FROM flight_bookings
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    const [stays] = await pool.query(
      `SELECT id, booking_reference, hotel_id, hotel_name, location,
              check_in, check_out, nights, guests,
              total_amount, total_currency, image_url, created_at
       FROM stay_bookings
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    const [plans] = await pool.query(
      `SELECT id, destination, budget, nights, created_at
       FROM travel_plans
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 20`,
      [userId]
    );

    res.json({
      flights: flights.map(f => ({
        ...f,
        passengers: normalizeJson(f.passengers, []),
        slices:     normalizeJson(f.slices, []),
      })),
      stays,
      plans,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
