import { apiGet, apiDelete } from './apiClient'

export async function getMyBookings() {
  return apiGet('/bookings')
}

export async function getMyPlans() {
  return apiGet('/ai-travel/plans')
}

export async function getPlanDetail(planId) {
  return apiGet(`/ai-travel/plans/${planId}`)
}

export async function deletePlan(planId) {
  return apiDelete(`/ai-travel/plans/${planId}`)
}
