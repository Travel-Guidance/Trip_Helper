const { genAI, chatModel, embeddingModel, CHAT_MODEL_NAME } = require('../config/gemini');

// 429 에러 시 제안된 대기 시간 파싱 후 재시도 (최대 2회)
async function withRetry(fn, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err.message?.includes('429') || err.status === 429;
      if (!is429 || attempt === maxRetries) throw err;

      const match = err.message?.match(/retry in (\d+(?:\.\d+)?)s/i);
      const delaySec = match ? Math.ceil(parseFloat(match[1])) : (attempt + 1) * 15;
      console.warn(`[Gemini] 429 quota — ${delaySec}s 후 재시도 (${attempt + 1}/${maxRetries})`);
      await new Promise(r => setTimeout(r, delaySec * 1000));
    }
  }
}

async function generateText(prompt, systemInstruction = null) {
  const model = systemInstruction
    ? genAI.getGenerativeModel({ model: CHAT_MODEL_NAME, systemInstruction })
    : chatModel;
  return withRetry(async () => {
    const result = await model.generateContent(prompt);
    return result.response.text();
  });
}

async function getEmbedding(text) {
  return withRetry(async () => {
    const result = await embeddingModel.embedContent(text);
    return result.embedding.values;
  });
}

async function chat(history = [], message, systemInstruction = null) {
  const model = systemInstruction
    ? genAI.getGenerativeModel({ model: CHAT_MODEL_NAME, systemInstruction })
    : chatModel;
  return withRetry(async () => {
    const session = model.startChat({ history });
    const result = await session.sendMessage(message);
    return result.response.text();
  });
}

module.exports = { generateText, getEmbedding, chat };
