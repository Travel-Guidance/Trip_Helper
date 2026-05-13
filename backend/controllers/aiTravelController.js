'use strict';

const { chat } = require('../services/geminiService');
const { buildPersonaSystem, getPersona } = require('../domains/aiTravel/persona');
const { enrichPlanWithCoordinates } = require('../services/geocodeService');
const { sanitizeAustraliaItinerary } = require('../services/itinerarySanitizer');
const pool = require('../config/database');

function normalizeJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

const CATEGORY_TO_DB = {
  meal: 'food',
  food: 'food',
  transport: 'transport',
  entry: 'entrance',
  entrance: 'entrance',
  shop: 'shopping',
  shopping: 'shopping',
  accommodation: 'accommodation',
  other: 'other',
};

const CATEGORY_TO_CLIENT = {
  food: 'meal',
  transport: 'transport',
  entrance: 'entry',
  shopping: 'shop',
  accommodation: 'accommodation',
  other: 'other',
};

function normalizeExpenseCategory(value) {
  return CATEGORY_TO_DB[String(value || '').trim()] || 'other';
}

function toNumberOrNull(value) {
  if (value === undefined || value === null || value === '') return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function toPositiveAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function formatExpense(row) {
  const amount = Number(row.amount);
  const amountKrw = row.amount_krw == null ? null : Number(row.amount_krw);
  return {
    id: row.id,
    planId: row.plan_id,
    day: row.day_index,
    dayIndex: row.day_index,
    itemIndex: row.item_index,
    source: row.source || 'manual',
    category: row.category,
    cat: CATEGORY_TO_CLIENT[row.category] || 'other',
    amountLocal: Number.isFinite(amount) ? amount : 0,
    amountKrw: Number.isFinite(amountKrw) ? amountKrw : amount,
    currency: row.currency || 'KRW',
    name: row.description || '',
    description: row.description || '',
    spentAt: row.spent_at,
  };
}

async function getOwnedPlan(planId, userId) {
  const [rows] = await pool.query(
    'SELECT id FROM travel_plans WHERE id = ? AND user_id = ?',
    [planId, userId]
  );
  return rows[0] || null;
}

async function generatePlan(req, res, next) {
  try {
    const ragService = require('../services/ragService');
    const plan = await ragService.generateTravelPlan(req.body);
    const ragDebug = plan.ragDebug || null;
    delete plan.ragDebug;
    const enriched = await enrichPlanWithCoordinates(plan, req.body);
    const data = sanitizeAustraliaItinerary(enriched, req.body);

    const userId = req.user?.id || null;
    let savedPlanId = null;
    if (userId) {
      const { destination, country, dest, continent, nights, budget, budgetText } = req.body;
      const destinationName = destination || country || dest || continent || '';
      const [result] = await pool.query(
        'INSERT INTO travel_plans (user_id, destination, plan_data, budget, nights) VALUES (?, ?, ?, ?, ?)',
        [userId, destinationName, JSON.stringify(data), budget || budgetText || '', nights || 0]
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

async function getUserPlans(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT id, destination, budget, nights, created_at FROM travel_plans WHERE user_id = ? ORDER BY created_at DESC LIMIT 20',
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

async function getPlanById(req, res, next) {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM travel_plans WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });
    const plan = rows[0];
    res.json({ ...plan, plan_data: normalizeJson(plan.plan_data, {}) });
  } catch (err) {
    next(err);
  }
}

async function deletePlan(req, res, next) {
  try {
    await pool.query(
      'DELETE FROM travel_plans WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getPlanExpenses(req, res, next) {
  try {
    const planId = Number(req.params.id);
    if (!Number.isInteger(planId) || planId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 일정 ID입니다.' });
    }

    const plan = await getOwnedPlan(planId, req.user.id);
    if (!plan) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

    const [rows] = await pool.query(
      `SELECT id, plan_id, day_index, item_index, source, category, amount, currency, amount_krw, description, spent_at
       FROM expenses
       WHERE plan_id = ?
       ORDER BY spent_at DESC, id DESC`,
      [planId]
    );
    res.json(rows.map(formatExpense));
  } catch (err) {
    next(err);
  }
}

async function createPlanExpense(req, res, next) {
  try {
    const planId = Number(req.params.id);
    if (!Number.isInteger(planId) || planId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 일정 ID입니다.' });
    }

    const plan = await getOwnedPlan(planId, req.user.id);
    if (!plan) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

    const amount = toPositiveAmount(req.body.amount ?? req.body.amountLocal);
    if (!amount) return res.status(400).json({ error: '지출 금액을 입력해 주세요.' });

    const category = normalizeExpenseCategory(req.body.category ?? req.body.cat);
    const description = String(req.body.description ?? req.body.name ?? '').trim().slice(0, 255);
    const currency = String(req.body.currency || 'KRW').trim().slice(0, 10) || 'KRW';
    const amountKrw = toNumberOrNull(req.body.amountKrw ?? req.body.amount_krw);
    const dayIndex = toNumberOrNull(req.body.dayIndex ?? req.body.day);
    const itemIndex = toNumberOrNull(req.body.itemIndex);
    const source = String(req.body.source || 'manual').trim().slice(0, 20) || 'manual';

    const [result] = await pool.query(
      `INSERT INTO expenses
         (plan_id, day_index, item_index, source, category, amount, currency, amount_krw, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [planId, dayIndex, itemIndex, source, category, amount, currency, amountKrw, description || null]
    );

    const [rows] = await pool.query(
      `SELECT id, plan_id, day_index, item_index, source, category, amount, currency, amount_krw, description, spent_at
       FROM expenses
       WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json(formatExpense(rows[0]));
  } catch (err) {
    next(err);
  }
}

async function updatePlanExpense(req, res, next) {
  try {
    const planId = Number(req.params.id);
    const expenseId = Number(req.params.expenseId);
    if (!Number.isInteger(planId) || planId <= 0 || !Number.isInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 요청입니다.' });
    }

    const plan = await getOwnedPlan(planId, req.user.id);
    if (!plan) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

    const [existingRows] = await pool.query(
      'SELECT * FROM expenses WHERE id = ? AND plan_id = ?',
      [expenseId, planId]
    );
    if (!existingRows.length) return res.status(404).json({ error: '지출 내역을 찾을 수 없습니다.' });

    const existing = existingRows[0];
    const amount = req.body.amount !== undefined || req.body.amountLocal !== undefined
      ? toPositiveAmount(req.body.amount ?? req.body.amountLocal)
      : Number(existing.amount);
    if (!amount) return res.status(400).json({ error: '지출 금액을 입력해 주세요.' });

    const category = req.body.category !== undefined || req.body.cat !== undefined
      ? normalizeExpenseCategory(req.body.category ?? req.body.cat)
      : existing.category;
    const description = req.body.description !== undefined || req.body.name !== undefined
      ? String(req.body.description ?? req.body.name ?? '').trim().slice(0, 255)
      : existing.description;
    const currency = req.body.currency !== undefined
      ? String(req.body.currency || 'KRW').trim().slice(0, 10) || 'KRW'
      : existing.currency;
    const amountKrw = req.body.amountKrw !== undefined || req.body.amount_krw !== undefined
      ? toNumberOrNull(req.body.amountKrw ?? req.body.amount_krw)
      : existing.amount_krw;
    const dayIndex = req.body.dayIndex !== undefined || req.body.day !== undefined
      ? toNumberOrNull(req.body.dayIndex ?? req.body.day)
      : existing.day_index;
    const itemIndex = req.body.itemIndex !== undefined
      ? toNumberOrNull(req.body.itemIndex)
      : existing.item_index;
    const source = req.body.source !== undefined
      ? String(req.body.source || 'manual').trim().slice(0, 20) || 'manual'
      : existing.source;

    await pool.query(
      `UPDATE expenses
       SET day_index = ?, item_index = ?, source = ?, category = ?, amount = ?, currency = ?, amount_krw = ?, description = ?
       WHERE id = ? AND plan_id = ?`,
      [dayIndex, itemIndex, source, category, amount, currency, amountKrw, description || null, expenseId, planId]
    );

    const [rows] = await pool.query(
      `SELECT id, plan_id, day_index, item_index, source, category, amount, currency, amount_krw, description, spent_at
       FROM expenses
       WHERE id = ?`,
      [expenseId]
    );
    res.json(formatExpense(rows[0]));
  } catch (err) {
    next(err);
  }
}

async function deletePlanExpense(req, res, next) {
  try {
    const planId = Number(req.params.id);
    const expenseId = Number(req.params.expenseId);
    if (!Number.isInteger(planId) || planId <= 0 || !Number.isInteger(expenseId) || expenseId <= 0) {
      return res.status(400).json({ error: '유효하지 않은 요청입니다.' });
    }

    const plan = await getOwnedPlan(planId, req.user.id);
    if (!plan) return res.status(404).json({ error: '일정을 찾을 수 없습니다.' });

    const [result] = await pool.query(
      'DELETE FROM expenses WHERE id = ? AND plan_id = ?',
      [expenseId, planId]
    );
    if (!result.affectedRows) return res.status(404).json({ error: '지출 내역을 찾을 수 없습니다.' });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

async function getChatContext(destination, message) {
  if (!destination) return '';

  try {
    const { retrieveContext } = require('../services/ragService');
    return retrieveContext(`${destination} ${message}`, { dest: destination, limit: 3 });
  } catch {
    return '';
  }
}

async function chatbot(req, res, next) {
  try {
    const { message, history = [], destination = '' } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: '메시지를 입력해 주세요.' });
    }

    const ragContext = await getChatContext(destination, message);
    const systemPrompt = buildPersonaSystem(destination, ragContext);
    const reply = await chat(history, message, systemPrompt);
    const persona = getPersona(destination);

    res.json({
      success: true,
      reply,
      persona: { name: persona.name, emoji: persona.emoji },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  generatePlan,
  chatbot,
  getUserPlans,
  getPlanById,
  deletePlan,
  getPlanExpenses,
  createPlanExpense,
  updatePlanExpense,
  deletePlanExpense,
};
