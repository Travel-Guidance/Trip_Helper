import { useState, useEffect, useCallback } from 'react'
import Navbar from '../layout/Navbar'
import BottomNav from '../layout/BottomNav'
import banner1 from '../../assets/my_info1.png'
import banner2 from '../../assets/my_info2.png'
import banner3 from '../../assets/my_info3.png'
import banner4 from '../../assets/my_info4.png'

const SLIDES = [banner1, banner2, banner3, banner4]

const FEATURES = [
  { icon: '📞', sub: '문제상황 완벽대응', main: '24시간 안심 고객센터' },
  { icon: '🛡️', sub: '제품 결함시', main: '100% 환불 보장' },
  { icon: '📶', sub: '끊김없는 데이터', main: '뛰어난 데이터 안정성' },
  { icon: '🎁', sub: '센스있는 여행 선물', main: '간편한 선물하기 기능' },
]

const BARCODE = [3,1,2,3,1,2,1,3,2,1,2,3,1,3,2,1,2,1,3,2,1,3,1,2,3,1,2,1,3,2]

export default function ESimStepLanding({ onNext }) {
  const [showModal, setShowModal] = useState(false)
  const [current, setCurrent] = useState(0)

  const next = useCallback(() => setCurrent(c => (c + 1) % SLIDES.length), [])
  const prev = () => setCurrent(c => (c - 1 + SLIDES.length) % SLIDES.length)

  useEffect(() => {
    const id = setInterval(next, 4000)
    return () => clearInterval(id)
  }, [next])

  return (
    <div className="esim-page">
      <Navbar />

      {/* 상단 알림바 */}
      <div className="esim-notice-bar">
        <span className="esim-notice-left">
          <span className="esim-notice-icon">ⓘ</span>
          잠깐! 이용 가능 기기인가요?
        </span>
        <span className="esim-notice-link" onClick={() => setShowModal(true)}>
          이용 가능 기기 &gt;
        </span>
      </div>

      <div className="esim-container">

        {/* Hero 카드 */}
        <div className="esim-hero-card">
          <div className="esim-hero-text">
            <p>1분 만에 나에게 맞는</p>
            <p>eSIM을 찾아보세요</p>
          </div>
          <button className="esim-cta-btn" onClick={onNext}>
            나에게 맞는 eSIM 찾기
          </button>
        </div>

        {/* 캐러셀 */}
        <div className="esim-carousel">
          <div className="esim-carousel-track">
            <div
              className="esim-carousel-inner"
              style={{ transform: `translateX(-${current * 100}%)` }}
            >
              {SLIDES.map((src, i) => (
                <div key={i} className="esim-slide">
                  <img src={src} alt={`배너 ${i + 1}`} />
                </div>
              ))}
            </div>
          </div>
          <button className="esim-carousel-btn esim-carousel-prev" onClick={prev}>‹</button>
          <button className="esim-carousel-btn esim-carousel-next" onClick={next}>›</button>
          <div className="esim-carousel-dots">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                className={`esim-carousel-dot${i === current ? ' active' : ''}`}
                onClick={() => setCurrent(i)}
              />
            ))}
          </div>
          <div className="esim-carousel-counter">{current + 1}/{SLIDES.length}</div>
        </div>

        {/* 왜 섹션 */}
        <div className="esim-why-section">
          <h2 className="esim-why-title">
            왜 eSIM은 <strong>폰가이즈</strong>일까요?
          </h2>
          <div className="esim-why-card">
            {FEATURES.map(f => (
              <div key={f.main} className="esim-why-item">
                <span className="esim-why-icon">{f.icon}</span>
                <div className="esim-why-text">
                  <div className="esim-why-sub">{f.sub}</div>
                  <div className="esim-why-main">{f.main}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="esim-why-note">김솔민짱짱123</p>
        </div>

      </div>

      {/* Bottom Sheet 모달 */}
      {showModal && (
        <div className="esim-sheet-overlay" onClick={() => setShowModal(false)}>
          <div className="esim-bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="esim-sheet-handle" />
            <div className="esim-sheet-header">
              <span className="esim-sheet-title">이용 가능 기기</span>
              <button className="esim-sheet-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <div className="esim-sheet-body">
              <div className="esim-device-brand">Samsung</div>
              <ul className="esim-device-list">
                <li>Z Fold 7, Z Fold 6, Z Flip 7, Z Flip 6, Z Fold 5, Z Fold 4, Z Flip 4</li>
                <li>S23 Series, S24 Series, S25 Series</li>
              </ul>

              <div className="esim-device-brand">Apple</div>
              <ul className="esim-device-list">
                <li>iPhone XR, iPhone XS, iPhone XS Max</li>
                <li>iPhone SE (2세대), iPhone SE (3세대)</li>
                <li>iPhone 11 Series, iPhone 12 Series, iPhone 13 Series,<br />
                    iPhone 14 Series, iPhone 15 Series, iPhone 16 Series, iPhone 17 Series</li>
              </ul>

              <div className="esim-device-note">
                출시 국가가 중국 본토, 홍콩, 마카오인 기기는 eSIM을 지원하지 않아요.
                (단, iPhone 13 Mini, iPhone 12 Mini, iPhone SE 2020 및 iPhone XS는 지원됨)
              </div>

              <div className="esim-device-brand" style={{ marginTop: 20 }}>가능한 기종인지 확인하기</div>
              <p className="esim-check-tip">
                · 전화 키패드 &gt; *#06# 입력 &gt; "EID"가 있다면 사용 가능!
              </p>

              <div className="esim-check-cards">
                <div className="esim-dialpad-card">
                  <div className="esim-dialpad-screen">*#06#</div>
                  <div className="esim-dialpad-grid">
                    {[1,2,3,4,5,6,7,8,9,'*',0,'#'].map(k => (
                      <div key={k} className="esim-dialpad-key">{k}</div>
                    ))}
                  </div>
                </div>
                <div className="esim-eid-card">
                  <div className="esim-eid-top-label">기기 정보</div>
                  <div className="esim-eid-label">EID</div>
                  <div className="esim-eid-number">892832441535345423423423423234235</div>
                  <div className="esim-barcode">
                    {BARCODE.map((w, i) => (
                      <div
                        key={i}
                        className="esim-barcode-bar"
                        style={{ width: w, opacity: i % 2 === 0 ? 1 : 0 }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
