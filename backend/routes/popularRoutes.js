const { Router } = require('express');
const { getPopular } = require('../controllers/popularController');

const router = Router();

/**
 * @swagger
 * /api/popular:
 *   get:
 *     tags: [인기여행지]
 *     summary: 인기 여행지 목록
 *     description: 홈 화면에 표시되는 인기 여행지 16개 정적 데이터
 *     responses:
 *       200:
 *         description: 인기 여행지 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: integer }
 *                   city: { type: string }
 *                   code: { type: string }
 *                   country: { type: string }
 *                   price: { type: integer }
 *                   region: { type: string }
 */
router.get('/popular', getPopular);

module.exports = router;
