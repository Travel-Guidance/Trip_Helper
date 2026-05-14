import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Trash2, ChevronRight, Pencil,
  Plane, Building2, Sparkles, BookOpen, Heart, LogOut,
  Globe, Calendar, Trophy, MapPin, Star, Mail, MessageSquare, Map,
  CheckCircle2, XCircle, AlertCircle,
} from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import BottomNav from '../components/layout/BottomNav'
import { useAuth } from '../store/AuthContext'
import { getMyBookings, deletePlan, cancelFlightBooking, cancelStayBooking } from '../api/bookingApi'
import '../styles/profile.css'

const BUDGET_LABEL = { low: '저예산', mid: '중간', high: '고급' }

function formatDate(dateStr) {
  if (!dateStr) return '-'
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`)
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60)  return `${m || 1}분 전`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 30)  return `${d}일 전`
  return formatDate(dateStr)
}

function formatAmount(amount, currency = 'KRW') {
  if (!amount) return '-'
  const num = Number(amount)
  if (currency === 'KRW') return `₩${num.toLocaleString()}`
  return `${num.toLocaleString()} ${currency}`
}

function getFlightRoute(slices) {
  if (!slices?.length) return { from: '-', to: '-', airline: '', date: '-', arrDate: '-', cabin: '-' }
  const first     = slices[0]?.segments?.[0]
  const lastSlice = slices[slices.length - 1]
  const lastSeg   = lastSlice?.segments?.[lastSlice.segments.length - 1]
  return {
    from:    first?.origin?.iata_code        || '-',
    to:      lastSeg?.destination?.iata_code  || '-',
    airline: first?.operating_carrier?.name  || first?.marketing_carrier?.name || '',
    date:    first?.departing_at    ? formatDate(first.departing_at)   : '-',
    arrDate: lastSeg?.arriving_at   ? formatDate(lastSeg.arriving_at)  : '-',
    cabin:   first?.passengers?.[0]?.cabin_class_marketing_name || first?.passengers?.[0]?.cabin_class || '이코노미',
  }
}

function gradeFromCount(count) {
  if (count >= 20) return { label: 'Platinum', color: '#7c3aed', bg: '#f3e8ff' }
  if (count >= 15) return { label: 'Gold',     color: '#d97706', bg: '#fef3c7' }
  if (count >= 10) return { label: 'Silver',   color: '#6b7280', bg: '#f3f4f6' }
  return               { label: 'Bronze',   color: '#92400e', bg: '#fef3c7' }
}

const PROVIDER_INFO = {
  kakao:  { Icon: MessageSquare, text: '카카오로 로그인', color: '#fee500', textColor: '#3c1e1e' },
  google: { Icon: Globe,         text: '구글로 로그인',   color: '#fff',    textColor: '#374151' },
  email:  { Icon: Mail,          text: '이메일로 로그인', color: '#eff6ff', textColor: '#1d4ed8' },
}

// ── 항공권 카드 ──────────────────────────────────────────
function FlightCard({ booking, onCancel, showToast }) {
  const [cancelling, setCancelling] = useState(false)
  const cancelled = booking.status === 'cancelled'
  const route = getFlightRoute(booking.slices)

  const handleCancel = () => {
    showToast('항공권 예약 취소', '취소 후에는 되돌릴 수 없습니다.', 'confirm', [
      {
        label: '취소하기', primary: true,
        action: async () => {
          setCancelling(true)
          try {
            await cancelFlightBooking(booking.id)
            onCancel(booking.id)
            showToast('취소 완료', '항공권 예약이 취소되었습니다.', 'ok')
          } catch {
            showToast('취소 실패', '취소에 실패했습니다. 다시 시도해 주세요.', 'danger')
          } finally {
            setCancelling(false)
          }
        },
      },
      { label: '유지', primary: false, action: null },
    ])
  }

  return (
    <div className={`pf2-card${cancelled ? ' pf2-card--cancelled' : ''}`}>
      <div className="pf2-card-head">
        <div className="pf2-flight-icon-wrap">
          <Plane size={20} style={{ color: '#fff' }} />
        </div>
        <div className="pf2-flight-info">
          <div className="pf2-flight-route">
            {route.from} <span className="pf2-arrow">→</span> {route.to}
          </div>
          {route.airline && <div className="pf2-flight-airline">{route.airline}</div>}
        </div>
        {cancelled
          ? <span className="pf2-badge pf2-badge--cancelled">취소됨</span>
          : <span className="pf2-badge pf2-badge--confirmed">예약 확정</span>
        }
      </div>

      <div className="pf2-flight-meta">
        <div className="pf2-meta-col">
          <span className="pf2-meta-label">출발일</span>
          <span className="pf2-meta-value">{route.date}</span>
        </div>
        <div className="pf2-meta-col">
          <span className="pf2-meta-label">도착일</span>
          <span className="pf2-meta-value">{route.arrDate}</span>
        </div>
        <div className="pf2-meta-col">
          <span className="pf2-meta-label">좌석 등급</span>
          <span className="pf2-meta-value">{route.cabin}</span>
        </div>
      </div>

      <div className="pf2-card-foot">
        <span className="pf2-amount">{formatAmount(booking.total_amount, booking.total_currency)}</span>
        <div className="pf2-foot-right">
          <span className="pf2-ref">{booking.booking_reference}</span>
          {!cancelled && (
            <button className="pf2-cancel-btn" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? '취소 중...' : '예약 취소'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── 숙소 카드 ────────────────────────────────────────────
function StayCard({ booking, onCancel, showToast }) {
  const [cancelling, setCancelling] = useState(false)
  const cancelled = booking.status === 'cancelled'

  const handleCancel = () => {
    showToast('숙소 예약 취소', '취소 후에는 되돌릴 수 없습니다.', 'confirm', [
      {
        label: '취소하기', primary: true,
        action: async () => {
          setCancelling(true)
          try {
            await cancelStayBooking(booking.id)
            onCancel(booking.id)
            showToast('취소 완료', '숙소 예약이 취소되었습니다.', 'ok')
          } catch {
            showToast('취소 실패', '취소에 실패했습니다. 다시 시도해 주세요.', 'danger')
          } finally {
            setCancelling(false)
          }
        },
      },
      { label: '유지', primary: false, action: null },
    ])
  }

  return (
    <div className={`pf2-card${cancelled ? ' pf2-card--cancelled' : ''}`}>
      <div className="pf2-card-head">
        <div className="pf2-stay-icon-wrap">
          {booking.image_url
            ? <img src={booking.image_url} alt="" className="pf2-stay-thumb" />
            : <Building2 size={20} style={{ color: '#fff' }} />
          }
        </div>
        <div className="pf2-flight-info">
          <div className="pf2-flight-route" style={{ fontSize: 15 }}>{booking.hotel_name || '숙소'}</div>
          {booking.location && (
            <div className="pf2-flight-airline" style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <MapPin size={11} />
              {booking.location}
            </div>
          )}
        </div>
        {cancelled
          ? <span className="pf2-badge pf2-badge--cancelled">취소됨</span>
          : <span className="pf2-badge pf2-badge--confirmed">예약 확정</span>
        }
      </div>

      <div className="pf2-flight-meta">
        <div className="pf2-meta-col">
          <span className="pf2-meta-label">체크인</span>
          <span className="pf2-meta-value">{formatDate(booking.check_in)}</span>
        </div>
        <div className="pf2-meta-col">
          <span className="pf2-meta-label">체크아웃</span>
          <span className="pf2-meta-value">{formatDate(booking.check_out)}</span>
        </div>
        <div className="pf2-meta-col">
          <span className="pf2-meta-label">인원</span>
          <span className="pf2-meta-value">{booking.nights}박 · {booking.guests}명</span>
        </div>
      </div>

      <div className="pf2-card-foot">
        <span className="pf2-amount">{formatAmount(booking.total_amount, booking.total_currency)}</span>
        <div className="pf2-foot-right">
          <span className="pf2-ref">{booking.booking_reference}</span>
          {!cancelled && (
            <button className="pf2-cancel-btn" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? '취소 중...' : '예약 취소'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── AI 일정 카드 ─────────────────────────────────────────
function PlanCard({ plan, onDelete, showToast }) {
  const navigate = useNavigate()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = (e) => {
    e.stopPropagation()
    showToast('AI 일정 삭제', '이 일정을 삭제하시겠습니까?', 'confirm', [
      {
        label: '삭제하기', primary: true,
        action: async () => {
          setDeleting(true)
          try {
            await deletePlan(plan.id)
            onDelete(plan.id)
            showToast('삭제 완료', '일정이 삭제되었습니다.', 'ok')
          } catch {
            showToast('삭제 실패', '삭제에 실패했습니다. 다시 시도해 주세요.', 'danger')
          } finally {
            setDeleting(false)
          }
        },
      },
      { label: '유지', primary: false, action: null },
    ])
  }

  return (
    <div className="pf2-card pf2-plan-card"
      onClick={() => navigate('/ai-generation-schedule', { state: { planId: plan.id } })}
    >
      <div className="pf2-plan-icon"><Sparkles size={18} style={{ color: '#fff' }} /></div>
      <div className="pf2-flight-info" style={{ flex: 1 }}>
        <div className="pf2-flight-route" style={{ fontSize: 15 }}>{plan.destination || '목적지 미정'}</div>
        <div className="pf2-flight-airline">
          {plan.nights}박 · {BUDGET_LABEL[plan.budget] || plan.budget || '-'} · {formatDate(plan.created_at)} 생성
        </div>
      </div>
      <button className="pf2-icon-btn pf2-delete-btn" onClick={handleDelete} disabled={deleting}>
        <Trash2 size={14} />
      </button>
      <ChevronRight size={16} style={{ color: '#9ca3af', flexShrink: 0 }} />
    </div>
  )
}

function EmptyState({ tab }) {
  const navigate = useNavigate()
  const config = {
    flights: { Icon: Plane,     text: '예약한 항공권이 없습니다',  action: '항공권 검색',    to: '/flights' },
    stays:   { Icon: Building2, text: '예약한 숙소가 없습니다',    action: '숙소 검색',      to: '/accommodation' },
    plans:   { Icon: Map,       text: '저장된 AI 일정이 없습니다', action: 'AI 일정 만들기', to: '/ai-generation-inputform' },
  }[tab]
  return (
    <div className="pf2-empty">
      <config.Icon size={36} style={{ opacity: 0.25, color: '#6b7280' }} />
      <span style={{ fontSize: 14, color: '#9ca3af' }}>{config.text}</span>
      <button className="pf2-empty-btn" onClick={() => navigate(config.to)}>{config.action}</button>
    </div>
  )
}

// ── 메인 페이지 ──────────────────────────────────────────
export default function ProfilePage() {
  const { user, logout, profilePic, updateProfilePic } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('flights')
  const [data, setData]       = useState({ flights: [], stays: [], plans: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)
  const fileInputRef = useRef(null)
  const [toast, setToast] = useState({ show: false, icon: '', title: '', msg: '', type: '', actions: [] })
  const toastTimerRef = useRef(null)

  const showToast = (title, msg, type, actions = []) => {
    clearTimeout(toastTimerRef.current)
    setToast({ show: true, title, msg, type, actions })
    if (!actions.length) {
      toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 3000)
    }
  }

  const handleToastAction = (action) => {
    setToast(t => ({ ...t, show: false }))
    if (action) action()
  }

  useEffect(() => {
    if (!user) { navigate('/login', { replace: true }); return }
    getMyBookings()
      .then(setData)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [user, navigate])

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      updateProfilePic(user.id, ev.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleDeletePlan   = id => setData(p => ({ ...p, plans:   p.plans.filter(x => x.id !== id) }))
  const handleCancelFlight = id => setData(p => ({ ...p, flights: p.flights.map(b => b.id === id ? { ...b, status: 'cancelled' } : b) }))
  const handleCancelStay   = id => setData(p => ({ ...p, stays:   p.stays.map(b => b.id === id ? { ...b, status: 'cancelled' } : b) }))

  const stats = useMemo(() => {
    const tripCount   = data.stays.length
    const totalNights = data.stays.reduce((s, b) => s + (Number(b.nights) || 0), 0)
    const countries   = new Set()
    data.stays.forEach(s => { if (s.location) countries.add(s.location.split(',').pop().trim()) })
    return {
      countries: countries.size || data.stays.length,
      totalDays: totalNights,
      tripCount,
      grade: gradeFromCount(tripCount),
    }
  }, [data])

  const recentActivities = useMemo(() => {
    const items = [
      ...data.flights.map(b => ({
        icon: <Plane size={15} />, iconBg: '#eff6ff', iconColor: '#3b82f6',
        text: `${getFlightRoute(b.slices).to}행 항공권을 예약했습니다`,
        time: b.created_at,
      })),
      ...data.stays.map(b => ({
        icon: <Building2 size={15} />, iconBg: '#f0fdf4', iconColor: '#16a34a',
        text: `${b.hotel_name || '숙소'}을 예약했습니다`,
        time: b.created_at,
      })),
      ...data.plans.map(p => ({
        icon: <Sparkles size={15} />, iconBg: '#faf5ff', iconColor: '#7c3aed',
        text: `${p.destination || ''} 여행 계획을 생성했습니다`,
        time: p.created_at,
      })),
    ]
    return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 5)
  }, [data])

  const provider = PROVIDER_INFO[user?.provider] || PROVIDER_INFO.email
  const { Icon: ProviderIcon } = provider

  const QUICK_MENU = [
    { icon: <BookOpen size={16} />, label: '포토북',     action: () => navigate('/photobook') },
    { icon: <Heart size={16} />,    label: '찜한 여행지', action: () => setActiveTab('plans') },
    { icon: <LogOut size={16} />,   label: '로그아웃',   action: () => { logout(); navigate('/login') }, danger: true },
  ]

  const TABS = [
    { key: 'flights', label: '항공권', count: data.flights.length },
    { key: 'stays',   label: '숙소',   count: data.stays.length },
    { key: 'plans',   label: 'AI 일정', count: data.plans.length },
  ]

  const STAT_ITEMS = [
    { Icon: Globe,    label: '방문 국가', value: stats.countries },
    { Icon: Calendar, label: '총 여행일', value: stats.totalDays },
    { Icon: Plane,    label: '여행 횟수', value: stats.tripCount },
    { Icon: Trophy,   label: '여행 등급', value: stats.grade.label, valueStyle: { color: stats.grade.color, fontSize: 13 } },
  ]

  return (
    <div className="pf2-page">
      <Navbar />

      <div className="pf2-layout">

        {/* ── 사이드바 ── */}
        <aside className="pf2-sidebar">
          {user?.provider === 'email' && (
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          )}

          <div className="pf2-avatar-wrap">
            <div className="pf2-avatar">
              {profilePic
                ? <img src={profilePic} alt="프로필" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                : user?.name?.[0]?.toUpperCase() || '?'
              }
            </div>
            {user?.provider === 'email' && (
              <button className="pf2-avatar-edit" aria-label="프로필 사진 변경" onClick={() => fileInputRef.current?.click()}>
                <Pencil size={12} />
              </button>
            )}
          </div>
          <div className="pf2-sidebar-name">{user?.name}</div>
          <div className="pf2-sidebar-email">{user?.email}</div>

          <div className="pf2-provider-badge" style={{ background: provider.color, color: provider.textColor }}>
            <ProviderIcon size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
            {provider.text}
          </div>

          <div className="pf2-sidebar-btns">
            {user?.provider === 'email' && (
              <button className="pf2-edit-btn" onClick={() => fileInputRef.current?.click()}>
                <Pencil size={13} /> 프로필 사진 변경
              </button>
            )}
            <button className="pf2-grade-btn">
              <Star size={12} style={{ display: 'inline', color: stats.grade.color, fill: stats.grade.color }} />
              {' '}{stats.grade.label}
            </button>
          </div>

          <div className="pf2-stats-title">나의 여행 통계</div>
          <div className="pf2-stats-grid">
            {STAT_ITEMS.map(s => (
              <div key={s.label} className="pf2-stat-item">
                <div className="pf2-stat-icon"><s.Icon size={18} /></div>
                <div className="pf2-stat-value" style={s.valueStyle}>{s.value}</div>
                <div className="pf2-stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="pf2-stats-title" style={{ marginTop: 20 }}>빠른 메뉴</div>
          <div className="pf2-quick-menu">
            {QUICK_MENU.map(item => (
              <button key={item.label} className={`pf2-menu-item${item.danger ? ' pf2-menu-danger' : ''}`} onClick={item.action}>
                <span className="pf2-menu-icon">{item.icon}</span>
                <span className="pf2-menu-label">{item.label}</span>
                <ChevronRight size={15} className="pf2-menu-chevron" />
              </button>
            ))}
          </div>
        </aside>

        {/* ── 메인 콘텐츠 ── */}
        <main className="pf2-main">

          {/* 웰컴 배너 */}
          <div className="pf2-banner">
            <div>
              <div className="pf2-banner-title">안녕하세요, {user?.name}님</div>
              <div className="pf2-banner-sub">다음 여행을 계획할 준비가 되셨나요?</div>
            </div>
            <button className="pf2-banner-btn" onClick={() => navigate('/ai-generation-inputform')}>
              <Plane size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
              새로운 여행 계획하기
            </button>
          </div>

          {/* 탭 */}
          <div className="pf2-tabs">
            {TABS.map(t => (
              <button
                key={t.key}
                className={`pf2-tab${activeTab === t.key ? ' active' : ''}`}
                onClick={() => setActiveTab(t.key)}
              >
                {t.label}
                {t.count > 0 && <span className="pf2-tab-count">{t.count}</span>}
              </button>
            ))}
          </div>

          {/* 카드 목록 */}
          <div className="pf2-cards">
            {loading ? (
              <div className="pf2-loading"><div className="pf2-spinner" /></div>
            ) : error ? (
              <div className="pf2-empty"><span style={{ fontSize: 13, color: '#ef4444' }}>{error}</span></div>
            ) : (
              <>
                {activeTab === 'flights' && (
                  data.flights.length > 0
                    ? data.flights.map(b => <FlightCard key={b.id} booking={b} onCancel={handleCancelFlight} showToast={showToast} />)
                    : <EmptyState tab="flights" />
                )}
                {activeTab === 'stays' && (
                  data.stays.length > 0
                    ? data.stays.map(b => <StayCard key={b.id} booking={b} onCancel={handleCancelStay} showToast={showToast} />)
                    : <EmptyState tab="stays" />
                )}
                {activeTab === 'plans' && (
                  data.plans.length > 0
                    ? data.plans.map(p => <PlanCard key={p.id} plan={p} onDelete={handleDeletePlan} showToast={showToast} />)
                    : <EmptyState tab="plans" />
                )}
              </>
            )}
          </div>

          {/* 최근 활동 */}
          {!loading && recentActivities.length > 0 && (
            <div className="pf2-activity">
              <div className="pf2-activity-title">최근 활동</div>
              {recentActivities.map((a, i) => (
                <div key={i} className="pf2-activity-item">
                  <div className="pf2-activity-icon" style={{ background: a.iconBg, color: a.iconColor }}>{a.icon}</div>
                  <div className="pf2-activity-body">
                    <div className="pf2-activity-text">{a.text}</div>
                    <div className="pf2-activity-time">{timeAgo(a.time)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <BottomNav />

      {/* ── 토스트 ── */}
      <div className={`pf2-toast-wrap${toast.show ? ' show' : ''}`}>
        <div className={`pf2-toast pf2-toast--${toast.type}`}>
          <div className="pf2-toast-icon-wrap">
            {toast.type === 'ok'      && <CheckCircle2 size={18} />}
            {toast.type === 'danger'  && <XCircle size={18} />}
            {toast.type === 'confirm' && <AlertCircle size={18} />}
          </div>
          <div className="pf2-toast-body">
            <div className="pf2-toast-title">{toast.title}</div>
            <div className="pf2-toast-msg">{toast.msg}</div>
            {toast.actions.length > 0 && (
              <div className="pf2-toast-actions">
                {toast.actions.map((a, i) => (
                  <button
                    key={i}
                    className={`pf2-toast-btn${a.primary ? ' primary' : ''}`}
                    onClick={() => handleToastAction(a.action)}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
