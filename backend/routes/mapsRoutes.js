const { Router } = require('express')
const { getEmbedUrl, getRoute } = require('../controllers/mapsController')

const router = Router()

/**
 * @swagger
 * /api/maps/embed-url:
 *   get:
 *     tags: [지도]
 *     summary: Google Maps Embed URL 생성
 *     description: 숙소명, 주소 또는 좌표를 기준으로 Google Maps Embed API URL과 새 탭용 지도 URL을 반환합니다.
 *     parameters:
 *       - in: query
 *         name: query
 *         schema: { type: string }
 *         example: Rixos Pera Istanbul
 *       - in: query
 *         name: lat
 *         schema: { type: number }
 *         example: 41.0311
 *       - in: query
 *         name: lng
 *         schema: { type: number }
 *         example: 28.9732
 *     responses:
 *       200:
 *         description: 지도 URL
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/maps/embed-url', getEmbedUrl)
router.get('/maps/route', getRoute)

module.exports = router
