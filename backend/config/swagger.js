const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: '폰가이즈 API',
      version: '1.0.0',
      description: 'Duffel API 기반 항공권 조회·예약, Booking.com API 기반 숙소 검색·상세 조회, eSIM 구매 백엔드\n\n**테스트 환경** — 실제 결제·발권이 이루어지지 않습니다.',
    },
    servers: [{ url: process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3001}` }],
    tags: [
      { name: '항공권', description: '항공편 검색, 오퍼 조회, 예약 생성' },
      { name: '좌석', description: '좌석 배치도 조회' },
      { name: '예약조회', description: '생성된 예약 상세 조회' },
      { name: '인기여행지', description: '홈 화면 인기 여행지 정적 데이터' },
      { name: 'eSIM', description: 'eSIM 구매 및 이메일 발송' },
      { name: '숙소', description: 'Booking.com API 기반 숙소 검색 및 상세 조회' },
      { name: '지도', description: 'Google Maps Embed API 기반 위치 확인' },
      { name: '투어티켓', description: 'Google Places API 기반 해외 관광명소 검색' },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: { error: { type: 'string', example: '오류 메시지' } },
        },
        StaySearchRequest: {
          type: 'object',
          required: ['country'],
          properties: {
            country: { type: 'string', example: '터키' },
            checkIn: { type: 'string', format: 'date', example: '2026-05-11' },
            checkOut: { type: 'string', format: 'date', example: '2026-05-29' },
            guests: { type: 'integer', default: 2, example: 2 },
          },
        },
        StaySummary: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '169036' },
            name: { type: 'string', example: 'Rixos Pera Istanbul' },
            location: { type: 'string', example: 'New City · Istanbul' },
            rating: { type: 'integer', nullable: true, example: 5 },
            price: { type: 'number', example: 4089.14, description: '검색 기간 기준 최저 총액' },
            currency: { type: 'string', example: 'USD' },
            image: { type: 'string', example: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/12345678.jpg' },
            tag: { type: 'string', nullable: true, example: null },
          },
        },
        StayDetail: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '169036' },
            name: { type: 'string', example: 'Rixos Pera Istanbul' },
            description: { type: 'string', example: 'Hotel description' },
            address: { type: 'string', example: 'Kamerhatun Mah. Mesrutiyet Cad. No:44' },
            city: { type: 'string', example: 'Istanbul' },
            destination: { type: 'string', example: 'Istanbul' },
            zone: { type: 'string', example: 'New City' },
            rating: { type: 'integer', nullable: true, example: 5 },
            category: { type: 'string', example: '5 STARS' },
            coordinates: {
              type: 'object',
              nullable: true,
              properties: {
                longitude: { type: 'number', example: 28.9732 },
                latitude: { type: 'number', example: 41.0311 },
              },
            },
            phones: { type: 'array', items: { type: 'string' } },
            emails: { type: 'array', items: { type: 'string' } },
            images: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  url: { type: 'string', example: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/12345678.jpg' },
                },
              },
            },
            facilities: { type: 'array', items: { type: 'string' } },
          },
        },
        StayBookingRequest: {
          type: 'object',
          required: ['hotelCode', 'checkIn', 'checkOut', 'guestName', 'email'],
          properties: {
            hotelCode: { type: 'string', example: '169036' },
            hotelName: { type: 'string', example: 'Rixos Pera Istanbul' },
            location: { type: 'string', example: 'New City · Istanbul' },
            country: { type: 'string', example: '터키' },
            checkIn: { type: 'string', format: 'date', example: '2026-05-11' },
            checkOut: { type: 'string', format: 'date', example: '2026-05-29' },
            guests: { type: 'integer', example: 2 },
            guestName: { type: 'string', example: '솔민 김' },
            email: { type: 'string', format: 'email', example: 'guest@example.com' },
            totalAmount: { type: 'number', example: 408900 },
            totalCurrency: { type: 'string', example: 'KRW' },
            image: { type: 'string', example: 'https://cf.bstatic.com/xdata/images/hotel/max1024x768/12345678.jpg' },
          },
        },
        StayBooking: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'stay_demo_ab12cd34ef56' },
            booking_reference: { type: 'string', example: 'STAY7R4Q9Y' },
            status: { type: 'string', example: 'confirmed' },
            test_mode: { type: 'boolean', example: true },
            guest_name: { type: 'string', example: '솔민 김' },
            email: { type: 'string', example: 'guest@example.com' },
            hotel: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '169036' },
                name: { type: 'string', example: 'Rixos Pera Istanbul' },
                location: { type: 'string', example: 'New City · Istanbul' },
                image: { type: 'string' },
              },
            },
            check_in: { type: 'string', format: 'date', example: '2026-05-11' },
            check_out: { type: 'string', format: 'date', example: '2026-05-29' },
            nights: { type: 'integer', example: 18 },
            guests: { type: 'integer', example: 2 },
            total_amount: { type: 'number', example: 4089.14 },
            total_currency: { type: 'string', example: 'EUR' },
            email_sent: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        Error: {
          description: '서버 오류',
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } },
        },
      },
    },
  },
  apis: ['./routes/*.js'],
});

module.exports = { swaggerUi, swaggerSpec };
