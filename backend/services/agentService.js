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
    console.warn(`[RAG] 조회 오류: ${err.message}`);
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

function safeText(resp) {
  try {
    return resp.response.text() || '';
  } catch (e) {
    const reason = resp?.response?.candidates?.[0]?.finishReason;
    const safety = resp?.response?.candidates?.[0]?.safetyRatings;
    console.warn('[agentService] safeText 실패:', e.message, '| finishReason:', reason, '| safetyRatings:', JSON.stringify(safety));
    return '';
  }
}

async function resolveFinalText(chatSession, response) {
  const lastParts = response.response.candidates?.[0]?.content?.parts ?? [];
  const toolCallParts = lastParts.filter(part => part.functionCall);
  const finishReason = response.response.candidates?.[0]?.finishReason;

  if (!toolCallParts.length) {
    const text = safeText(response);
    if (text.includes('{')) return text;
    if (finishReason && finishReason !== 'STOP') {
      console.warn('[agentService] 최종 응답 생성 중단 사유:', finishReason);
    }
    const retry1 = await safeSend(chatSession, JSON_PROMPT);
    const retryText1 = safeText(retry1);
    if (retryText1.includes('{')) return retryText1;
    const retry2 = await safeSend(chatSession, JSON_PROMPT);
    return safeText(retry2);
  }

  const dummyResponses = toolCallParts.map(part => ({
    functionResponse: {
      name: part.functionCall.name,
      response: { content: JSON.stringify({ done: true, note: 'Sufficient data collected. Output the final itinerary as pure JSON now.' }) },
    },
  }));
  const closedResponse = await safeSend(chatSession, dummyResponses);
  const closedText = safeText(closedResponse);
  if (closedText.includes('{')) return closedText;

  const fallback1 = await safeSend(chatSession, JSON_PROMPT);
  const fallbackText1 = safeText(fallback1);
  if (fallbackText1.includes('{')) return fallbackText1;

  const fallback2 = await safeSend(chatSession, JSON_PROMPT);
  return safeText(fallback2);
}

async function runAgent(params, onProgress = () => {}) {
  onProgress({ step: 'RAG', progress: 15, message: '현지 여행 정보 검색 중...' });
  const ragResult = await getRagContext(params);
  const ragContext = typeof ragResult === 'string' ? ragResult : ragResult.context;
  const ragDebug = typeof ragResult === 'string' ? null : ragResult.meta;
  const initialPrompt = buildInitialPrompt(params, ragContext);

  onProgress({ step: 'AI_START', progress: 35, message: 'AI 일정 설계 시작...' });
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

    onProgress({ step: 'TOOL_CALL', progress: 35 + (iteration + 1) * 10, message: '세부 정보 확인 및 동선 최적화 중...' });
    const toolResults = await executeToolCalls(toolCalls);
    response = await safeSend(chatSession, toolResults);
  }

  onProgress({ step: 'FINALIZING', progress: 75, message: '상세 일정 정리 및 완성 중...' });
  let finalText = await resolveFinalText(chatSession, response);
  console.log('[agentService] finalText preview:', finalText?.slice(0, 120));
  if (!finalText || !finalText.includes('{')) {
    throw new Error('AI가 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  let plan = extractJsonObject(finalText);

  onProgress({ step: 'VALIDATION', progress: 90, message: '최종 동선 및 제약 사항 검증 중...' });
  for (let repairAttempt = 1; repairAttempt <= 2; repairAttempt++) {
    const routeCheck = validateAustraliaItinerary(plan, params);
    if (routeCheck.valid) break;

    console.warn('[agentService] 일정 동선 검증 위반:', routeCheck.violations.map(v => v.message).join(' | '));
    const repairResponse = await safeSend(chatSession, buildItineraryRepairPrompt(plan, routeCheck.violations));
    finalText = await resolveFinalText(chatSession, repairResponse);
    console.log(`[agentService] repaired finalText preview (${repairAttempt}/2):`, finalText.slice(0, 120));
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
    console.warn(`[agentService] 일정 일수 부족: ${plan.days.length}/${expectedDays}일, ${missingFrom}일차부터 재요청 (시도 ${fillAttempts}/${MAX_FILL_ATTEMPTS})`);
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
      console.warn(`[agentService] 일정 일수 복구 실패 (시도 ${fillAttempts}):`, e.message);
      break;
    }
  }
  if (plan.days.length < expectedDays) {
    console.warn(`[agentService] 일정 일수 복구 완료 (부분): ${plan.days.length}/${expectedDays}일`);
  } else {
    console.log(`[agentService] days 복구 완료: ${plan.days.length}/${expectedDays}일`);
  }

  if (ragDebug) plan.ragDebug = ragDebug;
  return plan;
}

module.exports = { runAgent };
