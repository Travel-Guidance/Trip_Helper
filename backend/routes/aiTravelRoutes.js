const { Router } = require('express');
const {
  generatePlan,
  chatbot,
  getUserPlans,
  getPlanById,
  deletePlan,
  getPlanExpenses,
  createPlanExpense,
  updatePlanExpense,
  deletePlanExpense,
  rebudgetPlanDay,
} = require('../controllers/aiTravelController');
const { generateCollabPlan } = require('../controllers/collabController');
const { aiLimiter } = require('../middlewares/rateLimiter');
const optionalAuth = require('../middlewares/optionalAuth');
const requireAuth = require('../middlewares/requireAuth');

const router = Router();

/**
 * @swagger
 * /ai-travel/generate:
 *   post:
 *     summary: AI 여행 일정 생성 (RAG + Gemini)
 *     tags: [AI Travel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               continent:
 *                 type: string
 *               country:
 *                 type: string
 *               nights:
 *                 type: integer
 *               budget:
 *                 type: string
 *                 enum: [low, mid, high]
 *               styles:
 *                 type: array
 *                 items:
 *                   type: string
 *               difficulty:
 *                 type: string
 *                 enum: [relaxed, normal, active, intense]
 *               adults:
 *                 type: integer
 *               children:
 *                 type: integer
 *               mustVisit:
 *                 type: string
 *     responses:
 *       200:
 *         description: 생성된 여행 일정
 */
router.post('/ai-travel/generate', aiLimiter, optionalAuth, generatePlan);

router.get('/ai-travel/plans', requireAuth, getUserPlans);
router.post('/ai-travel/plans/:id/rebudget-day', requireAuth, rebudgetPlanDay);
router.get('/ai-travel/plans/:id/expenses', requireAuth, getPlanExpenses);
router.post('/ai-travel/plans/:id/expenses', requireAuth, createPlanExpense);
router.put('/ai-travel/plans/:id/expenses/:expenseId', requireAuth, updatePlanExpense);
router.delete('/ai-travel/plans/:id/expenses/:expenseId', requireAuth, deletePlanExpense);
router.get('/ai-travel/plans/:id', requireAuth, getPlanById);
router.delete('/ai-travel/plans/:id', requireAuth, deletePlan);

/**
 * @swagger
 * /ai-travel/chat:
 *   post:
 *     summary: 여행 챗봇 (국가 정보, 사용설명 등)
 *     tags: [AI Travel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *               history:
 *                 type: array
 *     responses:
 *       200:
 *         description: 챗봇 응답
 */
router.post('/ai-travel/chat', aiLimiter, chatbot);

// 공동작업 일정 생성 전용 라우트
router.post('/ai-travel/generate-collab', aiLimiter, optionalAuth, generateCollabPlan);

module.exports = router;
