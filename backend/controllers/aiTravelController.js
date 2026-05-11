'use strict';

const { chat } = require('../services/geminiService');
const { buildPersonaSystem, getPersona } = require('../domains/aiTravel/persona');
const { enrichPlanWithCoordinates } = require('../services/geocodeService');
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

async function generatePlan(req, res, next) {
  try {
    const ragService = require('../services/ragService');
    const plan = await ragService.generateTravelPlan(req.body);
    const data = await enrichPlanWithCoordinates(plan, req.body);

    const userId = req.user?.id || null;
    let savedPlanId = null;
    if (userId) {
      const { destination, nights, budget } = req.body;
      const [result] = await pool.query(
        'INSERT INTO travel_plans (user_id, destination, plan_data, budget, nights) VALUES (?, ?, ?, ?, ?)',
        [userId, destination || '', JSON.stringify(data), budget || '', nights || 0]
      );
      savedPlanId = result.insertId;
    }

    res.json({ success: true, data, planId: savedPlanId });
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

module.exports = { generatePlan, chatbot, getUserPlans, getPlanById, deletePlan };
