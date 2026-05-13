// 공동작업 일정 생성 전용 로딩 페이지
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../styles/AiGenerationLoading.css'
import AiGenerationLoadingView from '../components/aitravel/AiGenerationLoadingView'
import { apiPost } from '../api/apiClient'
import { LOADING_MESSAGES } from '../data/AiGenerationLoading'

const DEFAULT_COLLAB_TRIP = {
  destination: '목적지',
  nights: 3,
  budget: 'mid',
  styles: [],
  intensity: '50/100 평균',
  places: [],
  adults: 2,
  children: 0,
  startDate: '',
  endDate: '',
  isCollab: true,
}

function readCollabParams() {
  try {
    const stored = sessionStorage.getItem('aiCollabParams')
    if (stored) {
      sessionStorage.removeItem('aiCollabParams')
      return { ...DEFAULT_COLLAB_TRIP, ...JSON.parse(stored) }
    }
    return DEFAULT_COLLAB_TRIP
  } catch {
    return DEFAULT_COLLAB_TRIP
  }
}

function readSessionFlag(key) {
  return sessionStorage.getItem(key) === 'true'
}

function collaborationWsUrl(roomId, memberCount) {
  const configured = import.meta.env.VITE_WS_BASE || import.meta.env.VITE_API_BASE
  if (configured) {
    return `${configured.replace(/^http/, 'ws').replace(/\/$/, '')}/ws/collaboration?roomId=${encodeURIComponent(roomId)}&members=${memberCount}`
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.hostname}:3001/ws/collaboration?roomId=${encodeURIComponent(roomId)}&members=${memberCount}`
}

function sendWhenOpen(socket, payload) {
  if (!socket) return
  const message = JSON.stringify(payload)
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(message)
    return
  }
  socket.addEventListener('open', () => socket.send(message), { once: true })
}

export default function AiCollabLoading() {
  const navigate = useNavigate()
  const calledRef = useRef(false)
  const socketRef = useRef(null)
  const [progress, setProgress] = useState(6)
  const [messageIndex, setMessageIndex] = useState(0)
  const [isFinishing, setIsFinishing] = useState(false)
  const params = useMemo(() => readCollabParams(), [])
  const roomId = useMemo(() => sessionStorage.getItem('aiCollabRoomId') || '', [])
  const memberCount = useMemo(() => Number(sessionStorage.getItem('aiCollabMemberCount') || 2), [])
  const isHost = useMemo(() => readSessionFlag('aiCollabIsHost'), [])

  useEffect(() => {
    if (!roomId) return undefined

    const socket = new WebSocket(collaborationWsUrl(roomId, memberCount))
    socketRef.current = socket

    socket.addEventListener('message', event => {
      let message
      try {
        message = JSON.parse(event.data)
      } catch {
        return
      }

      const planData = message.planData || message.generatedPlan
      const tripInfo = message.params || message.generatedParams || params
      const planId = message.planId || null
      if ((message.type === 'plan_generated' || message.type === 'room_state') && planData) {
        sessionStorage.setItem('aiPlanResult', JSON.stringify({ planData, tripInfo, planId }))
        setIsFinishing(true)
        setProgress(100)
        setTimeout(() => navigate('/ai-generation-schedule'), 650)
      }
    })

    return () => socket.close()
  }, [memberCount, navigate, params, roomId])

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
    if (roomId && !isHost) return

    let cancelled = false

    apiPost('/ai-travel/generate-collab', params)
      .then(json => {
        if (cancelled) return
        if (json?.data) {
          sessionStorage.setItem('aiPlanResult', JSON.stringify({ planData: json.data, tripInfo: params, planId: json.planId || null }))
          sendWhenOpen(socketRef.current, { type: 'plan_generated', planData: json.data, params, planId: json.planId || null })
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
  }, [isHost, navigate, params, roomId])

  return (
    <AiGenerationLoadingView
      trip={params}
      progress={progress}
      messageIndex={messageIndex}
      isFinishing={isFinishing}
    />
  )
}
