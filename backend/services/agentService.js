const { genAI, CHAT_MODEL_NAME } = require('../config/gemini');
const { toolDefinitions, executeTool } = require('./mcpTools');

const MAX_ITERATIONS = 6;

const AGENT_SYSTEM = `당신은 전문 여행 플래너 AI 에이전트입니다.
주어진 도구들을 활용하여 사용자의 여행 조건에 맞는 최적의 일정을 생성합니다.

도구 사용 전략:
1. searchKnowledgeBase: 목적지의 장소·음식·액티비티 기본 정보 수집
2. searchRecentInfo: 최신 가격·영업 여부·이벤트 확인
3. calculateRoute: 일정 내 장소 간 이동 시간 계산하여 동선 최적화

최종 일정은 반드시 아래 JSON 형식으로만 반환하세요. 마크다운 코드블록 없이 JSON만 출력:
{
  "days": [
    {
      "label": "1일차",
      "theme": "일차 테마 한 줄 설명",
      "items": [
        { "time": "09:00", "name": "장소명", "note": "상세 설명·팁·예상 비용", "isMeal": false }
      ]
    }
  ]
}`;

async function runAgent(params) {
  const { continent, country, nights, budget, styles = [], difficulty, adults, children = 0, mustVisit } = params;
  const dest = country || continent || '목적지';
  const days = nights + 1;

  const budgetLabel = {
    low:  '알뜰 (1인 하루 10만원 이하)',
    mid:  '적정 (1인 하루 30만원대)',
    high: '프리미엄 (1인 하루 50만원 이상)',
  }[budget] || budget;

  const diffLabel = {
    relaxed: '여유롭게',
    normal:  '보통',
    active:  '알차게',
    intense: '빡빡하게',
  }[difficulty] || difficulty;

  // RAG로 베이스 컨텍스트 먼저 수집 (순환 의존성 방지용 lazy require)
  let ragContext = '';
  try {
    const { retrieveContext } = require('./ragService');
    ragContext = await retrieveContext(
      `${dest} 여행 ${styles.join(' ')}`,
      { dest, budget },
    );
  } catch { /* Qdrant 미연결 시 무시 */ }

  const initialPrompt = `
${ragContext ? `[여행 지식 베이스]\n${ragContext}\n\n` : ''}[여행 요청]
- 목적지: ${dest}
- 기간: ${nights}박 ${days}일
- 예산: ${budgetLabel}
- 여행 스타일: ${styles.join(', ') || '자유'}
- 여행 강도: ${diffLabel}
- 인원: 성인 ${adults}명${children > 0 ? `, 어린이 ${children}명` : ''}
${mustVisit ? `- 꼭 방문할 곳: ${mustVisit}` : ''}

도구를 활용하여 ${days}일 여행 일정을 만들어주세요.
각 일차마다 5~7개 항목을 포함하고, 이동 동선을 최적화하세요.`;

  const model = genAI.getGenerativeModel({
    model: CHAT_MODEL_NAME,
    systemInstruction: AGENT_SYSTEM,
    tools: [{ functionDeclarations: toolDefinitions }],
  });

  const chat = model.startChat({ history: [] });

  let response = await chat.sendMessage(initialPrompt);
  let iterations = 0;

  // ReAct 루프: 도구 호출이 있는 동안 반복
  while (iterations < MAX_ITERATIONS) {
    iterations++;
    const candidate = response.response.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    const toolCalls = parts.filter(p => p.functionCall);

    if (toolCalls.length === 0) break; // 도구 호출 없으면 최종 응답

    // 도구 병렬 실행
    const toolResults = await Promise.all(
      toolCalls.map(async part => {
        const { name, args } = part.functionCall;
        const result = await executeTool(name, args);
        return {
          functionResponse: {
            name,
            response: { content: JSON.stringify(result) },
          },
        };
      })
    );

    response = await chat.sendMessage(toolResults);
  }

  // 최종 텍스트 추출
  const finalText = response.response.text();

  const jsonMatch = finalText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('AI 응답에서 JSON을 찾을 수 없습니다');

  return JSON.parse(jsonMatch[0]);
}

module.exports = { runAgent };
