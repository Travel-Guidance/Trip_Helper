import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, ChevronRight, Plane, Building2, Sparkles } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import BottomNav from '../components/layout/BottomNav'
import { useAuth } from '../store/AuthContext'
import { getMyBookings, deletePlan } from '../api/bookingApi'
import '../styles/profile.css'

const BUDGET_LABEL = { low: '저예산', mid: '중간', high: '고급' }

const TAB_LIST = [
  { key: 'flights', label: '항공권', icon: <Plane size={14} /> },
  { key: 'stays',   label: '숙소',   icon: <Building2 size={14} /> },
  { key: 'plans',   label: 'AI 일정', icon: <Sparkles size={14} /> },
]

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`)
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function formatAmount(amount, currency = 'KRW') {
  if (!amount) return '-'
  const num = Number(amount)
  if (currency === 'KRW') return `₩${num.toLocaleString()}`
  return `${num.toLocaleString()} ${currency}`
}

function getFlightRoute(slices) {
  if (!slices?.length) return { from: '-', to: '-' }
  const first = slices[0]?.segments?.[0]
  const lastSlice = slices[slices.length - 1]
  const lastSeg = lastSlice?.segments?.[lastSlice.segments.length - 1]
  return {
    from: first?.origin?.iata_code || '-',
    to:   lastSeg?.destination?.iata_code || '-',
    date: first?.departing_at ? formatDate(first.departing_at) : '-',
  }
}

// ── 항공권 카드 ──────────────────────────────────────────
function FlightCard({ booking }) {
  const route = getFlightRoute(booking.slices)
  const pax = booking.passengers?.[0]
  const paxName = pax ? `${pax.given_name} ${pax.family_name}` : '-'

  return (
    <div className="profile-card pf-flight-card">
      <div className="pf-flight-top">
        <div className="pf-flight-route">
          {route.from}
          <span className="pf-flight-arrow">→</span>
          {route.to}
        </div>
        <span className="pf-ref-badge">{booking.booking_reference}</span>
      </div>

      <div className="pf-flight-meta">
        <div className="pf-meta-item">
          <span className="pf-meta-label">날짜</span>
          <span className="pf-meta-value">{route.date}</span>
        </div>
        <div className="pf-meta-item">
          <span className="pf-meta-label">승객</span>
          <span className="pf-meta-value">{paxName}</span>
        </div>
        <div className="pf-meta-item">
          <span className="pf-meta-label">예약일</span>
          <span className="pf-meta-value">{formatDate(booking.created_at)}</span>
        </div>
      </div>

      <div className="pf-flight-bottom">
        <span className="pf-status-dot">예약 확정</span>
        <span className="pf-amount">
          {formatAmount(booking.total_amount, booking.total_currency)}
        </span>
      </div>
    </div>
  )
}

// ── 숙소 카드 ────────────────────────────────────────────
function StayCard({ booking }) {
  return (
    <div className="profile-card pf-stay-card">
      {booking.image_url ? (
        <img className="pf-stay-img" src={booking.image_url} alt={booking.hotel_name} />
      ) : (
        <div className="pf-stay-img-placeholder">🏨</div>
      )}
      <div className="pf-stay-body">
        <div className="pf-stay-name">{booking.hotel_name || '숙소'}</div>
        {booking.location && (
          <div className="pf-stay-location">📍 {booking.location}</div>
        )}
        <div className="pf-stay-dates">
          {formatDate(booking.check_in)} – {formatDate(booking.check_out)}
          <span style={{ fontWeight: 400, color: 'var(--text-muted)', marginLeft: 6 }}>
            {booking.nights}박 · {booking.guests}명
          </span>
        </div>
        <div className="pf-stay-footer">
          <span className="pf-ref-badge">{booking.booking_reference}</span>
          <span className="pf-amount">
            {formatAmount(booking.total_amount, booking.total_currency)}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── AI 일정 카드 ─────────────────────────────────────────
function PlanCard({ plan, onDelete }) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async (e) => {
    e.stopPropagation()
    if (!window.confirm('이 일정을 삭제하시겠습니까?')) return
    setDeleting(true)
    try {
      await deletePlan(plan.id)
      onDelete(plan.id)
    } catch {
      alert('삭제에 실패했습니다.')
    } finally {
      setDeleting(false)
    }
  }

  const budgetText = BUDGET_LABEL[plan.budget] || plan.budget || '-'

  return (
    <div
      className="profile-card pf-plan-card"
      onClick={() => navigate(`/ai-generation-schedule`, { state: { planId: plan.id } })}
    >
      <div className="pf-plan-icon">✨</div>
      <div className="pf-plan-body">
        <div className="pf-plan-dest">{plan.destination || '목적지 미정'}</div>
        <div className="pf-plan-meta">
          {plan.nights}박 · {budgetText} · {formatDate(plan.created_at)} 생성
        </div>
      </div>
      <button
        className="pf-plan-delete"
        onClick={handleDelete}
        disabled={deleting}
        title="삭제"
      >
        <Trash2 size={15} />
      </button>
      <ChevronRight size={16} style={{ color: 'var(--text-light)', flexShrink: 0 }} />
    </div>
  )
}

// ── 빈 상태 ──────────────────────────────────────────────
function EmptyState({ tab }) {
  const navigate = useNavigate()
  const config = {
    flights: { icon: '✈️', text: '예약한 항공권이 없습니다', action: '항공권 검색', to: '/flights' },
    stays:   { icon: '🏨', text: '예약한 숙소가 없습니다',   action: '숙소 검색',   to: '/accommodation' },
    plans:   { icon: '🗺️', text: '저장된 AI 일정이 없습니다', action: 'AI 일정 만들기', to: '/ai-travel' },
  }[tab]

  return (
    <div className="pf-empty">
      <span className="pf-empty-icon">{config.icon}</span>
      <span className="pf-empty-text">{config.text}</span>
      <button className="pf-empty-btn" onClick={() => navigate(config.to)}>
        {config.action}
      </button>
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────
export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('flights')
  const [data, setData] = useState({ flights: [], stays: [], plans: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    getMyBookings()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, navigate])

  const handleDeletePlan = (planId) => {
    setData(prev => ({ ...prev, plans: prev.plans.filter(p => p.id !== planId) }))
  }

  const providerLabel = {
    kakao: { emoji: '💬', text: '카카오 로그인' },
    google: { emoji: '🔵', text: '구글 로그인' },
    email: { emoji: '✉️', text: '이메일 로그인' },
  }[user?.provider] || { emoji: '✉️', text: '이메일 로그인' }

  const counts = {
    flights: data.flights.length,
    stays:   data.stays.length,
    plans:   data.plans.length,
  }

  return (
    <div className="profile-page">
      <Navbar />

      {/* 프로필 헤더 */}
      <div className="profile-hero" style={{ paddingTop: 80 }}>
        <div className="profile-avatar">
          {user?.name?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="profile-name">{user?.name}</div>
        {user?.email && <div className="profile-email">{user.email}</div>}
        <div className="profile-provider-badge">
          {providerLabel.emoji} {providerLabel.text}
        </div>
      </div>

      {/* 탭 */}
      <div className="profile-tabs">
        {TAB_LIST.map(tab => (
          <button
            key={tab.key}
            className={`profile-tab${activeTab === tab.key ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span style={{
                marginLeft: 5,
                background: activeTab === tab.key ? 'var(--primary)' : 'var(--border)',
                color: activeTab === tab.key ? '#fff' : 'var(--text-muted)',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
                padding: '1px 6px',
                verticalAlign: 'middle',
              }}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 콘텐츠 */}
      <div className="profile-content">
        {loading ? (
          <div className="pf-loading"><div className="pf-spinner" /></div>
        ) : error ? (
          <div className="pf-empty">
            <span className="pf-empty-icon">⚠️</span>
            <span className="pf-empty-text">{error}</span>
          </div>
        ) : (
          <>
            {activeTab === 'flights' && (
              data.flights.length > 0
                ? data.flights.map(b => <FlightCard key={b.id} booking={b} />)
                : <EmptyState tab="flights" />
            )}

            {activeTab === 'stays' && (
              data.stays.length > 0
                ? data.stays.map(b => <StayCard key={b.id} booking={b} />)
                : <EmptyState tab="stays" />
            )}

            {activeTab === 'plans' && (
              data.plans.length > 0
                ? data.plans.map(p => (
                    <PlanCard key={p.id} plan={p} onDelete={handleDeletePlan} />
                  ))
                : <EmptyState tab="plans" />
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
