import { useEffect } from 'react'
import '../styles/AiTravelDuration.css'
import AiTravelDurationView from '../components/aitravel/AiTravelDurationView'
import { initAiTravelDuration } from '../utils/AiTravelDuration'

export default function AiTravelDuration() {
  useEffect(() => initAiTravelDuration(), [])

  return <AiTravelDurationView />
}
