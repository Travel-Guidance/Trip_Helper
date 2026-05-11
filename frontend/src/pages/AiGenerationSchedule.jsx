import { useNavigate } from 'react-router-dom'
import { PLAN } from '../data/AiGenerationSchedule'
import AiGenerationScheduleView from '../components/aitravel/AiGenerationScheduleView'
import TravelChatDrawer from '../components/aitravel/TravelChatDrawer'

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
  const result = readResult()

  const planData = result?.planData ?? DEMO_PLAN
  const tripInfo = result?.tripInfo
    ? { ...result.tripInfo, nights: Number(result.tripInfo.nights) }
    : DEMO_INFO

  function handleReset() {
    sessionStorage.removeItem('aiPlanResult')
    navigate('/ai-generation-inputform')
  }

  function handleTravelDuration() {
    sessionStorage.setItem('aiPlanResult', JSON.stringify({ planData, tripInfo }))
    navigate('/ai-travel-duration')
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
