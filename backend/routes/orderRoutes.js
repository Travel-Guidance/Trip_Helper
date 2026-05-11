const { Router } = require('express');
const { createOrder, getOrder } = require('../controllers/orderController');
const optionalAuth = require('../middlewares/optionalAuth');

const router = Router();

/**
 * @swagger
 * /api/orders:
 *   post:
 *     tags: [항공권]
 *     summary: 항공권 예약 생성
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offer_id, passengers]
 *             properties:
 *               offer_id: { type: string }
 *               passengers:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id: { type: string }
 *                     given_name: { type: string }
 *                     family_name: { type: string }
 *                     gender: { type: string, enum: [m, f] }
 *                     title: { type: string, enum: [mr, ms, mrs, miss, dr] }
 *                     born_on: { type: string, format: date }
 *                     email: { type: string, format: email }
 *                     phone_number: { type: string }
 *               services: { type: array, items: { type: object } }
 *     responses:
 *       200:
 *         description: 예약 완료된 order 정보
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/orders', optionalAuth, createOrder);

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     tags: [예약조회]
 *     summary: 예약 내역 조회
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 예약 상세 정보
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/orders/:id', getOrder);

module.exports = router;
