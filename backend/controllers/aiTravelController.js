'use strict';

const { chat } = require('../services/geminiService');
const { buildPersonaSystem, getPersona } = require('../domains/aiTravel/persona');
const { enrichPlanWithCoordinates } = require('../services/geocodeService');

async function generatePlan(req, res, next) {
  try {
    const ragService = require('../services/ragService');
    const plan = await ragService.generateTravelPlan(req.body);
    const data = await enrichPlanWithCoordinates(plan, req.body);
    res.json({ success: true, data });
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

module.exports = { generatePlan, chatbot };
