'use strict';

const { chat } = require('../services/chatbotService');

async function sendMessage(req, res) {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: '메시지를 입력해주세요.' });
  }

  try {
    const reply = await chat(message.trim(), history || []);
    return res.json({ reply });
  } catch (err) {
    console.error('[Chatbot]', err.message);
    if (err.message.includes('GEMINI_CHATBOT_KEY')) {
      return res.status(503).json({ error: '챗봇 서비스가 준비 중입니다.' });
    }
    return res.status(500).json({ error: '답변을 생성하는 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.' });
  }
}

module.exports = { sendMessage };
