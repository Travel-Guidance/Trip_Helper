const { Router } = require('express');
const { purchaseEsim } = require('../controllers/esimController');

const router = Router();

/**
 * @swagger
 * /api/esim/purchase:
 *   post:
 *     tags: [eSIM]
 *     summary: eSIM 구매 및 활성화 코드 이메일 발송
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, code]
 *             properties:
 *               email: { type: string, format: email }
 *               code: { type: string, example: AB3K-7PQR-XN2M-CDF9 }
 *               totalPrice: { type: integer }
 *               countries: { type: array, items: { type: object } }
 *     responses:
 *       200:
 *         description: 이메일 발송 완료 후 코드 반환
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok: { type: boolean }
 *                 code: { type: string }
 *       400:
 *         description: 필수 값 누락
 */
router.post('/esim/purchase', purchaseEsim);

module.exports = router;
