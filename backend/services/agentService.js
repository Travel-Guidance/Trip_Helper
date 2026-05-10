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

async function getRagContext(params) {
  try {
    const { retrieveContext } = require('./ragService');
    const { resolveCoords } = require('../rag/geo');
    const normalized = normalizePlanParams(params);

    let lat = null;
    let lon = null;
    if (normalized.accommodations?.length > 0) {
      const coords = resolveCoords(normalized.accommodations[0].location);
      if (coords) { lat = coords.lat; lon = coords.lon; }
    }

    return retrieveContext(buildRagQuery(normalized), {
      dest: normalized.dest,
      budget: normalized.budget,
      lat,
      lon,
    });
  } catch {
    return '';
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

const JSON_PROMPT = '지금까지 수집한 정보를 바탕으로 최종 여행 일정을 아래 JSON 형식으로만 반환하세요. 마크다운, 설명 문장, 코드블록 없이 순수 JSON만 출력하세요.\n{"accommodations":[{"name":"숙소명","location":"위치","checkIn":"YYYY-MM-DD","checkOut":"YYYY-MM-DD","searchQuery":"검색어"}],"days":[{"label":"1일차","theme":"테마","baseHotel":"숙소명","items":[{"time":"09:00","name":"장소명","note":"설명","isMeal":false}]}]}';

async function resolveFinalText(chat, response) {
  const lastParts = response.response.candidates?.[0]?.content?.parts ?? [];
  const toolCallParts = lastParts.filter(part => part.functionCall);

  // 툴 호출 없이 텍스트로 끝난 경우
  if (!toolCallParts.length) {
    const text = response.response.text();
    if (text.includes('{')) return text;
    const retry = await chat.sendMessage(JSON_PROMPT);
    return retry.response.text();
  }

  // 툴 호출로 끝난 경우 — 더미 function response로 대화 프로토콜 정상 종료 후 JSON 요청
  // (tool call 상태에서 텍스트 메시지를 보내면 Gemini가 빈 JSON을 반환하는 문제 방지)
  const dummyResponses = toolCallParts.map(part => ({
    functionResponse: {
      name: part.functionCall.name,
      response: { content: JSON.stringify({ done: true, note: 'Sufficient data collected. Generate the final itinerary now.' }) },
    },
  }));
  const closedResponse = await chat.sendMessage(dummyResponses);
  const closedText = closedResponse.response.text();
  if (closedText.includes('{')) return closedText;

  const fallback = await chat.sendMessage(JSON_PROMPT);
  return fallback.response.text();
}

async function runAgent(params) {
  const ragContext = await getRagContext(params);
  const initialPrompt = buildInitialPrompt(params, ragContext);

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL_NAME,
    systemInstruction: AGENT_SYSTEM,
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  const chat = model.startChat({ history: [] });
  let response = await chat.sendMessage(initialPrompt);

  for (let iteration = 0; iteration < MAX_AGENT_ITERATIONS; iteration++) {
    const toolCalls = getToolCalls(response);
    if (!toolCalls.length) break;

    const toolResults = await executeToolCalls(toolCalls);
    response = await chat.sendMessage(toolResults);
  }

  const finalText = await resolveFinalText(chat, response);
  console.log('[agentService] finalText preview:', finalText.slice(0, 120));
  const plan = extractJsonObject(finalText);
  if (!Array.isArray(plan.days) || plan.days.length === 0) {
    throw new Error('AI가 일정을 생성하지 못했습니다. 잠시 후 다시 시도해주세요.');
  }
  return plan;
}

module.exports = { runAgent };
