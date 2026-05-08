const { chat } = require('../services/geminiService');

const PERSONA_MAP = {
  '호주':       { name: 'Matey',    emoji: '🦘', greeting: "G'day! 호주 여행이라면 뭐든 물어봐~ No worries!" },
  '시드니':     { name: 'Matey',    emoji: '🦘', greeting: "G'day mate! 시드니에서 10년째 살고 있는 Matey야. 뭐든 물어봐!" },
  '멜버른':     { name: 'Matey',    emoji: '☕', greeting: "G'day! 멜버른 커피는 세계 최고야. 뭐가 궁금해?" },
  '골드코스트': { name: 'Matey',    emoji: '🏄', greeting: "No worries! 골드코스트 서퍼 Matey야~ 여행 꿀팁 알려줄게!" },
  '케언즈':     { name: 'Matey',    emoji: '🤿', greeting: "G'day! 그레이트 배리어 리프 전문 다이버 Matey야. 뭐든 물어봐!" },
  '울루루':     { name: 'Matey',    emoji: '🪨', greeting: "No worries! 레드센터 Matey야. 울루루 궁금한 거 다 알려줄게!" },
  '브리즈번':   { name: 'Matey',    emoji: '🐨', greeting: "G'day! 브리즈번 로컬 Matey야~ 코알라만큼 귀여운 도시야, 물어봐!" },
  '퍼스':       { name: 'Matey',    emoji: '🌅', greeting: "G'day! 세계에서 가장 외진 도시 퍼스 로컬이야. 뭐든 물어봐!" },
  '일본':       { name: 'Yuki',     emoji: '⛩️', greeting: '안녕하세요! 일본 현지 가이드 유키입니다. 무엇이든 물어보세요.' },
  '도쿄':       { name: 'Yuki',     emoji: '🗼', greeting: '안녕하세요! 도쿄 현지인 유키입니다. 뭐든 도움드릴게요!' },
  '프랑스':     { name: 'Sophie',   emoji: '🗼', greeting: 'Bonjour! 파리 현지인 Sophie예요. 뭐든 물어보세요~' },
  '이탈리아':   { name: 'Marco',    emoji: '🏛️', greeting: 'Ciao! 이탈리아 가이드 Marco입니다. 맛집·관광지 다 알아요!' },
  '스페인':     { name: 'Isabella', emoji: '💃', greeting: '¡Hola! 스페인 현지인 Isabella야. 플라멩코만큼 신나게 알려줄게!' },
  '태국':       { name: 'Nam',      emoji: '🌴', greeting: 'Sawasdee! 태국 현지 가이드 Nam이에요. 뭐든 물어보세요!' },
};

const DEFAULT_PERSONA = { name: 'Trip AI', emoji: '✈️', greeting: '안녕하세요! Trip Helper 여행 AI입니다. 여행에 대해 무엇이든 물어보세요!' };

const AUSTRALIA_DESTS = new Set(['호주','시드니','멜버른','골드코스트','케언즈','울루루','브리즈번','퍼스','애들레이드']);

function buildPersonaSystem(destination, ragContext) {
  const persona = PERSONA_MAP[destination] || DEFAULT_PERSONA;
  let personality = '';

  if (AUSTRALIA_DESTS.has(destination)) {
    personality = `당신은 ${destination || '호주'}에 사는 호주 현지인 친구 '${persona.name}'입니다.
"G'day!", "No worries~", "Heaps good!", "Reckon", "Arvo(afternoon)", "Brekky(breakfast)" 같은 호주식 표현을 자연스럽게 섞어 친근하게 답하세요.
호주 문화·음식·관광지·날씨·교통에 대한 구체적인 현지인 팁을 알려주세요.`;
  } else if (['일본','도쿄','오사카','교토'].includes(destination)) {
    personality = `당신은 ${destination}에 사는 일본 현지인 가이드 '${persona.name}'입니다.
정중하면서도 친절하게, 구체적인 장소·가격·교통편을 포함해 답하세요.`;
  } else if (destination) {
    personality = `당신은 ${destination} 여행 전문 현지 가이드 '${persona.name}'입니다.
친근하고 유익하게, 실용적인 팁과 함께 답하세요.`;
  } else {
    personality = `당신은 Trip Helper의 여행 전문 AI '${persona.name}'입니다.
세계 여행지에 대해 친근하고 실용적으로 답하세요.`;
  }

  return `${personality}

${ragContext ? `[여행 지식 베이스 — ${destination}]\n${ragContext}\n\n` : ''}모든 응답은 한국어로 하되, 현지 표현(영어·현지어)은 자연스럽게 섞어도 됩니다.
구체적인 장소명·가격·팁을 포함하고, 3~5문장으로 간결하게 답하세요.`;
}

async function generatePlan(req, res, next) {
  try {
    const ragService = require('../services/ragService');
    const plan = await ragService.generateTravelPlan(req.body);
    res.json({ success: true, data: plan });
  } catch (err) {
    next(err);
  }
}

async function chatbot(req, res, next) {
  try {
    const { message, history = [], destination = '' } = req.body;
    if (!message?.trim()) {
      return res.status(400).json({ error: '메시지를 입력해주세요.' });
    }

    let ragContext = '';
    if (destination) {
      try {
        const { retrieveContext } = require('../services/ragService');
        ragContext = await retrieveContext(`${destination} ${message}`, { dest: destination, limit: 3 });
      } catch { /* Qdrant 미연결 시 무시 */ }
    }

    const systemPrompt = buildPersonaSystem(destination, ragContext);
    const reply = await chat(history, message, systemPrompt);

    const persona = PERSONA_MAP[destination] || DEFAULT_PERSONA;
    res.json({ success: true, reply, persona: { name: persona.name, emoji: persona.emoji } });
  } catch (err) {
    next(err);
  }
}

module.exports = { generatePlan, chatbot };
