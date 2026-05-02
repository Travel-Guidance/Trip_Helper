const { Router } = require('express');
const { getPlaces, searchFlights, getOffer } = require('../controllers/flightController');

const router = Router();

/**
 * @swagger
 * /api/places:
 *   get:
 *     tags: [항공권]
 *     summary: 공항/도시 자동완성
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema: { type: string, minLength: 2 }
 *         example: tokyo
 *     responses:
 *       200:
 *         description: 공항/도시 목록 (최대 8개)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   iata_code: { type: string }
 *                   name: { type: string }
 *                   city_name: { type: string }
 *                   type: { type: string, enum: [airport, city] }
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/places', getPlaces);

/**
 * @swagger
 * /api/search:
 *   post:
 *     tags: [항공권]
 *     summary: 항공권 검색
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [origin, destination, departure_date]
 *             properties:
 *               origin: { type: string, example: ICN }
 *               destination: { type: string, example: NRT }
 *               departure_date: { type: string, format: date, example: "2026-08-01" }
 *               return_date: { type: string, format: date, example: "2026-08-08" }
 *               adults: { type: integer, default: 1 }
 *               cabin_class: { type: string, enum: [economy, premium_economy, business, first], default: economy }
 *               trip_type: { type: string, enum: [round, one_way], default: round }
 *     responses:
 *       200:
 *         description: 검색된 항공편 목록
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/search', searchFlights);

/**
 * @swagger
 * /api/offers/{id}:
 *   get:
 *     tags: [항공권]
 *     summary: 항공편 오퍼 상세 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 오퍼 상세 정보
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/offers/:id', getOffer);

module.exports = router;
