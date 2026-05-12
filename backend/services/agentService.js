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
const {
  validateAustraliaItinerary,
  buildItineraryRepairPrompt,
} = require('./itineraryValidator');

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
      styles: normalized.styles,
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

const JSON_PROMPT = '지금까지 수집한 정보를 바탕으로 최종 여행 일정을 순수 JSON으로만 반환하세요. 마크다운, 설명 문장, 코드블록은 쓰지 마세요. 각 day에는 summary와 routeStrategy를 넣고, 각 item에는 duration, cost, reservation, transportTip, backup을 넣으세요.\n{"accommodations":[{"name":"숙소명","location":"위치","checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD","searchQuery":"검색어"}],"days":[{"label":"1일차","theme":"테마","summary":"오늘 일정 요약","routeStrategy":"동선 설계 이유","baseHotel":"숙소명","items":[{"time":"09:00","name":"장소명","note":"왜 이 장소를 배치했는지와 현장 팁","duration":"약 90분","cost":"무료 또는 예상 비용","reservation":"예약 여부","transportTip":"이전 장소에서 이동 팁","backup":"대체 장소","isMeal":false,"lat":-33.8568,"lng":151.2153}]}]}';

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

  let finalText = await resolveFinalText(chatSession, response);
  console.log('[agentService] finalText preview:', finalText.slice(0, 120));
  let plan = extractJsonObject(finalText);

  const routeCheck = validateAustraliaItinerary(plan, params);
  if (!routeCheck.valid) {
    console.warn('[agentService] itinerary route violations:', routeCheck.violations.map(v => v.message).join(' | '));
    const repairResponse = await safeSend(chatSession, buildItineraryRepairPrompt(plan, routeCheck.violations));
    finalText = await resolveFinalText(chatSession, repairResponse);
    console.log('[agentService] repaired finalText preview:', finalText.slice(0, 120));
    plan = extractJsonObject(finalText);
  }

  if (!Array.isArray(plan.days) || plan.days.length === 0) {
    throw new Error('AI가 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  const expectedDays = normalizePlanParams(params).days;
  const MAX_FILL_ATTEMPTS = 3;
  let fillAttempts = 0;
  while (plan.days.length < expectedDays && fillAttempts < MAX_FILL_ATTEMPTS) {
    fillAttempts++;
    const missingFrom = plan.days.length + 1;
    console.warn(`[agentService] days 부족: ${plan.days.length}/${expectedDays}일, ${missingFrom}일차부터 재요청 (시도 ${fillAttempts}/${MAX_FILL_ATTEMPTS})`);
    const missingPrompt = `일정이 ${plan.days.length}일차에서 끊겼습니다. ${missingFrom}일차부터 ${expectedDays}일차까지 나머지 days 배열만 {"days":[...]} 형식의 순수 JSON으로 출력하세요.`;
    try {
      const missingResponse = await safeSend(chatSession, missingPrompt);
      const missingText = await resolveFinalText(chatSession, missingResponse);
      const missingPlan = extractJsonObject(missingText);
      if (!Array.isArray(missingPlan.days) || missingPlan.days.length === 0) break;

      const existingLabels = new Set(plan.days.map(d => d.label));
      const newDays = missingPlan.days.filter(d => !existingLabels.has(d.label));
      if (newDays.length === 0) break;

      plan.days = [...plan.days, ...newDays];
      console.log(`[agentService] days 복구 중: ${plan.days.length}/${expectedDays}일`);
    } catch (e) {
      console.warn(`[agentService] days 복구 실패 (시도 ${fillAttempts}):`, e.message);
      break;
    }
  }
  if (plan.days.length < expectedDays) {
    console.warn(`[agentService] days 복구 완료 (부분): ${plan.days.length}/${expectedDays}일`);
  } else {
    console.log(`[agentService] days 복구 완료: ${plan.days.length}/${expectedDays}일`);
  }

  if (ragDebug) plan.ragDebug = ragDebug;
  return plan;
}

module.exports = { runAgent };
