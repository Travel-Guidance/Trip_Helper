import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/AiGenerationLoading.css'
import AiGenerationLoadingView from '../components/aitravel/AiGenerationLoadingView'
import { apiPost } from '../api/apiClient'

const BUDGET_MAP = { '알뜰': 'low', '보통': 'mid', '적정': 'mid', '프리미엄': 'high', '럭셔리': 'high' }
const DIFFICULTY_MAP = { '여유': 'relaxed', '여유롭게': 'relaxed', '보통': 'normal', '활동적': 'active', '빡빡': 'intense' }

function buildApiParams(trip) {
  const budgetKey = Object.keys(BUDGET_MAP).find(k => (trip.budget || '').includes(k)) || '보통'
  const difficultyKey = Object.keys(DIFFICULTY_MAP).find(k => String(trip.intensity || '').includes(k)) || '보통'

  return {
    country: trip.destination || trip.dest || '도쿄',
    nights: Number(trip.nights) || 3,
    budget: BUDGET_MAP[budgetKey] || 'mid',
    difficulty: DIFFICULTY_MAP[difficultyKey] || 'normal',
    styles: trip.styles || [],
    adults: Number(trip.adults) || 1,
    children: Number(trip.children) || 0,
    mustVisit: trip.places?.join(', ') || '',
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
  }
}

function readTrip() {
  try {
    const stored = sessionStorage.getItem('aiTripDraft')
    return stored ? JSON.parse(stored) : {}
  } catch {
    return {}
  }
}

export default function AiGenerationLoading() {
  const navigate = useNavigate()
  const calledRef = useRef(false)

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const trip = readTrip()
    const params = buildApiParams(trip)

    apiPost('/ai-travel/generate', params)
      .then(json => {
        if (json?.data) {
          sessionStorage.setItem('aiPlanResult', JSON.stringify({ planData: json.data, tripInfo: params }))
        }
        navigate('/ai-generation-schedule')
      })
      .catch(() => {
        navigate('/ai-generation-schedule')
      })
  }, [navigate])

  return <AiGenerationLoadingView />
}
