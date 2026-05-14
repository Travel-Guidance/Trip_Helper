import { useState, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Smartphone, Mail, Lock, Eye, EyeOff, User } from 'lucide-react'
import loginBg from '../assets/login_bg.png'
import { API_BASE } from '../api/config'
import { useAuth } from '../store/AuthContext'
import { hasPendingPlanSaveAfterAuth, savePendingPlanAfterAuth } from '../utils/pendingPlanSave'

const DESTINATIONS = [
  { emoji: '🏖️', name: '보라카이', top: '12%',  right: '8%',  delay: '0s'   },
  { emoji: '🌴', name: '발리',     top: '55%',  left: '5%',   delay: '1.8s' },
  { emoji: '🐚', name: '몰디브',   bottom: '24%', right: '7%', delay: '1s'   },
  { emoji: '⛵', name: '산토리니', top: '34%',  left: '4%',   delay: '2.2s' },
  { emoji: '🌊', name: '세부',     bottom: '42%', right: '5%', delay: '0.7s' },
]

const KAKAO_AUTH_URL = `${API_BASE}/auth/kakao/start`
const GOOGLE_AUTH_URL = `${API_BASE}/auth/google/start`

function getAuthSuccessPath() {
  return hasPendingPlanSaveAfterAuth() ? '/ai-generation-schedule' : '/home'
}

function Seagull({ style }) {
  return (
    <svg width="34" height="16" viewBox="0 0 34 16" fill="none" style={style}>
      <path d="M0 9 Q8.5 0 17 5.5 Q25.5 0 34 9" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.9" />
    </svg>
  )
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [name, setName]         = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [tab, setTab]           = useState(() => location.state?.tab === 'signup' ? 'signup' : 'login')
  const [animDir, setAnimDir]   = useState('right')
  const [animKey, setAnimKey]   = useState(0)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const prevTab = useRef('login')

  const switchTab = (next) => {
    if (next === tab) return
    setAnimDir(next === 'signup' ? 'right' : 'left')
    prevTab.current = tab
    setTab(next)
    setAnimKey(k => k + 1)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = tab === 'login' ? '/auth/login' : '/auth/signup'
      const body = tab === 'login'
        ? { email, password }
        : { email, password, name }

      const res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '오류가 발생했습니다.')
        return
      }

      login(data.user, data.token)
      const authSuccessPath = getAuthSuccessPath()
      try {
        if (hasPendingPlanSaveAfterAuth()) {
          await savePendingPlanAfterAuth()
        }
      } catch {
        setError('로그인은 완료됐지만 일정 저장에 실패했습니다. 다시 시도해주세요.')
        return
      }
      navigate(authSuccessPath, { replace: true })
    } catch {
      setError('서버에 연결할 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        @keyframes seagull-1 {
          from { transform: translate(-80px, 0); opacity: 0; }
          5%   { opacity: 1; } 95% { opacity: 1; }
          to   { transform: translate(110vw, -50px); opacity: 0; }
        }
        @keyframes seagull-2 {
          from { transform: translate(-60px, 0); opacity: 0; }
          5%   { opacity: .85; } 95% { opacity: .85; }
          to   { transform: translate(110vw, 25px); opacity: 0; }
        }
        @keyframes seagull-3 {
          from { transform: translate(-50px, 0); opacity: 0; }
          5%   { opacity: .65; } 95% { opacity: .65; }
          to   { transform: translate(110vw, -15px); opacity: 0; }
        }
        @keyframes float-badge {
          0%, 100% { transform: translateY(0); }
          50%       { transform: translateY(-9px); }
        }
        @keyframes card-appear {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tab-from-right {
          from { opacity: 0; transform: translateX(22px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes tab-from-left {
          from { opacity: 0; transform: translateX(-22px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        .gull-1 { animation: seagull-1 18s linear infinite; }
        .gull-2 { animation: seagull-2 23s linear 6s infinite; }
        .gull-3 { animation: seagull-3 28s linear 12s infinite; }
        .badge  { animation: float-badge 4s ease-in-out infinite; }
        .appear { animation: card-appear .75s cubic-bezier(.22,1,.36,1) forwards; }

        .tab-from-right { animation: tab-from-right .28s cubic-bezier(.22,1,.36,1) forwards; }
        .tab-from-left  { animation: tab-from-left  .28s cubic-bezier(.22,1,.36,1) forwards; }

        .login-input::placeholder { color: rgba(30,80,130,.45); }
        .login-input:focus {
          border-color: rgba(14,116,144,.7) !important;
          background: rgba(255,255,255,.72) !important;
          outline: none;
        }
        .social-btn:hover { filter: brightness(1.06); transform: translateY(-1px); }
        .social-btn { transition: filter .18s, transform .18s, box-shadow .18s; }
        .tab-btn-active   { background: white !important; color: #0e7490 !important; box-shadow: 0 2px 10px rgba(0,0,0,.12); }
        .tab-btn-inactive { background: transparent !important; color: rgba(14,116,144,.6) !important; }
      `}</style>

      <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4">

        {/* 배경 */}
        <img src={loginBg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,30,60,.45) 0%, rgba(0,20,50,.15) 40%, rgba(0,20,50,.15) 60%, rgba(0,30,60,.45) 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 180, background: 'linear-gradient(to top, rgba(0,40,80,.5), transparent)' }} />

        {/* 갈매기 */}
        <div className="absolute gull-1" style={{ top: '18%' }}><Seagull /></div>
        <div className="absolute gull-2" style={{ top: '26%' }}><Seagull style={{ transform: 'scale(.7)' }} /></div>
        <div className="absolute gull-3" style={{ top: '22%' }}><Seagull style={{ transform: 'scale(.5)' }} /></div>

        {/* 여행지 배지 */}
        {DESTINATIONS.map(d => (
          <div key={d.name} className="badge absolute hidden md:block" style={{ top: d.top, bottom: d.bottom, left: d.left, right: d.right, animationDelay: d.delay }}>
            <div style={{ background: 'rgba(255,255,255,.22)', backdropFilter: 'blur(14px)', border: '1px solid rgba(255,255,255,.45)', borderRadius: 16, padding: '7px 13px', color: 'white', fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 16px rgba(0,0,0,.15)', textShadow: '0 1px 4px rgba(0,0,0,.3)' }}>
              <span>{d.emoji}</span><span>{d.name}</span>
            </div>
          </div>
        ))}

        {/* 카드 */}
        <div className="relative z-10 w-full max-w-[410px] appear">

          {/* 회원가입 없이 시작 */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <button
              onClick={() => navigate('/home')}
              style={{ background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', border: '1.5px solid rgba(255,255,255,0.45)', borderRadius: 24, padding: '10px 28px', color: 'white', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', letterSpacing: '0.2px', textShadow: '0 1px 4px rgba(0,0,0,0.3)', transition: 'background 0.2s, transform 0.15s', boxShadow: '0 4px 16px rgba(0,0,0,0.15)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.28)'; e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.18)'; e.currentTarget.style.transform = 'translateY(0)' }}
            >
              회원가입 없이 시작 →
            </button>
          </div>

          {/* 카드 본체 */}
          <div style={{ background: 'rgba(255,255,255,.55)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,.75)', borderRadius: 28, padding: 32, boxShadow: '0 20px 60px rgba(0,40,80,.25), inset 0 1px 0 rgba(255,255,255,.8)', overflow: 'hidden' }}>

            {/* 탭 */}
            <div style={{ display: 'flex', background: 'rgba(14,116,144,.08)', borderRadius: 14, padding: 4, marginBottom: 24, border: '1px solid rgba(14,116,144,.12)' }}>
              {[['login', '로그인'], ['signup', '회원가입']].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => switchTab(key)}
                  className={tab === key ? 'tab-btn-active' : 'tab-btn-inactive'}
                  style={{ flex: 1, padding: '9px 0', borderRadius: 10, fontSize: 14, fontWeight: 600, transition: 'all .2s', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 폼 — animKey 바뀔 때마다 애니메이션 재생 */}
            <form
              key={animKey}
              onSubmit={handleSubmit}
              className={animDir === 'right' ? 'tab-from-right' : 'tab-from-left'}
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {/* 닉네임 — 회원가입 탭에서만 표시 */}
              {tab === 'signup' && (
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#0e4f6e', paddingLeft: 2, display: 'block', marginBottom: 6, letterSpacing: '.3px' }}>닉네임</label>
                  <div style={{ position: 'relative' }}>
                    <User style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#0e7490', pointerEvents: 'none' }} />
                    <input
                      type="text" value={name} onChange={e => setName(e.target.value)}
                      placeholder="표시될 이름" required={tab === 'signup'} className="login-input"
                      style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.6)', border: '1.5px solid rgba(14,116,144,.25)', borderRadius: 12, padding: '11px 14px 11px 38px', color: '#0c3547', fontSize: 14, fontFamily: 'inherit', transition: 'all .2s' }}
                    />
                  </div>
                </div>
              )}

              {/* 이메일 */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#0e4f6e', paddingLeft: 2, display: 'block', marginBottom: 6, letterSpacing: '.3px' }}>이메일</label>
                <div style={{ position: 'relative' }}>
                  <Mail style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#0e7490', pointerEvents: 'none' }} />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="email@example.com" required className="login-input"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.6)', border: '1.5px solid rgba(14,116,144,.25)', borderRadius: 12, padding: '11px 14px 11px 38px', color: '#0c3547', fontSize: 14, fontFamily: 'inherit', transition: 'all .2s' }}
                  />
                </div>
              </div>

              {/* 비밀번호 */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#0e4f6e', paddingLeft: 2, display: 'block', marginBottom: 6, letterSpacing: '.3px' }}>비밀번호</label>
                <div style={{ position: 'relative' }}>
                  <Lock style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#0e7490', pointerEvents: 'none' }} />
                  <input
                    type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required className="login-input"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.6)', border: '1.5px solid rgba(14,116,144,.25)', borderRadius: 12, padding: '11px 42px 11px 38px', color: '#0c3547', fontSize: 14, fontFamily: 'inherit', transition: 'all .2s' }}
                  />
                  <button type="button" onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: 13, top: '50%', transform: 'translateY(-50%)', color: '#0e7490', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
                    {showPw ? <EyeOff style={{ width: 15, height: 15 }} /> : <Eye style={{ width: 15, height: 15 }} />}
                  </button>
                </div>
              </div>

              {/* 비밀번호 찾기 — 항상 공간 유지, login 아닐 때 invisible */}
              <div style={{ textAlign: 'right', marginTop: -4, visibility: tab === 'login' ? 'visible' : 'hidden' }}>
                <button type="button" style={{ fontSize: 12, color: '#0e7490', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  비밀번호를 잊으셨나요?
                </button>
              </div>

              {error && (
                <p style={{ fontSize: 13, color: '#dc2626', background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 10, padding: '9px 13px', margin: 0 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', background: loading ? 'rgba(14,116,144,.5)' : 'linear-gradient(135deg,#0ea5e9,#0e7490)', color: 'white', fontWeight: 700, fontSize: 15, padding: '13px 0', borderRadius: 14, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', marginTop: 4, boxShadow: '0 8px 24px rgba(14,116,144,.4)', transition: 'transform .15s, box-shadow .15s', fontFamily: 'inherit' }}
                onMouseEnter={e => { if (!loading) { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(14,116,144,.55)' } }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(14,116,144,.4)' }}
              >
                {loading ? '처리 중...' : tab === 'login' ? '로그인' : '회원가입'}
              </button>
            </form>

            {/* 구분선 */}
            <div style={{ position: 'relative', margin: '22px 0' }}>
              <div style={{ height: 1, background: 'rgba(14,116,144,.15)' }} />
              <span style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: 'rgba(255,255,255,0)', padding: '0 10px', fontSize: 11, color: 'rgba(14,80,110,.55)', whiteSpace: 'nowrap' }}>
                또는 소셜 계정으로
              </span>
            </div>

            {/* 소셜 버튼 */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {/* 카카오 — ocean glass */}
              <a href={KAKAO_AUTH_URL}>
              <button
                type="button" className="social-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'rgba(14,116,144,.13)', border: '1.5px solid rgba(14,116,144,.3)', borderRadius: 12, padding: '11px 0', color: '#0a3d52', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(14,116,144,.12)' }}
              >
                <span style={{ fontSize: 16 }}>💬</span> 카카오로 시작하기
              </button>
              </a>

              {/* 구글 — light glass */}
              <a href={GOOGLE_AUTH_URL}>
              <button
                type="button" className="social-btn"
                style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'rgba(255,255,255,.45)', border: '1.5px solid rgba(14,116,144,.2)', borderRadius: 12, padding: '11px 0', color: '#1a4a5e', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 2px 10px rgba(0,40,80,.08)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                구글로 시작하기
              </button>
              </a>
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,.7)', marginTop: 18, textShadow: '0 1px 4px rgba(0,0,0,.4)' }}>
            {tab === 'login' ? '계정이 없으신가요?' : '이미 계정이 있으신가요?'}{' '}
            <button
              onClick={() => switchTab(tab === 'login' ? 'signup' : 'login')}
              style={{ color: 'white', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
            >
              {tab === 'login' ? '회원가입' : '로그인'}
            </button>
          </p>
        </div>
      </div>
    </>
  )
}
