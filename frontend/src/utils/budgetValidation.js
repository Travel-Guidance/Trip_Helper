// 여행 예산 입력값 유효성 검사 유틸리티

// 만원 단위 앞 숫자 최대 자릿수: 9999만원(4자리)까지 정상으로 간주
const MAN_DIGIT_LIMIT = 4
// 억 단위 최대값
const EOK_MAX = 9

function extractManVal(text) {
  const m = text.replace(/,/g, '').match(/(\d+)\s*만원?/)
  return m ? parseInt(m[1], 10) : null
}

function extractEokVal(text) {
  const m = text.replace(/,/g, '').match(/(\d+)\s*억/)
  return m ? parseInt(m[1], 10) : null
}

function suggestMan(manVal) {
  const suggested = Math.round(manVal / 10000)
  if (suggested <= 0) return null
  if (suggested < 10000) return `${suggested.toLocaleString('ko-KR')}만원`
  return `${Math.round(suggested / 10000)}억원`
}

/**
 * 예산 텍스트 입력값을 검증합니다.
 *
 * 탐지 규칙
 * - 만원 앞 숫자가 5자리 이상(≥10000): 원 단위 금액을 그대로 붙인 실수
 *   예) 10000000만원 → 실제로 1000만원을 의도했을 가능성이 높음
 * - 억 단위가 9억 초과: 여행 예산 범위 초과
 *
 * @param {string} text
 * @returns {{ valid: boolean, message: string }}
 */
export function validateBudget(text) {
  const trimmed = text.trim()
  if (!trimmed) return { valid: false, message: '' }

  const cleaned = trimmed.replace(/,/g, '')

  const manVal = extractManVal(cleaned)
  if (manVal !== null && String(manVal).length > MAN_DIGIT_LIMIT) {
    const suggestion = suggestMan(manVal)
    const hint = suggestion ? ` 혹시 ${suggestion} 이신가요?` : ''
    return {
      valid: false,
      message: `${manVal.toLocaleString('ko-KR')}만원은 입력 오류일 수 있습니다.${hint}`,
    }
  }

  const eokVal = extractEokVal(cleaned)
  if (eokVal !== null && eokVal > EOK_MAX) {
    return {
      valid: false,
      message: `${eokVal}억원은 여행 예산 범위를 초과합니다. (최대 ${EOK_MAX}억원)`,
    }
  }

  return { valid: true, message: '' }
}
