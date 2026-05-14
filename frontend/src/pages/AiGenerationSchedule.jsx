import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PLAN } from '../data/AiGenerationSchedule'
import AiGenerationScheduleView from '../components/aitravel/AiGenerationScheduleView'
import TravelChatDrawer from '../components/aitravel/TravelChatDrawer'
import { getPlanDetail } from '../api/bookingApi'
import { useAuth } from '../store/AuthContext'
import {
  hasPendingPlanSaveAfterAuth,
  markPendingPlanSaveAfterAuth,
  savePendingPlanAfterAuth,
} from '../utils/pendingPlanSave'

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

function UnsavedGuestScheduleModal({ onClose, onLogin, onSignup, onDiscard }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div className="guest-schedule-modal-overlay" role="presentation">
      <div
        className="guest-schedule-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="guest-schedule-modal-title"
      >
        <button className="guest-schedule-modal-close" type="button" onClick={onClose} aria-label="닫기">×</button>
        <div className="guest-schedule-modal-icon">!</div>
        <p className="guest-schedule-modal-kicker">저장되지 않은 일정</p>
        <h2 id="guest-schedule-modal-title">지금 나가면 이 일정을 다시 볼 수 없어요</h2>
        <p className="guest-schedule-modal-copy">
          로그인하거나 회원가입하면 생성한 여행 일정을 안전하게 이어서 관리할 수 있습니다.
        </p>
        <div className="guest-schedule-modal-actions">
          <button className="guest-schedule-modal-btn primary" type="button" onClick={onSignup}>회원가입</button>
          <button className="guest-schedule-modal-btn secondary" type="button" onClick={onLogin}>로그인</button>
          <button className="guest-schedule-modal-btn ghost" type="button" onClick={onDiscard}>저장하지 않기</button>
        </div>
      </div>
    </div>
  )
}

export default function AiGenerationSchedule() {
  const navigate = useNavigate()
  const location = useLocation()
  const { isLoggedIn } = useAuth()
  const planId = location.state?.planId
  const result = readResult()
  const [savedResult, setSavedResult] = useState(null)
  const [loading, setLoading] = useState(Boolean(planId))
  const [error, setError] = useState('')
  const [authSaveError, setAuthSaveError] = useState('')
  const [leaveModal, setLeaveModal] = useState({ open: false, onDiscard: null })

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
          planId: plan.id,
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
  const shouldWarnBeforeLeave = !isLoggedIn && !planId && Boolean(displayResult?.planData)
  const planData = displayResult?.planData ?? DEMO_PLAN
  const tripInfo = displayResult?.tripInfo
    ? { ...displayResult.tripInfo, nights: Number(displayResult.tripInfo.nights) }
    : DEMO_INFO

  useEffect(() => {
    if (!isLoggedIn || !hasPendingPlanSaveAfterAuth() || displayResult?.planId) return

    let cancelled = false

    savePendingPlanAfterAuth()
      .then(nextResult => {
        if (!cancelled && nextResult) {
          setSavedResult(nextResult)
          setAuthSaveError('')
        }
      })
      .catch(() => {
        if (!cancelled) setAuthSaveError('로그인은 완료됐지만 일정 저장에 실패했습니다. 잠시 후 다시 시도해주세요.')
      })

    return () => { cancelled = true }
  }, [displayResult?.planId, isLoggedIn])

  const requestGuestScheduleLeave = useCallback((onLeave) => {
    if (!shouldWarnBeforeLeave) {
      onLeave()
      return
    }

    setLeaveModal({ open: true, onDiscard: onLeave })
  }, [shouldWarnBeforeLeave])

  const closeLeaveModal = useCallback(() => {
    setLeaveModal({ open: false, onDiscard: null })
  }, [])

  const handleLoginFromModal = useCallback(() => {
    markPendingPlanSaveAfterAuth()
    navigate('/login')
  }, [navigate])

  const handleSignupFromModal = useCallback(() => {
    markPendingPlanSaveAfterAuth()
    navigate('/login', { state: { tab: 'signup' } })
  }, [navigate])

  const handleDiscardFromModal = useCallback(() => {
    const onDiscard = leaveModal.onDiscard
    closeLeaveModal()
    onDiscard?.()
  }, [closeLeaveModal, leaveModal.onDiscard])

  useEffect(() => {
    if (!shouldWarnBeforeLeave) return undefined

    const handleBeforeUnload = (event) => {
      event.preventDefault()
      event.returnValue = ''
    }

    const handleDocumentClick = (event) => {
      const anchor = event.target.closest?.('a[href]')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      const target = anchor.getAttribute('target')
      if (!href || target === '_blank' || href.startsWith('#')) return

      const nextUrl = new URL(href, window.location.href)
      const currentUrl = new URL(window.location.href)
      if (nextUrl.origin !== currentUrl.origin) return
      if (nextUrl.pathname === currentUrl.pathname && nextUrl.search === currentUrl.search) return

      event.preventDefault()
      event.stopPropagation()

      setLeaveModal({
        open: true,
        onDiscard: () => navigate(`${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`),
      })
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('click', handleDocumentClick, true)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('click', handleDocumentClick, true)
    }
  }, [navigate, shouldWarnBeforeLeave])

  function handleReset() {
    requestGuestScheduleLeave(() => {
      sessionStorage.removeItem('aiPlanResult')
      navigate('/ai-generation-inputform')
    })
  }

  function handleTravelDuration() {
    requestGuestScheduleLeave(() => {
      const nextPlanId = displayResult?.planId || planId || null
      if (nextPlanId) {
        navigate(`/ai-travel-duration?planId=${encodeURIComponent(nextPlanId)}`)
        return
      }

      sessionStorage.setItem('aiPlanResult', JSON.stringify({ planData, tripInfo, planId: null }))
      navigate('/ai-travel-duration')
    })
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
      {authSaveError && (
        <div className="guest-schedule-save-error" role="alert">{authSaveError}</div>
      )}
      {leaveModal.open && (
        <UnsavedGuestScheduleModal
          onClose={closeLeaveModal}
          onLogin={handleLoginFromModal}
          onSignup={handleSignupFromModal}
          onDiscard={handleDiscardFromModal}
        />
      )}
      <TravelChatDrawer destination={tripInfo.country || tripInfo.continent || ''} />
    </>
  )
}
