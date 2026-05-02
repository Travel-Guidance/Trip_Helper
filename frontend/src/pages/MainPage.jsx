import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/BottomNav'
import img1 from '../assets/img1.png'
import img2 from '../assets/img2.png'
import img3 from '../assets/img3.png'
import img4 from '../assets/img4.png'
import img5 from '../assets/img5.png'

const SLIDES = [img1, img2, img3, img4, img5]

const CATEGORIES = [
  { icon: '✨', label: 'AI 여행', to: '/ai-travel' },
  { icon: '✈️', label: '항공권', to: '/flights' },
  { icon: '📱', label: 'eSIM', to: '/esim' },
  { icon: '🏨', label: '숙소', to: null },
  { icon: '🎡', label: '투어·티켓', to: null },
  { icon: '🧳', label: '패키지', to: null },
  { icon: '🛡️', label: '여행보험', to: null },
]

const SERVICES = [
  { icon: '✨', title: 'AI 여행 짜기', desc: '목적지·인원·스타일 입력하면\nAI가 일정을 완성해줘요', to: '/ai-travel', badge: '준비중' },
  { icon: '✈️', title: '항공권 검색', desc: '최저가 항공권을\n한번에 비교하세요', to: '/flights' },
  { icon: '📱', title: 'eSIM 구매', desc: '70개국 해외 데이터\n도착하자마자 바로 연결', to: '/esim' },
]

export default function MainPage() {
  const navigate = useNavigate()
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), [])
  const prev = () => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length)

  useEffect(() => {
    const t = setInterval(next, 4000)
    return () => clearInterval(t)
  }, [next])

  return (
    <div className="mp-page">

      {/* ── Header ── */}
      <header className="mp-header">
        <span className="mp-logo">Phone Guides</span>
        <div className="mp-search-bar">
          <span className="mp-search-icon">🔍</span>
          <span className="mp-search-placeholder">어디로 떠나고 싶으세요?</span>
        </div>
        <button className="mp-login-btn">로그인 및 회원가입</button>
      </header>

      {/* ── Category Nav ── */}
      <nav className="mp-categories">
        {CATEGORIES.map((cat, i) => (
          <button
            key={i}
            className={`mp-cat-item${!cat.to ? ' mp-cat-item--dim' : ''}`}
            onClick={() => cat.to && navigate(cat.to)}
          >
            <span className="mp-cat-icon">{cat.icon}</span>
            <span className="mp-cat-label">{cat.label}</span>
          </button>
        ))}
      </nav>

      {/* ── Sub Tabs ── */}
      <div className="mp-subtabs">
        <button className="mp-subtab active">홈</button>
      </div>

      {/* ── Hero Carousel ── */}
      <div className="mp-carousel">
        <div
          className="mp-carousel-track"
          style={{ transform: `translateX(-${current * 100}%)` }}
        >
          {SLIDES.map((src, i) => (
            <img key={i} src={src} alt={`슬라이드 ${i + 1}`} className="mp-carousel-img" />
          ))}
        </div>

        <button className="mp-carousel-btn mp-carousel-btn--prev" onClick={prev}>‹</button>
        <button className="mp-carousel-btn mp-carousel-btn--next" onClick={next}>›</button>

        <div className="mp-carousel-counter">{current + 1} / {SLIDES.length}</div>
      </div>

      {/* ── Service Cards ── */}
      <section className="mp-services">
        <h2 className="mp-section-title">서비스</h2>
        <div className="mp-service-grid">
          {SERVICES.map(s => (
            <button key={s.to} className="mp-service-card" onClick={() => navigate(s.to)}>
              <div className="mp-service-icon">{s.icon}</div>
              <div className="mp-service-body">
                <div className="mp-service-top">
                  <span className="mp-service-title">{s.title}</span>
                  {s.badge && <span className="mp-service-badge">{s.badge}</span>}
                </div>
                <span className="mp-service-desc">{s.desc}</span>
              </div>
              <span className="mp-service-arrow">›</span>
            </button>
          ))}
        </div>
      </section>

      <BottomNav />
    </div>
  )
}
