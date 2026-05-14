'use strict';

const { genAI, chatModel, embeddingModel, CHAT_MODEL_NAME } = require('../config/gemini');

const BASE_DELAY_MS = 10_000   
const MAX_DELAY_MS  = 120_000  
const MAX_RETRIES   = 4

function isDailyQuotaExceeded(err) {
  const message = String(err.message || '')
  return /GenerateRequestsPerDay|free_tier_requests|current quota|quota exceeded/i.test(message)
}

function toQuotaError(err) {
  const quotaError = new Error(
    'Gemini 무료 사용량 한도를 초과했습니다. 잠시 후 다시 시도하거나 Gemini API 결제/쿼터 설정을 확인해 주세요.'
  )
  quotaError.status = 429
  quotaError.cause = err
  return quotaError
}

async function withRetry(fn, maxRetries = MAX_RETRIES) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const is429 = err.message?.includes('429') || err.status === 429
      const is503 = err.message?.includes('503') || err.status === 503

      if (is429 && isDailyQuotaExceeded(err)) {
        console.warn('[Gemini] 429 — 일일 할당량 초과, 재시도하지 않음')
        throw toQuotaError(err)
      }
      if ((!is429 && !is503) || attempt === maxRetries) throw err

      // API가 제안한 대기 시간 파싱 (있으면 우선 사용)
      const hintMatch = err.message?.match(/retry in (\d+(?:\.\d+)?)s/i)
      const hintMs = hintMatch ? Math.ceil(parseFloat(hintMatch[1])) * 1000 : 0

      // 지수 백오프: BASE * 2^attempt, 최대 MAX_DELAY_MS
      const expMs = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_DELAY_MS)

      // API 힌트와 지수값 중 더 큰 값 채택 + ±20% 지터
      const baseMs  = Math.max(hintMs, expMs)
      const delayMs = Math.round(baseMs * (0.8 + Math.random() * 0.4))

      const code = is503 ? '503' : '429'
      console.warn(
        `[Gemini] ${code} — 지수 백오프 ${Math.round(delayMs / 1000)}s 대기` +
        ` (시도 ${attempt + 1}/${maxRetries})`
      )
      await new Promise(r => setTimeout(r, delayMs))
    }
  }
}

async function generateText(prompt, systemInstruction = null) {
  const model = systemInstruction
    ? genAI.getGenerativeModel({ model: CHAT_MODEL_NAME, systemInstruction })
    : chatModel
  return withRetry(async () => {
    const result = await model.generateContent(prompt)
    return result.response.text()
  })
}

async function generateFromImage(prompt, imageBuffer, mimeType) {
  const model = genAI.getGenerativeModel({ model: CHAT_MODEL_NAME })
  return withRetry(async () => {
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType,
        },
      },
    ])
    return result.response.text()
  })
}

async function getEmbedding(text) {
  return withRetry(async () => {
    const result = await embeddingModel.embedContent(text)
    return result.embedding.values
  })
}

async function chat(history = [], message, systemInstruction = null) {
  const model = systemInstruction
    ? genAI.getGenerativeModel({ model: CHAT_MODEL_NAME, systemInstruction })
    : chatModel
  return withRetry(async () => {
    const session = model.startChat({ history })
    const result = await session.sendMessage(message)
    return result.response.text()
  })
}

module.exports = { generateText, generateFromImage, getEmbedding, chat, withRetry }
