import { apiPost } from '../api/apiClient'

const PENDING_PLAN_SAVE_KEY = 'pendingPlanSaveAfterAuth'
const PLAN_RESULT_KEY = 'aiPlanResult'

export function markPendingPlanSaveAfterAuth() {
  const stored = sessionStorage.getItem(PLAN_RESULT_KEY)
  if (stored) sessionStorage.setItem(PENDING_PLAN_SAVE_KEY, '1')
}

export function hasPendingPlanSaveAfterAuth() {
  return sessionStorage.getItem(PENDING_PLAN_SAVE_KEY) === '1'
}

export function clearPendingPlanSaveAfterAuth() {
  sessionStorage.removeItem(PENDING_PLAN_SAVE_KEY)
}

export async function savePendingPlanAfterAuth() {
  if (!hasPendingPlanSaveAfterAuth()) return null

  const stored = sessionStorage.getItem(PLAN_RESULT_KEY)
  if (!stored) {
    clearPendingPlanSaveAfterAuth()
    return null
  }

  const result = JSON.parse(stored)
  if (result.planId) {
    clearPendingPlanSaveAfterAuth()
    return result
  }

  const saved = await apiPost('/ai-travel/plans', {
    planData: result.planData,
    tripInfo: result.tripInfo,
  })
  const nextResult = { ...result, planId: saved.planId || saved.plan?.id || null }

  sessionStorage.setItem(PLAN_RESULT_KEY, JSON.stringify(nextResult))
  clearPendingPlanSaveAfterAuth()
  return nextResult
}
