import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/AiGenerationSchedule.css'
import AiGenerationScheduleView from '../components/aitravel/AiGenerationScheduleView'
import { initAiGenerationSchedule } from '../utils/AiGenerationSchedule'

export default function AiGenerationSchedule() {
  const navigate = useNavigate()

  useEffect(() => initAiGenerationSchedule(), [])

  return (
    <AiGenerationScheduleView onTravelDurationClick={() => navigate('/ai-travel-duration')} />
  )
}
