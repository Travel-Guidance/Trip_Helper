import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PLAN } from '../data/AiGenerationSchedule'
import AiGenerationScheduleView from '../components/aitravel/AiGenerationScheduleView'
import TravelChatDrawer from '../components/aitravel/TravelChatDrawer'
import { getPlanDetail } from '../api/bookingApi'

const DEMO_PLAN = {
  days: PLAN.map((day, i) => ({
    label: `${i + 1}일차`,
    theme: day.title,
    items: day.nodes.map(node => ({
      time: node.time,
      name: node.title,
      note: node.body,
      isMeal: node.kind === 'meal',
      lat: node.lat,
      lng: node.lng,
    })),
  })),
}

const DEMO_INFO = {
  country: '후쿠오카',
  nights: PLAN.length - 1,
  styles: ['맛집 탐방', '산책'],
  adults: 2,
  children: 0,
}

function readResult() {
  try {
    const stored = sessionStorage.getItem('aiPlanResult')
    if (!stored) return null
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export default function AiGenerationSchedule() {
  const navigate = useNavigate()
  const location = useLocation()
  const planId = location.state?.planId
  const result = readResult()
  const [savedResult, setSavedResult] = useState(null)
  const [loading, setLoading] = useState(Boolean(planId))
  const [error, setError] = useState('')

  useEffect(() => {
    if (!planId) return

    let cancelled = false
    setLoading(true)
    setError('')

    getPlanDetail(planId)
      .then(plan => {
        if (cancelled) return
        const nextResult = {
          planData: plan.plan_data,
          tripInfo: {
            country: plan.destination || result?.tripInfo?.country || '',
            nights: Number(plan.nights) || 0,
            budget: plan.budget || '',
          },
        }
        setSavedResult(nextResult)
        sessionStorage.setItem('aiPlanResult', JSON.stringify(nextResult))
      })
      .catch(err => {
        if (!cancelled) setError(err.message || '저장된 일정을 불러오지 못했습니다.')
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [planId])

  const displayResult = savedResult ?? result
  const planData = displayResult?.planData ?? DEMO_PLAN
  const tripInfo = displayResult?.tripInfo
    ? { ...displayResult.tripInfo, nights: Number(displayResult.tripInfo.nights) }
    : DEMO_INFO

  function handleReset() {
    sessionStorage.removeItem('aiPlanResult')
    navigate('/ai-generation-inputform')
  }

  function handleTravelDuration() {
    sessionStorage.setItem('aiPlanResult', JSON.stringify({ planData, tripInfo }))
    navigate('/ai-travel-duration')
  }

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>일정을 불러오는 중...</div>
  }

  if (error) {
    return <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>{error}</div>
  }

  return (
    <>
      <AiGenerationScheduleView
        planData={planData}
        tripInfo={tripInfo}
        onReset={handleReset}
        onTravelDurationClick={handleTravelDuration}
      />
      <TravelChatDrawer destination={tripInfo.country || tripInfo.continent || ''} />
    </>
  )
}
