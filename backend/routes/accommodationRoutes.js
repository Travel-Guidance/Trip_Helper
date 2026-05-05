const { Router } = require('express');
const { searchStays, getStayDetail, getStayOffers, createMockStayBooking } = require('../controllers/accommodationController');

const router = Router();

/**
 * @swagger
 * /api/stays/search:
 *   post:
 *     tags: [숙소]
 *     summary: 숙소 검색 (Booking.com)
 *     description: 국가, 체크인/체크아웃, 성인 수를 기준으로 Booking.com API에서 숙소를 검색합니다. 응답의 price는 검색 기간 전체 기준 최저 총액입니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StaySearchRequest'
 *     responses:
 *       200:
 *         description: 숙소 목록
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/StaySummary'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/stays/search', searchStays);

/**
 * @swagger
 * /api/stays/bookings:
 *   post:
 *     tags: [숙소]
 *     summary: 숙소 가예약 생성
 *     description: 테스트 예약번호를 발급한 뒤 확인 이메일을 발송합니다. 실제 결제는 이루어지지 않습니다.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/StayBookingRequest'
 *     responses:
 *       200:
 *         description: 가예약 완료 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StayBooking'
 *       409:
 *         description: 선택한 일정에 예약 가능한 객실이 없음
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.post('/stays/bookings', createMockStayBooking);

router.get('/stays/:hotelCode/offers', getStayOffers);

/**
 * @swagger
 * /api/stays/{hotelCode}:
 *   get:
 *     tags: [숙소]
 *     summary: 숙소 상세 조회 (Booking.com)
 *     description: 호텔 ID를 기준으로 숙소 설명, 주소, 이미지, 편의시설 등 상세 정보를 조회합니다.
 *     parameters:
 *       - in: path
 *         name: hotelCode
 *         required: true
 *         schema: { type: string }
 *         example: "169036"
 *     responses:
 *       200:
 *         description: 숙소 상세 정보
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StayDetail'
 *       500:
 *         $ref: '#/components/responses/Error'
 */
router.get('/stays/:hotelCode', getStayDetail);

module.exports = router;
