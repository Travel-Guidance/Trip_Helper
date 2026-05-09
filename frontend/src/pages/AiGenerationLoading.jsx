import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/AiGenerationLoading.css'
import AiGenerationLoadingView from '../components/aitravel/AiGenerationLoadingView'
import { initAiGenerationLoading } from '../utils/AiGenerationLoading'

export default function AiGenerationLoading() {
  const navigate = useNavigate()

  useEffect(() => initAiGenerationLoading({ navigate }), [navigate])

  return <AiGenerationLoadingView />
}