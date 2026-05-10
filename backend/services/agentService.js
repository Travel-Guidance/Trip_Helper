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
    const normalized = normalizePlanParams(params);
    return retrieveContext(buildRagQuery(normalized), {
      dest: normalized.dest,
      budget: normalized.budget,
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

const JSON_PROMPT = '지금까지 수집한 정보를 바탕으로 최종 여행 일정을 아래 JSON 형식으로만 반환하세요. 마크다운, 설명 문장, 코드블록 없이 순수 JSON만 출력하세요.\n{"days":[{"label":"1일차","theme":"테마","items":[{"time":"09:00","name":"장소명","note":"설명","isMeal":false}]}]}';

async function resolveFinalText(chat, response) {
  const lastParts = response.response.candidates?.[0]?.content?.parts ?? [];
  const hasToolCall = lastParts.some(part => part.functionCall);

  // 툴 호출 없이 텍스트로 끝난 경우
  if (!hasToolCall) {
    const text = response.response.text();
    if (text.includes('{')) return text;
    // JSON 없으면 명시적으로 재요청
    const retry = await chat.sendMessage(JSON_PROMPT);
    return retry.response.text();
  }

  // 툴 호출로 끝난 경우 — JSON 명시 요청
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
  return extractJsonObject(finalText);
}

module.exports = { runAgent };
