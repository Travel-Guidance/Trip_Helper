const { Router } = require('express');
const { getSeatMaps } = require('../controllers/seatController');

const router = Router();

/**
 * @swagger
 * /api/seat-maps/{offerId}:
 *   get:
 *     tags: [좌석]
 *     summary: 좌석 배치도 조회
 *     description: 좌석 배치도를 지원하지 않는 항공편은 빈 배열을 반환합니다.
 *     parameters:
 *       - in: path
 *         name: offerId
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: 세그먼트별 좌석 배치도 배열
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/seat-maps/:offerId', getSeatMaps);

module.exports = router;
