import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/AiGenerationLoading.css'
import AiGenerationLoadingView from '../components/aitravel/AiGenerationLoadingView'
import { API_BASE } from '../api/config'
import { DEFAULT_TRIP, LOADING_MESSAGES } from '../data/AiGenerationLoading'

const DIFFICULTY_MAP = { '여유': 'relaxed', '여유롭게': 'relaxed', '보통': 'normal', '활동적': 'active', '빡빡': 'intense' }
const DRAFT_RESTORE_KEY = 'aiTripDraftRestore'

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
  const [serverMessage, setServerMessage] = useState('')
  const [messageIndex, setMessageIndex] = useState(0)
  const [isFinishing, setIsFinishing] = useState(false)
  const [error, setError] = useState('')
  const trip = useMemo(() => readTrip(), [])

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % LOADING_MESSAGES.length)
    }, 4000)
    return () => clearInterval(messageTimer)
  }, [])

  useEffect(() => {
    if (calledRef.current) return
    calledRef.current = true

    const params = buildApiParams(trip)
    sessionStorage.removeItem('aiPlanResult')

    const token = localStorage.getItem('tripHelperToken')
    const abortController = new AbortController()

    const startStreaming = async () => {
      try {
        const response = await fetch(`${API_BASE}/ai-travel/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(params),
          signal: abortController.signal,
        })

        if (!response.ok) {
          const errJson = await response.json().catch(() => ({}))
          throw new Error(errJson.error || '일정 생성 요청에 실패했습니다.')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6))
                
                if (json.error) {
                  setError(json.error)
                  break
                }

                if (json.progress !== undefined) {
                  setProgress(json.progress)
                }
                if (json.message) {
                  setServerMessage(json.message)
                }

                if (json.step === 'COMPLETED' && json.data) {
                  sessionStorage.setItem('aiPlanResult', JSON.stringify({ 
                    planData: json.data, 
                    tripInfo: params, 
                    planId: json.planId || null 
                  }))
                  setIsFinishing(true)
                  setProgress(100)
                  setTimeout(() => navigate('/ai-generation-schedule'), 650)
                }
              } catch (e) {
                console.warn('Failed to parse SSE line:', line, e)
              }
            }
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setError(err.message || '일정 생성 중 오류가 발생했습니다.')
        }
      }
    }

    startStreaming()
    return () => abortController.abort()
  }, [navigate, trip])

  const handleBackToForm = () => {
    sessionStorage.setItem(DRAFT_RESTORE_KEY, 'true')
    navigate('/ai-generation-inputform')
  }

  return (
    <AiGenerationLoadingView
      trip={trip}
      progress={progress}
      serverMessage={serverMessage}
      messageIndex={messageIndex}
      isFinishing={isFinishing}
      error={error}
      onRetry={() => window.location.reload()}
      onBack={handleBackToForm}
    />
  )
}
