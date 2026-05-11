'use strict';

const { genAI, CHAT_MODEL_NAME } = require('../config/gemini');
const { toolDefinitions } = require('./mcpTools');
const mcpClient = require('./mcpClient');
const {
  AGENT_SYSTEM,
  MAX_AGENT_ITERATIONS,
  buildInitialPrompt,
  buildRagQuery,
  normalizePlanParams,
} = require('../domains/aiTravel/promptBuilder');
const { extractJsonObject } = require('../domains/aiTravel/responseParser');
const { withRetry } = require('./geminiService');

async function getRagContext(params) {
  try {
    const { retrieveContext } = require('./ragService');
    const { resolveCoords } = require('../rag/geo');
    const normalized = normalizePlanParams(params);

    let lat = null;
    let lon = null;
    if (normalized.accommodations?.length > 0) {
      const coords = resolveCoords(normalized.accommodations[0].location);
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
      }
    }

    return retrieveContext(buildRagQuery(normalized), {
      dest: normalized.dest,
      budget: normalized.budget,
      lat,
      lon,
      debug: true,
    });
  } catch (err) {
    console.warn(`[RAG] error: ${err.message}`);
    return {
      context: '',
      meta: {
        enabled: false,
        reason: 'error',
        error: err.message,
      },
    };
  }
}

function getToolCalls(response) {
  const candidate = response.response.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];
  return parts.filter(part => part.functionCall);
}

async function executeToolCalls(toolCalls) {
  return Promise.all(
    toolCalls.map(async part => {
      const { name, args } = part.functionCall;
      const result = await mcpClient.callTool(name, args);
      return {
        functionResponse: {
          name,
          response: { content: JSON.stringify(result) },
        },
      };
    })
  );
}

function safeSend(chatSession, message) {
  return withRetry(() => chatSession.sendMessage(message));
}

const JSON_PROMPT = '지금까지 수집한 정보를 바탕으로 최종 여행 일정을 순수 JSON으로만 반환하세요. 마크다운, 설명 문장, 코드블록은 쓰지 마세요.\n{"accommodations":[{"name":"숙소명","location":"위치","checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD","searchQuery":"검색어"}],"days":[{"label":"1일차","theme":"테마","baseHotel":"숙소명","items":[{"time":"09:00","name":"장소명","note":"설명","isMeal":false,"lat":-33.8568,"lng":151.2153}]}]}';

async function resolveFinalText(chatSession, response) {
  const lastParts = response.response.candidates?.[0]?.content?.parts ?? [];
  const toolCallParts = lastParts.filter(part => part.functionCall);

  if (!toolCallParts.length) {
    const text = response.response.text();
    if (text.includes('{')) return text;
    const retry = await safeSend(chatSession, JSON_PROMPT);
    return retry.response.text();
  }

  const dummyResponses = toolCallParts.map(part => ({
    functionResponse: {
      name: part.functionCall.name,
      response: { content: JSON.stringify({ done: true, note: 'Sufficient data collected. Generate the final itinerary now.' }) },
    },
  }));
  const closedResponse = await safeSend(chatSession, dummyResponses);
  const closedText = closedResponse.response.text();
  if (closedText.includes('{')) return closedText;

  const fallback = await safeSend(chatSession, JSON_PROMPT);
  return fallback.response.text();
}

async function runAgent(params) {
  const ragResult = await getRagContext(params);
  const ragContext = typeof ragResult === 'string' ? ragResult : ragResult.context;
  const ragDebug = typeof ragResult === 'string' ? null : ragResult.meta;
  const initialPrompt = buildInitialPrompt(params, ragContext);

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL_NAME,
    systemInstruction: AGENT_SYSTEM,
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  const chatSession = model.startChat({ history: [] });
  let response = await safeSend(chatSession, initialPrompt);

  for (let iteration = 0; iteration < MAX_AGENT_ITERATIONS; iteration++) {
    const toolCalls = getToolCalls(response);
    if (!toolCalls.length) break;

    const toolResults = await executeToolCalls(toolCalls);
    response = await safeSend(chatSession, toolResults);
  }

  const finalText = await resolveFinalText(chatSession, response);
  console.log('[agentService] finalText preview:', finalText.slice(0, 120));
  const plan = extractJsonObject(finalText);
  if (!Array.isArray(plan.days) || plan.days.length === 0) {
    throw new Error('AI가 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  if (ragDebug) plan.ragDebug = ragDebug;
  return plan;
}

module.exports = { runAgent };
