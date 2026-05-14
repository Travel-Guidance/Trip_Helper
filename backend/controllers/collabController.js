'use strict';

// 공동작업 일정 생성 전용 컨트롤러
const { runCollabAgent } = require('../services/collabAgentService');
const { enrichPlanWithCoordinates } = require('../services/geocodeService');
const { sanitizeAustraliaItinerary } = require('../services/itinerarySanitizer');
const pool = require('../config/database');

function normalizeBudgetForStorage({ budget, budgetText, totalBudgetWon } = {}) {
  const candidates = [budgetText, budget, totalBudgetWon]
    .filter(value => value !== undefined && value !== null && value !== '');

  const value = candidates[0];
  if (value === undefined) return '';

  if (typeof value === 'object') {
    const label = value.label || value.text || value.value || value.amount || '';
    return String(label).trim().slice(0, 20);
  }

  return String(value).trim().slice(0, 20);
}

async function generateCollabPlan(req, res, next) {
  try {
    const plan = await runCollabAgent(req.body);
    const ragDebug = plan.ragDebug || null;
    delete plan.ragDebug;
    const enriched = await enrichPlanWithCoordinates(plan, req.body);
    const data = sanitizeAustraliaItinerary(enriched, req.body);

    const userId = req.user?.id || null;
    let savedPlanId = null;
    if (userId) {
      const { destination, country, nights } = req.body;
      const destinationName = destination || country || '';
      const budgetLabel = normalizeBudgetForStorage(req.body);
      const [result] = await pool.query(
        'INSERT INTO travel_plans (user_id, destination, plan_data, budget, nights) VALUES (?, ?, ?, ?, ?)',
        [userId, destinationName, JSON.stringify(data), budgetLabel, nights || 0]
      );
      savedPlanId = result.insertId;
    }

    res.json({
      success: true,
      data,
      planId: savedPlanId,
      ...(req.body.includeDebug ? { debug: { rag: ragDebug } } : {}),
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { generateCollabPlan };
