'use strict';

function extractJsonObject(text) {
  const source = String(text || '').trim();

  // 마크다운 코드블록 제거
  const stripped = source.replace(/```(?:json)?\s*([\s\S]*?)```/g, '$1').trim();

  const rawJson = findBalancedJsonObject(stripped);
  if (!rawJson) {
    console.error('[responseParser] JSON 없는 응답:', stripped.slice(0, 300));
    throw new Error('AI response did not contain a JSON object');
  }

  // 문자열 값 안의 실제 줄바꿈을 \n 이스케이프로 교체
  function sanitize(raw) {
    return raw.replace(/"((?:[^"\\]|\\.)*)"/gs, (_, inner) =>
      '"' + inner.replace(/\r?\n/g, '\\n') + '"'
    )
  }

  function normalize(raw) {
    return raw
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/\u0000/g, '');
  }

  try {
    return JSON.parse(rawJson);
  } catch {
    try {
      return JSON.parse(sanitize(normalize(rawJson)));
    } catch {
      // 끝부분이 잘린 경우 — 마지막 완전한 일차까지만 복구
      const partial = rawJson.replace(/,\s*\{[^{}]*$/, '') + ']}';
      try {
        return JSON.parse(normalize(partial));
      } catch {
        try {
          return JSON.parse(sanitize(normalize(partial)));
        } catch {
          console.error('[responseParser] JSON 파싱 실패:', rawJson.slice(0, 300));
          throw new Error('AI response JSON was malformed');
        }
      }
    }
  }
}

function findBalancedJsonObject(text) {
  const source = String(text || '');
  let start = -1;
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = 0; i < source.length; i++) {
    const ch = source[i];

    if (start < 0) {
      if (ch === '{') {
        start = i;
        depth = 1;
      }
      continue;
    }

    if (escape) {
      escape = false;
      continue;
    }
    if (ch === '\\') {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth === 0) return source.slice(start, i + 1);
  }

  return start >= 0 ? source.slice(start) : null;
}

module.exports = { extractJsonObject };
