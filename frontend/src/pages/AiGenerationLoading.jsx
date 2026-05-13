import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/AiGenerationLoading.css'
import AiGenerationLoadingView from '../components/aitravel/AiGenerationLoadingView'
import { apiPost } from '../api/apiClient'
import { DEFAULT_TRIP, LOADING_MESSAGES } from '../data/AiGenerationLoading'

const DIFFICULTY_MAP = { '여유': 'relaxed', '여유롭게': 'relaxed', '보통': 'normal', '활동적': 'active', '빡빡': 'intense' }

function parseIntensityScore(value) {
  const match = String(value || '').match(/(\d{1,3})\s*\/\s*100|^(\d{1,3})$/)
  if (!match) return null
  const score = Number(match[1] || match[2])
  return Number.isFinite(score) ? Math.min(100, Math.max(0, score)) : null
}

function difficultyFromIntensity(value) {
  const score = parseIntensityScore(value)
  if (score != null) {
    if (score <= 35) return 'relaxed'
    if (score <= 60) return 'normal'
    if (score <= 82) return 'active'
    return 'intense'
  }

  const difficultyKey = Object.keys(DIFFICULTY_MAP).find(k => String(value || '').includes(k)) || '보통'
  return DIFFICULTY_MAP[difficultyKey] || 'normal'
}

function buildApiParams(trip) {
  const intensityScore = parseIntensityScore(trip.intensity)

  return {
    country: trip.destination || trip.dest || '도쿄',
    nights: Number(trip.nights) || 3,
    budgetText: trip.budgetText || '',
    difficulty: difficultyFromIntensity(trip.intensity),
    intensityScore,
    styles: trip.styles || [],
    adults: Number(trip.adults) || 1,
    children: Number(trip.children) || 0,
    mustVisit: trip.places?.join(', ') || '',
    startDate: trip.startDate || '',
    endDate: trip.endDate || '',
    travelPreference: trip.travelPreference || '',
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
  const [error, setError] = useState('')
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
    sessionStorage.removeItem('aiPlanResult')

    apiPost('/ai-travel/generate', params)
      .then(json => {
        if (cancelled) return
        if (json?.data) {
          sessionStorage.setItem('aiPlanResult', JSON.stringify({ planData: json.data, tripInfo: params, planId: json.planId || null }))
        }
        setIsFinishing(true)
        setProgress(100)
        setTimeout(() => navigate('/ai-generation-schedule'), 650)
      })
      .catch(err => {
        if (cancelled) return
        setError(err.message || '일정 생성에 실패했습니다.')
        setProgress(prev => Math.min(prev, 98))
      })
    return () => { cancelled = true }
  }, [navigate, trip])

  return (
    <AiGenerationLoadingView
      trip={trip}
      progress={progress}
      messageIndex={messageIndex}
      isFinishing={isFinishing}
      error={error}
      onRetry={() => window.location.reload()}
      onBack={() => navigate('/ai-generation-inputform')}
    />
  )
}
