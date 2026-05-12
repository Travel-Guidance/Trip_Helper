import { useEffect, useRef, useState } from 'react'
import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { Check, Copy, Share2 } from 'lucide-react'
import { BUDGETS, STYLE_SUGGESTIONS } from '../data/AiGenerationInputForm'
import '../styles/AiCollaborationPlanning.css'

const MEMBER_COLORS = ['#0f6bff', '#00a676', '#ffb020', '#ef4444', '#7c3aed', '#db2777']

function hasDraftInfo(draft) {
  return Boolean(draft?.destination || draft?.startDate || draft?.endDate)
}

function draftFromSearchParams(searchParams) {
  const places = searchParams.get('places')

  return {
    destination: searchParams.get('destination') || '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || '',
    adults: Number(searchParams.get('adults') || 0),
    teens: Number(searchParams.get('teens') || 0),
    children: Number(searchParams.get('children') || 0),
    infants: Number(searchParams.get('infants') || 0),
    places: places ? places.split(',').map(place => place.trim()).filter(Boolean) : [],
  }
}

function readDraft(searchParams) {
  const sharedDraft = draftFromSearchParams(searchParams)
  if (hasDraftInfo(sharedDraft)) return sharedDraft

  try {
    const stored = JSON.parse(sessionStorage.getItem('aiTripDraft') || '{}')
    if (hasDraftInfo(stored)) return stored
  } catch {
    // fall through to empty shared draft
  }

  return sharedDraft
}

function buildRoomUrl(roomId, memberCount, draft) {
  const params = new URLSearchParams({ members: String(memberCount) })
  ;['destination', 'startDate', 'endDate', 'adults', 'teens', 'children', 'infants'].forEach(key => {
    const value = draft?.[key]
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  })
  if (Array.isArray(draft?.places) && draft.places.length) {
    params.set('places', draft.places.join(','))
  }
  return `${window.location.origin}/ai-collaboration-planning/${roomId}?${params.toString()}`
}

const BUDGET_ORDER = ['low', 'mid', 'high']

function intensityToDifficulty(value) {
  if (value <= 30) return 'relaxed'
  if (value <= 55) return 'normal'
  if (value <= 75) return 'active'
  return 'intense'
}

function aggregatePreferences(preferences, draft) {
  const budgets = preferences.map(p => p.budget).filter(Boolean)
  const avgBudgetIdx = budgets.length
    ? Math.round(budgets.reduce((sum, b) => sum + BUDGET_ORDER.indexOf(b), 0) / budgets.length)
    : 1
  const budget = BUDGET_ORDER[Math.max(0, Math.min(2, avgBudgetIdx))]

  const avgIntensity = Math.round(
    preferences.reduce((sum, p) => sum + Number(p.intensity ?? 50), 0) / Math.max(1, preferences.length)
  )
  const difficulty = intensityToDifficulty(avgIntensity)

  const styles = [...new Set(preferences.flatMap(p => p.styles || []))]
  const places = [...new Set([
    ...(Array.isArray(draft.places) ? draft.places : []),
    ...preferences.flatMap(p => p.places || []),
  ].map(place => String(place).trim()).filter(Boolean))]

  const nights = draft.startDate && draft.endDate
    ? Math.max(0, Math.round((new Date(draft.endDate) - new Date(draft.startDate)) / 86400000))
    : 0

  return {
    country: draft.destination || '',
    destination: draft.destination || '',
    startDate: draft.startDate || '',
    endDate: draft.endDate || '',
    nights,
    budget,
    styles,
    difficulty,
    intensity: `${avgIntensity}/100 평균`,
    places,
    adults: Number(draft.adults || 0) + Number(draft.teens || 0),
    children: Number(draft.children || 0) + Number(draft.infants || 0),
    mustVisit: places.join(', '),
    hasAccommodation: draft.hasAccommodation ?? null,
    accommodations: draft.accommodations || [],
    isCollab: true,
    memberCount: preferences.length,
  }
}

function createPreference(index) {
  return {
    name: index === 0 ? '방장' : `참여자 ${index + 1}`,
    budget: '',
    intensity: 50,
    styles: [],
    styleInput: '',
    placeInput: '',
    places: []
  }
}

function collaborationWsUrl(roomId, memberCount) {
  const configured = import.meta.env.VITE_WS_BASE || import.meta.env.VITE_API_BASE
  if (configured) {
    return `${configured.replace(/^http/, 'ws').replace(/\/$/, '')}/ws/collaboration?roomId=${encodeURIComponent(roomId)}&members=${memberCount}`
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.hostname}:3001/ws/collaboration?roomId=${encodeURIComponent(roomId)}&members=${memberCount}`
}

export default function AiCollaborationPlanning() {
  const { roomId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [draft, setDraft] = useState(() => readDraft(searchParams))
  const memberCount = Math.min(20, Math.max(2, parseInt(searchParams.get('members') || sessionStorage.getItem('aiCollabMemberCount') || '2', 10) || 2))
  const [preferences, setPreferences] = useState(() => Array.from({ length: memberCount }, (_, i) => createPreference(i)))
  const [connectedCount, setConnectedCount] = useState(1)
  const [connectionState, setConnectionState] = useState('연결 중')
  const [assignedMemberIndex, setAssignedMemberIndex] = useState(null)
  const [shareOpen, setShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const socketRef = useRef(null)
  const initialPreferencesRef = useRef(preferences)
  const initialDraftRef = useRef(draft)

  const roomUrl = buildRoomUrl(roomId, memberCount, draft)
  const travelerCount = (draft.adults || 0) + (draft.teens || 0) + (draft.children || 0) + (draft.infants || 0)
  const nights = draft.startDate && draft.endDate
    ? Math.max(0, Math.round((new Date(draft.endDate) - new Date(draft.startDate)) / 86400000))
    : 0
  const completedCount = preferences.filter(p => p.budget && p.styles.length > 0).length
  const isHost = assignedMemberIndex === 0

  const copyRoomUrl = async () => {
    await navigator.clipboard?.writeText(roomUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const publishPreference = (index, preference) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'preference_update', index, preference }))
    }
  }

  useEffect(() => {
    const socket = new WebSocket(collaborationWsUrl(roomId, memberCount))
    socketRef.current = socket

    socket.addEventListener('open', () => {
      setConnectionState('실시간 연결됨')
      socket.send(JSON.stringify({
        type: 'room_init',
        preferences: initialPreferencesRef.current,
        draft: initialDraftRef.current,
      }))
    })
    socket.addEventListener('close', () => setConnectionState('연결 끊김'))
    socket.addEventListener('error', () => setConnectionState('연결 오류'))
    socket.addEventListener('message', event => {
      let message
      try {
        message = JSON.parse(event.data)
      } catch {
        return
      }

      if (typeof message.connectedCount === 'number') {
        setConnectedCount(message.connectedCount)
      }

      if (typeof message.memberIndex === 'number') {
        setAssignedMemberIndex(message.memberIndex)
      }

      if ((message.type === 'room_state' || message.type === 'preferences_update') && Array.isArray(message.preferences)) {
        setPreferences(message.preferences)
      }

      if (message.type === 'room_state' && hasDraftInfo(message.draft)) {
        setDraft(prev => ({ ...prev, ...message.draft }))
        sessionStorage.setItem('aiTripDraft', JSON.stringify(message.draft))
      }

      if (message.type === 'preference_update' && typeof message.index === 'number' && message.preference) {
        setPreferences(prev => prev.map((item, index) => index === message.index ? message.preference : item))
      }

      if (message.type === 'generation_started' && message.params) {
        sessionStorage.setItem('aiCollabParams', JSON.stringify(message.params))
        sessionStorage.setItem('aiCollabRoomId', roomId)
        sessionStorage.setItem('aiCollabMemberCount', String(memberCount))
        sessionStorage.setItem('aiCollabIsHost', 'false')
        navigate('/ai-collab-loading')
      }

      if (message.type === 'room_state' && message.generationStarted && message.generatedParams) {
        sessionStorage.setItem('aiCollabParams', JSON.stringify(message.generatedParams))
        sessionStorage.setItem('aiCollabRoomId', roomId)
        sessionStorage.setItem('aiCollabMemberCount', String(memberCount))
        sessionStorage.setItem('aiCollabIsHost', 'false')
        navigate('/ai-collab-loading')
      }
    })

    return () => socket.close()
  }, [memberCount, navigate, roomId])

  const updatePreference = (index, patch) => {
    if (index !== assignedMemberIndex) return
    const next = preferences.map((item, i) => i === index ? { ...item, ...patch } : item)
    setPreferences(next)
    publishPreference(index, next[index])
  }

  const toggleStyle = (index, style) => {
    if (index !== assignedMemberIndex) return
    const next = preferences.map((item, i) => {
      if (i !== index) return item
      return {
        ...item,
        styles: item.styles.includes(style)
          ? item.styles.filter(s => s !== style)
          : [...item.styles, style]
      }
    })
    setPreferences(next)
    publishPreference(index, next[index])
  }

  const addStyle = index => {
    const target = preferences[index]
    const value = target.styleInput.trim().replace(/^#+/, '')
    if (!value || target.styles.includes(value)) return
    updatePreference(index, { styleInput: '', styles: [...target.styles, value] })
  }

  const removeStyle = (index, style) => {
    updatePreference(index, { styles: preferences[index].styles.filter(s => s !== style) })
  }

  const addPlace = index => {
    const target = preferences[index]
    const value = target.placeInput.trim()
    if (!value || target.places.includes(value)) return
    updatePreference(index, { placeInput: '', places: [...target.places, value] })
  }

  const removePlace = (index, place) => {
    updatePreference(index, { places: preferences[index].places.filter(p => p !== place) })
  }

  const handleGeneratePlan = () => {
    if (!isHost) return
    const params = aggregatePreferences(preferences, draft)
    sessionStorage.setItem('aiCollabParams', JSON.stringify(params))
    sessionStorage.setItem('aiCollabRoomId', roomId)
    sessionStorage.setItem('aiCollabMemberCount', String(memberCount))
    sessionStorage.setItem('aiCollabIsHost', 'true')
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'generation_started', params }))
    }
    navigate('/ai-collab-loading')
  }

  return (
    <div className="collab-page">
      {/* ── Sidebar ── */}
      <aside className="collab-cover">
        <div className="collab-cover-top">
          <a className="collab-brand-mark" href="/ai-generation-inputform">
            <span className="collab-logo-box">✈</span>
            <strong>폰가이즈</strong>
          </a>
          <span className="collab-live-badge">● LIVE</span>
        </div>

        <div className="collab-cover-mid">
          <p className="collab-eyebrow">COLLABORATION ROOM</p>
          <h1 className="collab-cover-title">각자의 취향을<br/>모아 AI 일정 만들기</h1>
        </div>

        <div className="collab-members-panel">
          <p className="collab-members-label">작업 멤버 · {memberCount}명</p>
          <div className="collab-members-list">
            {preferences.map((member, i) => (
              <div className="collab-member-item" key={member.name}>
                <span className="collab-avatar" style={{ background: MEMBER_COLORS[i % MEMBER_COLORS.length] }}>
                  {i === 0 ? '나' : i + 1}
                </span>
                <div className="collab-member-info">
                  <strong>{member.name}</strong>
                  <small>
                    {member.budget && member.styles.length > 0
                      ? '✓ 입력 완료'
                      : member.budget || member.styles.length
                        ? '입력 중'
                        : '대기 중'}
                  </small>
                </div>
                {member.budget && member.styles.length > 0 && (
                  <span className="collab-member-done">✓</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* ── Main Workspace ── */}
      <main className="collab-workspace">
        <header className="collab-topbar">
          <div className="collab-topbar-text">
            <h2>개인 취향 수집 보드</h2>
            <p>각자 예산·강도·스타일을 입력하면 AI가 모두 반영해 일정을 생성합니다.</p>
          </div>
          <div className="collab-share-wrap">
            <button type="button" className="collab-share-btn" onClick={() => setShareOpen(open => !open)}>
              <Share2 size={16} />
              <span>공유하기</span>
            </button>
            {shareOpen && (
              <section className="collab-share-popover" aria-label="협업방 공유">
                <div className="collab-share-tabs">
                  <button type="button" className="active">링크</button>
                  <button type="button" disabled>초대</button>
                </div>
                <div className="collab-share-content">
                  <div className="collab-share-title">
                    <Share2 size={16} />
                    <strong>협업방 링크</strong>
                  </div>
                  <div className="collab-share-url-row">
                    <input value={roomUrl} readOnly />
                    <button type="button" onClick={copyRoomUrl} aria-label="공유 링크 복사">
                      {copied ? <Check size={18} /> : <Copy size={18} />}
                    </button>
                  </div>
                  <p>{copied ? '링크가 복사되었습니다.' : '함께 작업할 사람에게 이 링크를 공유하세요.'}</p>
                </div>
              </section>
            )}
          </div>
        </header>

        <div className="collab-status-bar">
          <span className="status-pill status-live">● {connectionState}</span>
          <span className="status-pill">
            {assignedMemberIndex === null
              ? '카드 배정 중'
              : assignedMemberIndex >= 0
                ? `내 카드: ${assignedMemberIndex === 0 ? '방장' : `참여자 ${assignedMemberIndex + 1}`}`
                : '읽기 전용 입장'}
          </span>
          <span className="status-pill">{connectedCount}/{memberCount}명 접속</span>
          <span className="status-pill">{completedCount}/{memberCount}명 취향 입력</span>
          <span className="status-pill">AI 합산 예정</span>
        </div>

        <section className="collab-trip-card">
          <div className="collab-trip-dest">
            <p className="collab-trip-label">공통 여행지</p>
            <h3>{draft.destination || '여행지 미입력'}</h3>
          </div>
          <div className="collab-trip-stats">
            <div className="collab-stat">
              <span>기간</span>
              <strong>{draft.startDate || '출발일'} ~ {draft.endDate || '귀국일'}</strong>
            </div>
            <div className="collab-stat">
              <span>일수</span>
              <strong>{nights > 0 ? `${nights}박 ${nights + 1}일` : '기간 미정'}</strong>
            </div>
            <div className="collab-stat">
              <span>인원</span>
              <strong>{travelerCount}명</strong>
            </div>
          </div>
        </section>

        <section className="collab-board" aria-label="참여자별 여행 취향">
          {preferences.map((member, index) => {
            const selectedBudget = BUDGETS.find(b => b.key === member.budget)
            const color = MEMBER_COLORS[index % MEMBER_COLORS.length]
            const isMine = index === assignedMemberIndex

            return (
              <article className={`collab-card${isMine ? ' mine' : ' readonly'}`} key={member.name}>
                <div className="collab-card-head" style={{ '--member-color': color }}>
                  <span className="collab-card-avatar" style={{ background: color }}>
                    {index === 0 ? '나' : index + 1}
                  </span>
                  <div>
                    <h3>{member.name}</h3>
                    <p>
                      {selectedBudget ? selectedBudget.label : '예산 미선택'} · 강도 {member.intensity} · 스타일 {member.styles.length}개
                    </p>
                  </div>
                  <span className="collab-card-lock">{isMine ? '내 카드' : '읽기 전용'}</span>
                </div>

                <div className="collab-field">
                  <div className="collab-field-header">
                    <strong>개인 예산</strong>
                    <small>하루 1인 기준</small>
                  </div>
                  <div className="collab-budget-grid">
                    {BUDGETS.map(budget => (
                      <button
                        key={budget.key}
                        type="button"
                        className={`collab-budget-btn${member.budget === budget.key ? ' active' : ''}`}
                        disabled={!isMine}
                        onClick={() => updatePreference(index, { budget: budget.key })}
                      >
                        <span className="budget-icon">{budget.icon}</span>
                        <strong>{budget.label}</strong>
                        <small>{budget.sub}</small>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="collab-field">
                  <div className="collab-field-header">
                    <strong>여행 강도</strong>
                    <small>개인 이동 속도</small>
                  </div>
                  <div className="collab-intensity">
                    <div className="collab-intensity-score">
                      <span style={{ color }}>{member.intensity}</span>
                      <small>/100</small>
                    </div>
                    <div className="collab-intensity-slider">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={member.intensity}
                        className="collab-range"
                        disabled={!isMine}
                        style={{ '--pct': `${member.intensity}%`, '--color': color }}
                        onChange={e => updatePreference(index, { intensity: Number(e.target.value) })}
                      />
                      <div className="collab-range-labels">
                        <span>휴양</span>
                        <span>최대</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="collab-field">
                  <div className="collab-field-header">
                    <div className="collab-style-title">
                      <span>✨</span>
                      <div>
                        <strong>여행 스타일</strong>
                        <small>선택하면 더 완벽한 일정을 만들 수 있습니다.</small>
                      </div>
                    </div>
                    <em>선택 추천</em>
                  </div>
                  <div className="collab-hashbox">
                    <span>#</span>
                    <input
                      value={member.styleInput}
                      disabled={!isMine}
                      onChange={e => updatePreference(index, { styleInput: e.target.value })}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          addStyle(index)
                        }
                      }}
                      placeholder="스타일 입력 후 Enter (예: 힐링, 맛집탐방)"
                    />
                  </div>
                  <p className="collab-hint">Enter로 태그가 추가됩니다.</p>
                  <div className="collab-style-suggestions">
                    <p>자주 쓰는 스타일</p>
                    <div className="collab-style-chips">
                      {STYLE_SUGGESTIONS.map(style => (
                        <button
                          key={style}
                          type="button"
                          className={`collab-chip${member.styles.includes(style) ? ' active' : ''}`}
                          disabled={!isMine}
                          style={member.styles.includes(style) ? { '--chip-color': color } : {}}
                          onClick={() => toggleStyle(index, style)}
                      >
                        #{style}
                      </button>
                      ))}
                    </div>
                  </div>
                  {member.styles.length > 0 && (
                    <div className="collab-style-tags">
                      {member.styles.map(style => (
                        <button type="button" key={style} className="collab-style-tag" disabled={!isMine} onClick={() => removeStyle(index, style)}>
                          #{style} <span>×</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="collab-field">
                  <div className="collab-field-header">
                    <strong>가고 싶은 곳</strong>
                    <small>선택 입력</small>
                  </div>
                  <div className="collab-place-row">
                    <input
                      className="collab-input"
                      value={member.placeInput}
                      disabled={!isMine}
                      onChange={e => updatePreference(index, { placeInput: e.target.value })}
                      onKeyDown={e => e.key === 'Enter' && addPlace(index)}
                      placeholder="예: 에펠탑, 신주쿠, 야시장"
                    />
                    <button type="button" className="collab-add-btn" disabled={!isMine} onClick={() => addPlace(index)}>추가</button>
                  </div>
                  {member.places.length > 0 && (
                    <div className="collab-place-tags">
                      {member.places.map(place => (
                        <button type="button" key={place} className="collab-place-tag" disabled={!isMine} onClick={() => removePlace(index, place)}>
                          {place} <span>×</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            )
          })}
        </section>

        <footer className="collab-create-bar">
          <div className="collab-create-info">
            <div className="collab-progress-track">
              <div className="collab-progress-fill" style={{ width: `${(completedCount / memberCount) * 100}%` }} />
            </div>
            <strong>{completedCount}/{memberCount}명 취향 입력 완료</strong>
            <span>입력값 합산 후 AI 일정 생성 요청에 전달됩니다.</span>
          </div>
          <button
            type="button"
            className="collab-create-btn"
            disabled={!isHost || completedCount === 0}
            onClick={handleGeneratePlan}
            title={isHost ? undefined : '방장만 AI 일정을 생성할 수 있습니다.'}
          >
            {!isHost
              ? '방장이 일정 생성 가능'
              : completedCount === memberCount
                ? 'AI 일정 생성하기'
                : `AI 일정 생성 준비 (${completedCount}/${memberCount}명 완료)`}
          </button>
        </footer>
      </main>
    </div>
  )
}
