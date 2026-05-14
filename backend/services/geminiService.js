'use strict';

const { genAI, chatModel, embeddingModel, CHAT_MODEL_NAME } = require('../config/gemini');

const BASE_DELAY_MS = 10_000;
const TRANSIENT_BASE_DELAY_MS = 2_000;
const MAX_DELAY_MS = 120_000;
const MAX_RETRIES = 4;

function getErrorText(err) {
  return [
    err?.message,
    err?.status,
    err?.statusText,
    err?.errorDetails && JSON.stringify(err.errorDetails),
  ].filter(Boolean).join(' ');
}

function isDailyQuotaExceeded(err) {
  return /GenerateRequestsPerDay|free_tier_requests|current quota|quota exceeded/i.test(getErrorText(err));
}

function isRateLimitError(err) {
  return err?.status === 429 || /\b429\b|rate.?limit|quota/i.test(getErrorText(err));
}

function isTransientGeminiError(err) {
  return (
    err?.status === 503
    || /\b503\b|service unavailable|unavailable|high demand|temporar/i.test(getErrorText(err))
  );
}

function toQuotaError(err) {
  const quotaError = new Error(
    'Gemini free-tier daily quota has been exceeded. Please try again later or check your Gemini API billing/quota settings.'
  );
  quotaError.status = 429;
  quotaError.cause = err;
  return quotaError;
}

async function withRetry(fn, maxRetries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = isRateLimitError(err);
      const isTransient = isTransientGeminiError(err);

      if (is429 && isDailyQuotaExceeded(err)) {
        console.warn('[Gemini] Daily quota exceeded; skipping retries.');
        throw toQuotaError(err);
      }

      if ((!is429 && !isTransient) || attempt === maxRetries) throw err;

      const hintMatch = getErrorText(err).match(/retry in (\d+(?:\.\d+)?)s/i);
      const hintMs = hintMatch ? Math.ceil(parseFloat(hintMatch[1])) * 1000 : 0;
      const baseDelayMs = is429 ? BASE_DELAY_MS : TRANSIENT_BASE_DELAY_MS;
      const expMs = Math.min(baseDelayMs * Math.pow(2, attempt), MAX_DELAY_MS);
      const baseMs = Math.max(hintMs, expMs);
      const delayMs = Math.round(baseMs * (0.8 + Math.random() * 0.4));

      console.warn(
        `[Gemini] ${is429 ? '429 rate limit' : '503/unavailable'}; retrying in ${Math.round(delayMs / 1000)}s `
        + `(attempt ${attempt + 1}/${maxRetries})`
      );
      await new Promise(resolve => setTimeout(resolve, delayMs));
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

async function generateFromImage(prompt, imageBuffer, mimeType, generationConfig = null) {
  const modelConfig = generationConfig
    ? { model: CHAT_MODEL_NAME, generationConfig }
    : { model: CHAT_MODEL_NAME };
  const model = genAI.getGenerativeModel(modelConfig);
  return withRetry(async () => {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      },
    ]);
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

module.exports = { generateText, generateFromImage, getEmbedding, chat, withRetry };
