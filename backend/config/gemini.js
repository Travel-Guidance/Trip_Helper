const { GoogleGenerativeAI } = require('@google/generative-ai');

if (!process.env.GEMINI_API_KEY) {
  console.warn('GEMINI_API_KEY not set — AI features will not work');
}

const apiKey = process.env.GEMINI_API_KEY || 'placeholder';

const genAI = new GoogleGenerativeAI(apiKey);

const CHAT_MODEL_NAME = 'gemini-2.0-flash';

const chatModel      = genAI.getGenerativeModel({ model: CHAT_MODEL_NAME });
const embeddingModel = genAI.getGenerativeModel({ model: 'gemini-embedding-001' });

module.exports = { genAI, chatModel, embeddingModel, CHAT_MODEL_NAME };
