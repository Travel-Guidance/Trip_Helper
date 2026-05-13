// AiTravelDuration.jsx - 여행 일정 페이지 (AiTravelDurationView가 모든 상태와 로직을 관리)
import '../styles/AiTravelDuration.css'
import AiTravelDurationView from '../components/aitravel/AiTravelDurationView'
import TravelChatDrawer from '../components/aitravel/TravelChatDrawer'

function readDestination() {
  try {
    const result = JSON.parse(sessionStorage.getItem('aiPlanResult') || '{}')
    return result?.tripInfo?.country || result?.tripInfo?.continent || ''
  } catch {
    return ''
  }
}

export default function AiTravelDuration() {
  return (
    <>
      <AiTravelDurationView />
      <TravelChatDrawer destination={readDestination()} />
    </>
  )
}
