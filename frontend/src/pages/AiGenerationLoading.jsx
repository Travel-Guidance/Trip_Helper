import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/AiGenerationLoading.css'
import AiGenerationLoadingView from '../components/aitravel/AiGenerationLoadingView'
import { apiPost } from '../api/apiClient'
import { DEFAULT_TRIP, LOADING_MESSAGES } from '../data/AiGenerationLoading'

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
    return stored ? { ...DEFAULT_TRIP, ...JSON.parse(stored) } : DEFAULT_TRIP
  } catch {
    return DEFAULT_TRIP
  }
}

export default function AiGenerationLoading() {
  const navigate = useNavigate()
  const calledRef = useRef(false)
  const [progress, setProgress] = useState(6)
  const [messageIndex, setMessageIndex] = useState(0)
  const [isFinishing, setIsFinishing] = useState(false)
  const trip = useMemo(() => readTrip(), [])

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 4000)

    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) return 98
        const step = prev < 72 ? 7 : prev < 90 ? 3.5 : 1
        return Math.min(98, prev + step + Math.random() * 3)
      })
    }, 950)

    return () => {
      clearInterval(messageTimer)
      clearInterval(progressTimer)
    }
  }, [])

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const params = buildApiParams(trip)
    let cancelled = false

    apiPost('/ai-travel/generate', params)
      .then(json => {
        if (cancelled) return
        if (json?.data) {
          sessionStorage.setItem('aiPlanResult', JSON.stringify({ planData: json.data, tripInfo: params }))
        }
        setIsFinishing(true)
        setProgress(100)
        setTimeout(() => navigate('/ai-generation-schedule'), 650)
      })
      .catch(() => {
        if (cancelled) return
        setIsFinishing(true)
        setProgress(100)
        setTimeout(() => navigate('/ai-generation-schedule'), 650)
      })
    return () => { cancelled = true }
  }, [navigate, trip])

  return (
    <AiGenerationLoadingView
      trip={trip}
      progress={progress}
      messageIndex={messageIndex}
      isFinishing={isFinishing}
    />
  )
}
