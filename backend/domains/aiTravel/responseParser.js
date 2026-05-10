'use strict';

function extractJsonObject(text) {
  const source = String(text || '').trim();

  // 마크다운 코드블록 제거
  const stripped = source.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();

  // { ... } 형태 탐색
  const match = stripped.match(/\{[\s\S]*\}/);
  if (!match) {
    console.error('[responseParser] JSON 없는 응답:', stripped.slice(0, 300));
    throw new Error('AI response did not contain a JSON object');
  }

  // 문자열 값 안의 실제 줄바꿈을 \n 이스케이프로 교체
  function sanitize(raw) {
    return raw.replace(/"((?:[^"\\]|\\.)*)"/gs, (_, inner) =>
      '"' + inner.replace(/\r?\n/g, '\\n') + '"'
    )
  }

  try {
    return JSON.parse(match[0]);
  } catch {
    try {
      return JSON.parse(sanitize(match[0]));
    } catch {
      // 끝부분이 잘린 경우 — 마지막 완전한 일차까지만 복구
      const partial = match[0].replace(/,\s*\{[^{}]*$/, '') + ']}';
      try {
        return JSON.parse(partial);
      } catch {
        try {
          return JSON.parse(sanitize(partial));
        } catch {
          console.error('[responseParser] JSON 파싱 실패:', match[0].slice(0, 300));
          throw new Error('AI response JSON was malformed');
        }
      }
    }
  }
}

module.exports = { extractJsonObject };
