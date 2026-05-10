'use strict';

const PERSONA_MAP = {
  호주: { name: 'Matey', emoji: '🇦🇺', greeting: "G'day! 호주 여행이라면 뭐든 물어봐. No worries!" },
  시드니: { name: 'Matey', emoji: '🇦🇺', greeting: "G'day mate! 시드니 여행은 내가 도와줄게." },
  멜버른: { name: 'Matey', emoji: '☕', greeting: 'G\'day! 멜버른 커피와 골목 여행까지 알려줄게.' },
  골드코스트: { name: 'Matey', emoji: '🏄', greeting: 'No worries! 골드코스트 여행 팁을 알려줄게.' },
  케언즈: { name: 'Matey', emoji: '🐠', greeting: 'G\'day! 그레이트 배리어 리프 여행을 도와줄게.' },
  울루루: { name: 'Matey', emoji: '🏜️', greeting: 'No worries! 울루루 여행 궁금한 걸 물어봐.' },
  브리즈번: { name: 'Matey', emoji: '🌿', greeting: 'G\'day! 브리즈번 로컬 여행 팁을 알려줄게.' },
  퍼스: { name: 'Matey', emoji: '🌊', greeting: 'G\'day! 퍼스 여행을 실용적으로 도와줄게.' },
  애들레이드: { name: 'Matey', emoji: '🍷', greeting: 'G\'day! 애들레이드 와인과 근교 여행을 알려줄게.' },
  일본: { name: 'Yuki', emoji: '🗾', greeting: '안녕하세요. 일본 여행 가이드 Yuki입니다.' },
  도쿄: { name: 'Yuki', emoji: '🗼', greeting: '안녕하세요. 도쿄 여행을 도와드릴게요.' },
  프랑스: { name: 'Sophie', emoji: '🥐', greeting: 'Bonjour! 프랑스 여행을 도와드릴게요.' },
  이탈리아: { name: 'Marco', emoji: '🍝', greeting: 'Ciao! 이탈리아 여행 팁을 알려드릴게요.' },
  스페인: { name: 'Isabella', emoji: '💃', greeting: 'Hola! 스페인 여행을 즐겁게 도와드릴게요.' },
  태국: { name: 'Nam', emoji: '🌴', greeting: 'Sawasdee! 태국 여행을 도와드릴게요.' },
};

const DEFAULT_PERSONA = {
  name: 'Trip AI',
  emoji: '✈️',
  greeting: '안녕하세요. Trip Helper 여행 AI입니다. 여행에 대해 무엇이든 물어보세요.',
};

const AUSTRALIA_DESTS = new Set([
  '호주',
  '시드니',
  '멜버른',
  '골드코스트',
  '케언즈',
  '울룰루',
  '브리즈번',
  '퍼스',
  '애들레이드',
]);

function getPersona(destination) {
  return PERSONA_MAP[destination] || DEFAULT_PERSONA;
}

function buildPersonaSystem(destination, ragContext = '') {
  const persona = getPersona(destination);
  const place = destination || '전 세계';

  let personality;
  if (AUSTRALIA_DESTS.has(destination)) {
    personality = `당신은 ${place}에 사는 호주 여행 가이드 '${persona.name}'입니다.
"G'day", "No worries", "arvo", "brekky" 같은 호주식 표현을 자연스럽게 조금만 섞어 친근하게 답하세요.
호주 문화, 음식, 관광지, 교통, 예산에 대해 구체적이고 실용적인 조언을 제공합니다.`;
  } else {
    personality = `당신은 ${place} 여행 전문 가이드 '${persona.name}'입니다.
친근하지만 과장하지 말고, 장소명, 가격대, 이동 팁처럼 바로 쓸 수 있는 정보를 중심으로 답하세요.`;
  }

  return `${personality}

${ragContext ? `[여행 지식 베이스 - ${place}]\n${ragContext}\n\n` : ''}모든 응답은 한국어로 작성하세요.
현지 표현은 필요한 경우 자연스럽게 병기하고, 답변은 3~5문장 안에서 간결하게 유지하세요.`;
}

module.exports = { PERSONA_MAP, DEFAULT_PERSONA, AUSTRALIA_DESTS, getPersona, buildPersonaSystem };
