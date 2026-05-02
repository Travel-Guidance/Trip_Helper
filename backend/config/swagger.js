const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: '폰가이즈 API',
      version: '1.0.0',
      description: 'Duffel API 기반 항공권 조회·예약 및 eSIM 구매 백엔드\n\n**테스트 환경** — 실제 결제·발권이 이루어지지 않습니다.',
    },
    servers: [{ url: 'http://localhost:3001' }],
    tags: [
      { name: '항공권', description: '항공편 검색, 오퍼 조회, 예약 생성' },
      { name: '좌석', description: '좌석 배치도 조회' },
      { name: '예약조회', description: '생성된 예약 상세 조회' },
      { name: '인기여행지', description: '홈 화면 인기 여행지 정적 데이터' },
      { name: 'eSIM', description: 'eSIM 구매 및 이메일 발송' },
    ],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: { error: { type: 'string', example: '오류 메시지' } },
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
