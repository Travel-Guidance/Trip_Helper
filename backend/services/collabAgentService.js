'use strict';

// 공동작업 일정 생성 전용 에이전트 서비스 (agentService.js 와 독립적으로 운영)
const { genAI, CHAT_MODEL_NAME } = require('../config/gemini');
const { toolDefinitions } = require('./mcpTools');
const mcpClient = require('./mcpClient');
const {
  COLLAB_AGENT_SYSTEM,
  COLLAB_MAX_AGENT_ITERATIONS,
  COLLAB_JSON_PROMPT,
  buildCollabInitialPrompt,
  buildCollabRagRequests,
  normalizePlanParams,
} = require('../domains/aiTravel/collabPromptBuilder');
const { extractJsonObject } = require('../domains/aiTravel/responseParser');
const { withRetry } = require('./geminiService');
const { getWeatherForTrip } = require('./weatherService');
const {
  validateAustraliaItinerary,
  buildItineraryRepairPrompt,
} = require('./itineraryValidator');

const PRICE_RANGE_MAP = {
  low: 'low',
  mid: 'mid',
  high: 'high',
};

function compactText(text, maxLength = 260) {
  const normalized = String(text || '').replace(/\s+/g, ' ').trim();
  return normalized.length > maxLength
    ? `${normalized.slice(0, maxLength).trim()}...`
    : normalized;
}

function candidateKey(candidate) {
  return [
    candidate.name || '',
    candidate.city || '',
    candidate.summary || '',
  ].join('|').toLowerCase();
}

function formatCollabRagCandidates(candidates) {
  if (!candidates.length) return '';

  return `[호주 RAG 후보 장소]\n${JSON.stringify({
    instruction: '아래 후보는 참고용입니다. mustVisit만으로 일정을 채우지 말고, 여행 스타일·예산·날씨·동선 균형에 맞는 후보를 선별하세요.',
    candidates,
  }, null, 2)}`;
}

async function getCollabRagContext(params) {
  try {
    const { searchKnowledge } = require('../rag/retrieval');
    const { isAustraliaDestination, resolveCityFilter } = require('./ragService');
    const { resolveCoords } = require('../rag/geo');
    const normalized = normalizePlanParams(params);
    const requests = buildCollabRagRequests(normalized);

    let lat = null;
    let lon = null;
    if (normalized.accommodations?.length > 0) {
      const coords = resolveCoords(normalized.accommodations[0].location);
      if (coords) {
        lat = coords.lat;
        lon = coords.lon;
      }
    }

    const searchResults = await Promise.all(
      requests.map(async request => {
        if (request.dest && !isAustraliaDestination(request.dest)) {
          return { request, results: [], skipped: true };
        }

        const city = resolveCityFilter(request.dest);
        const results = await searchKnowledge(request.query, {
          city,
          priceRange: normalized.budget ? PRICE_RANGE_MAP[normalized.budget] : null,
          limit: request.label === 'base' ? 6 : 5,
          lat: request.label === 'base' ? lat : null,
          lon: request.label === 'base' ? lon : null,
        });

        return { request, city, results, skipped: false };
      })
    );

    const seen = new Set();
    const candidates = [];

    searchResults.forEach(group => {
      group.results.forEach(result => {
        const candidate = {
          source: group.request.label,
          name: result.title || null,
          city: result.city || null,
          category: result.category || null,
          priceRange: result.price_range || null,
          lat: result.lat,
          lng: result.lng,
          hours: result.hours || null,
          tags: Array.isArray(result.tags) ? result.tags.slice(0, 6) : [],
          score: Number(result.score?.toFixed?.(3) || result.score || 0),
          summary: compactText(result.text),
        };
        const key = candidateKey(candidate);
        if (seen.has(key)) return;
        seen.add(key);
        candidates.push(candidate);
      });
    });

    return {
      context: formatCollabRagCandidates(candidates.slice(0, 14)),
      meta: {
        enabled: true,
        reason: candidates.length ? 'hit' : 'miss',
        count: candidates.length,
        queries: searchResults.map(group => ({
          label: group.request.label,
          dest: group.request.dest,
          query: group.request.query,
          city: group.city || null,
          count: group.results.length,
          reason: group.skipped ? 'unsupported_destination' : (group.results.length ? 'hit' : 'miss'),
        })),
      },
    };
  } catch (err) {
    console.warn(`[공동일정 RAG] 조회 오류: ${err.message}`);
    return { context: '', meta: { enabled: false, reason: 'error', error: err.message } };
  }
}

function getToolCalls(response) {
  const parts = response.response.candidates?.[0]?.content?.parts ?? [];
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

function textOf(value) {
  return String(value || '').trim();
}

function parseDistanceKm(text) {
  const matches = [...textOf(text).matchAll(/(\d+(?:\.\d+)?)\s*km/gi)];
  if (!matches.length) return 0;
  return Math.max(...matches.map(match => Number(match[1]) || 0));
}

function parseTravelMinutes(text) {
  const source = textOf(text);
  const hourMinuteMatches = [...source.matchAll(/(\d+)\s*시간(?:\s*(\d+)\s*분)?/g)];
  const minuteMatches = [...source.matchAll(/(\d+)\s*분/g)];
  const values = [];

  hourMinuteMatches.forEach(match => {
    values.push((Number(match[1]) || 0) * 60 + (Number(match[2]) || 0));
  });
  minuteMatches.forEach(match => {
    values.push(Number(match[1]) || 0);
  });

  return values.length ? Math.max(...values) : 0;
}

function distanceKmBetween(a, b) {
  if (a?.lat == null || a?.lng == null || b?.lat == null || b?.lng == null) return 0;
  const toRad = value => Number(value) * Math.PI / 180;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLat = toRad(Number(b.lat) - Number(a.lat));
  const dLng = toRad(Number(b.lng) - Number(a.lng));
  const h = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function isLodgingBoundaryItem(item) {
  const name = textOf(item?.name);
  return /출발|복귀|체크인|체크아웃|도착/.test(name);
}

function sameHotelBoundary(day) {
  const items = Array.isArray(day?.items) ? day.items : [];
  if (items.length < 2) return false;

  const first = textOf(items[0]?.name);
  const last = textOf(items[items.length - 1]?.name);
  const baseHotel = textOf(day?.baseHotel);

  if (!baseHotel) return false;
  return first.includes(baseHotel) && last.includes(baseHotel) && /출발/.test(first) && /복귀/.test(last);
}

function validateLodgingFlow(plan) {
  const issues = [];
  const days = Array.isArray(plan?.days) ? plan.days : [];

  days.forEach((day, dayIndex) => {
    const items = Array.isArray(day.items) ? day.items : [];

    items.forEach((item, itemIndex) => {
      const name = textOf(item?.name);
      if (isLodgingBoundaryItem(item) && /^(숙소|호텔)\s*(출발|복귀|도착|체크인|체크아웃)$/.test(name)) {
        issues.push(`${day.label || `${dayIndex + 1}일차`} ${itemIndex + 1}번째 item이 실제 숙소명 없이 "${name}"로 되어 있습니다.`);
      }
      if (/시내 복귀|도심 휴식|마무리 휴식/.test(name)) {
        issues.push(`${day.label || `${dayIndex + 1}일차`}에 좌표가 불명확한 가짜 장소명 "${name}"이 있습니다.`);
      }
    });

    if (!sameHotelBoundary(day)) return;

    const hasLongDistanceItem = items.slice(1, -1).some(item => {
      const text = `${item?.name || ''} ${item?.note || ''}`;
      const hasTravelHint = /이동|거리|편도|왕복|drive|transfer/i.test(text);
      return parseDistanceKm(text) >= 100 || (hasTravelHint && parseTravelMinutes(text) >= 90);
    });

    if (hasLongDistanceItem) {
      issues.push(`${day.label || `${dayIndex + 1}일차`}가 편도 90분/100km 이상 장거리 일정인데 ${day.baseHotel} 출발 후 같은 숙소 복귀로 끝납니다. 도착 권역 숙소 체크인으로 바꿔야 합니다.`);
    }

    const jumps = items.slice(1).map((item, index) => ({
      from: items[index],
      to: item,
      km: distanceKmBetween(items[index], item),
    })).filter(jump => jump.km >= 350);

    jumps.forEach(jump => {
      const hasMoveLabel = /이동|비행|항공|기차|열차|렌터카|드라이브|transfer/i.test(`${jump.to?.name || ''} ${jump.to?.note || ''}`);
      if (!hasMoveLabel) {
        issues.push(`${day.label || `${dayIndex + 1}일차`}에 ${jump.from?.name || '이전 장소'} → ${jump.to?.name || '다음 장소'} 약 ${Math.round(jump.km)}km 초장거리 점프가 이동 항목 없이 배치되어 있습니다.`);
      }
    });
  });

  return issues;
}

async function revisePlanForLodgingFlow(chatSession, plan, issues) {
  const prompt = `아래 JSON 일정에는 숙소 흐름 오류가 있습니다.
문제:
${issues.map((issue, index) => `${index + 1}. ${issue}`).join('\n')}

수정 규칙:
- 편도 90분 또는 100km 이상 이동한 날은 출발 숙소로 복귀하지 말고, 이동한 권역의 새 숙소 체크인/도착으로 끝내세요.
- 하루 안에 350km 이상 떨어진 장소를 관광지처럼 연속 배치하지 마세요. 필요한 경우 비행/철도/렌터카 이동일로 만들고 도착지 숙소에서 마무리하세요.
- 다음날은 전날 체크인한 새 숙소에서 출발하세요.
- 모든 출발/복귀/체크인 item name에는 실제 숙소명을 넣으세요.
- "숙소 출발", "숙소 복귀", "시내 복귀 및 휴식" 같은 모호한 item은 제거하세요.
- accommodations, days[].baseHotel, items의 숙소 출발/도착 흐름이 서로 맞아야 합니다.

기존 JSON:
${JSON.stringify(plan)}

설명 없이 수정된 순수 JSON만 출력하세요.`;

  const response = await safeSend(chatSession, prompt);
  const revisedText = safeText(response);
  return extractJsonObject(revisedText);
}

function safeText(resp) {
  try {
    return resp.response.text() || '';
  } catch {
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
      console.warn('[collabAgentService] 최종 응답 생성 중단 사유:', finishReason);
    }
    const retry1 = await safeSend(chatSession, COLLAB_JSON_PROMPT);
    const retryText1 = safeText(retry1);
    if (retryText1.includes('{')) return retryText1;
    const retry2 = await safeSend(chatSession, COLLAB_JSON_PROMPT);
    return safeText(retry2);
  }

  const dummyResponses = toolCallParts.map(part => ({
    functionResponse: {
      name: part.functionCall.name,
      response: { content: JSON.stringify({ done: true, note: 'Sufficient data collected. Generate the final itinerary now.' }) },
    },
  }));
  const closedResponse = await safeSend(chatSession, dummyResponses);
  const closedText = safeText(closedResponse);
  if (closedText.includes('{')) return closedText;

  const fallback1 = await safeSend(chatSession, COLLAB_JSON_PROMPT);
  const fallbackText1 = safeText(fallback1);
  if (fallbackText1.includes('{')) return fallbackText1;

  const fallback2 = await safeSend(chatSession, COLLAB_JSON_PROMPT);
  return safeText(fallback2);
}

async function runCollabAgent(params) {
  const normalized = normalizePlanParams(params);

  const [ragResult, weatherSummary] = await Promise.all([
    getCollabRagContext(params),
    getWeatherForTrip(normalized.dest, params.startDate, params.endDate),
  ]);

  const ragContext = typeof ragResult === 'string' ? ragResult : ragResult.context;
  const ragDebug = typeof ragResult === 'string' ? null : ragResult.meta;
  const initialPrompt = buildCollabInitialPrompt(params, ragContext, weatherSummary);

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL_NAME,
    systemInstruction: COLLAB_AGENT_SYSTEM,
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  const chatSession = model.startChat({ history: [] });
  let response = await safeSend(chatSession, initialPrompt);

  for (let iteration = 0; iteration < COLLAB_MAX_AGENT_ITERATIONS; iteration++) {
    const toolCalls = getToolCalls(response);
    if (!toolCalls.length) break;

    const toolResults = await executeToolCalls(toolCalls);
    response = await safeSend(chatSession, toolResults);
  }

  let finalText = await resolveFinalText(chatSession, response);
  console.log('[collabAgentService] finalText preview:', finalText?.slice(0, 120));
  if (!finalText || !finalText.includes('{')) {
    throw new Error('AI가 공동 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }
  let plan = extractJsonObject(finalText);

  for (let repairAttempt = 1; repairAttempt <= 2; repairAttempt++) {
    const routeCheck = validateAustraliaItinerary(plan, params);
    if (routeCheck.valid) break;

    console.warn('[collabAgentService] 일정 동선 검증 위반:', routeCheck.violations.map(v => v.message).join(' | '));
    const repairResponse = await safeSend(chatSession, buildItineraryRepairPrompt(plan, routeCheck.violations));
    finalText = await resolveFinalText(chatSession, repairResponse);
    console.log(`[collabAgentService] repaired finalText preview (${repairAttempt}/2):`, finalText.slice(0, 120));
    plan = extractJsonObject(finalText);
  }


  if (!Array.isArray(plan.days) || plan.days.length === 0) {
    throw new Error('AI가 공동 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  const lodgingIssues = validateLodgingFlow(plan);
  if (lodgingIssues.length) {
    console.warn('[collabAgentService] 숙소 흐름 문제 감지, 수정 요청:', lodgingIssues);
    plan = await revisePlanForLodgingFlow(chatSession, plan, lodgingIssues);
    if (!Array.isArray(plan.days) || plan.days.length === 0) {
      throw new Error('AI가 공동 일정을 생성하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    }
  }

  if (ragDebug) plan.ragDebug = ragDebug;
  return plan;
}

module.exports = { runCollabAgent };
