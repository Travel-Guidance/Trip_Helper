import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User } from 'lucide-react'
import { API_BASE } from '../api/config'
import { useAuth } from '../store/AuthContext'
import loginBg from '../assets/login_bg.png'
import { hasPendingPlanSaveAfterAuth, savePendingPlanAfterAuth } from '../utils/pendingPlanSave'

const DESTINATIONS = [
  { emoji: '🏖️', name: '보라카이', top: '12%',  right: '8%',  delay: '0s'   },
  { emoji: '🌴', name: '발리',     top: '55%',  left: '5%',   delay: '1.8s' },
  { emoji: '🐚', name: '몰디브',   bottom: '24%', right: '7%', delay: '1s'   },
  { emoji: '⛵', name: '산토리니', top: '34%',  left: '4%',   delay: '2.2s' },
  { emoji: '🌊', name: '세부',     bottom: '42%', right: '5%', delay: '0.7s' },
]

function Seagull({ style }) {
  return (
    <svg width="34" height="16" viewBox="0 0 34 16" fill="none" style={style}>
      <path d="M0 9 Q8.5 0 17 5.5 Q25.5 0 34 9" stroke="white" strokeWidth="1.6" strokeLinecap="round" fill="none" opacity="0.9" />
    </svg>
  )
}

export default function KakaoNicknameInput() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [kakaoUser, setKakaoUser] = useState(null)

  useEffect(() => {
    // URL에서 카카오 사용자 정보 가져오기
    const params = new URLSearchParams(window.location.search)
    const userData = params.get('user')
    if (userData) {
      try {
        setKakaoUser(JSON.parse(decodeURIComponent(userData)))
      } catch (err) {
        console.error('사용자 정보 파싱 오류:', err)
        navigate('/login')
      }
    } else {
      navigate('/login')
    }
  }, [navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      setError('닉네임을 입력해주세요.')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await fetch(`${API_BASE}/auth/kakao/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          kakaoId: kakaoUser.id,
          email: kakaoUser.email,
          name: name.trim()
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '오류가 발생했습니다.')
        return
      }

      login(data.user, data.token)
      const authSuccessPath = hasPendingPlanSaveAfterAuth() ? '/ai-generation-schedule' : '/home'
      try {
        if (hasPendingPlanSaveAfterAuth()) {
          await savePendingPlanAfterAuth()
        }
      } catch {
        setError('회원가입은 완료됐지만 일정 저장에 실패했습니다. 다시 시도해주세요.')
        return
      }
      navigate(authSuccessPath, { replace: true })
    } catch {
      setError('서버에 연결할 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!kakaoUser) return null

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

        .gull-1 { animation: seagull-1 18s linear infinite; }
        .gull-2 { animation: seagull-2 23s linear 6s infinite; }
        .gull-3 { animation: seagull-3 28s linear 12s infinite; }
        .badge  { animation: float-badge 4s ease-in-out infinite; }
        .appear { animation: card-appear .75s cubic-bezier(.22,1,.36,1) forwards; }

        .login-input::placeholder { color: rgba(30,80,130,.45); }
        .login-input:focus {
          border-color: rgba(14,116,144,.7) !important;
          background: rgba(255,255,255,.72) !important;
          outline: none;
        }
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
          <div style={{ background: 'rgba(255,255,255,.55)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)', border: '1px solid rgba(255,255,255,.75)', borderRadius: 28, padding: 32, boxShadow: '0 20px 60px rgba(0,40,80,.25), inset 0 1px 0 rgba(255,255,255,.8)' }}>

            {/* 제목 */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#0c3547', marginBottom: 8 }}>카카오 계정으로 가입</h2>
              <p style={{ fontSize: 13, color: '#0e7490', opacity: 0.8 }}>사용하실 닉네임을 입력해주세요</p>
            </div>

            {/* 폼 */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* 닉네임 */}
              <div>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#0e4f6e', paddingLeft: 2, display: 'block', marginBottom: 6, letterSpacing: '.3px' }}>닉네임</label>
                <div style={{ position: 'relative' }}>
                  <User style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', width: 15, height: 15, color: '#0e7490', pointerEvents: 'none' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="표시될 이름"
                    required
                    className="login-input"
                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,.6)', border: '1.5px solid rgba(14,116,144,.25)', borderRadius: 12, padding: '11px 14px 11px 38px', color: '#0c3547', fontSize: 14, fontFamily: 'inherit', transition: 'all .2s' }}
                  />
                </div>
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
                {loading ? '처리 중...' : '가입 완료'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  )
}
