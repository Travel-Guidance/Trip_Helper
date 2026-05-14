// 스승의날 이스터에그 - 박보경 강사님 감사합니다 폭죽 & 하트 애니메이션
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import confetti from 'canvas-confetti'

const HEARTS = ['❤️', '💕', '💖', '💗', '💝', '🌹', '💓', '💞']
const COLORS = ['#ff69b4', '#ff1493', '#ff6347', '#ffd700', '#ff4500', '#c0392b', '#e91e63', '#f48fb1']
const Z = 10000  // 오버레이(9999) 위에 confetti 캔버스가 올라와야 함

function fire(opts) {
  confetti({ zIndex: Z, ...opts })
}

function launchRocket(x, burstY, delay) {
  setTimeout(() => {
    fire({
      particleCount: 12, angle: 90, spread: 6,
      origin: { x, y: 1.0 }, startVelocity: 80, ticks: 90,
      colors: ['#ffffff', '#fffbe6', '#ffe0b2'], gravity: 0.4, scalar: 0.7,
    })
    setTimeout(() => {
      fire({ particleCount: 120, spread: 360, origin: { x, y: burstY }, startVelocity: 28, ticks: 80, colors: COLORS, gravity: 0.8, scalar: 1.1 })
      fire({ particleCount: 40,  spread: 360, origin: { x, y: burstY }, startVelocity: 14, ticks: 120, colors: ['#ffffff', '#ffd700'], gravity: 0.5, scalar: 0.6 })
    }, 780)
  }, delay)
}

export default function TeachersDayEgg({ onClose }) {
  const launched = useRef(false)

  useEffect(() => {
    if (launched.current) return
    launched.current = true

    fire({ particleCount: 180, spread: 100, origin: { x: 0.5, y: 0.55 }, colors: COLORS, scalar: 1.3 })
    fire({ particleCount: 60,  spread: 100, origin: { x: 0.5, y: 0.55 }, colors: ['#fff', '#ffd700'], scalar: 0.7, ticks: 120 })

    const rockets = [
      [0.2,  0.18, 400],
      [0.8,  0.18, 600],
      [0.5,  0.10, 1000],
      [0.15, 0.22, 1500],
      [0.85, 0.22, 1700],
      [0.35, 0.12, 2200],
      [0.65, 0.12, 2400],
      [0.5,  0.08, 3000],
      [0.25, 0.15, 3400],
      [0.75, 0.15, 3600],
    ]
    rockets.forEach(([x, y, d]) => launchRocket(x, y, d))

    setTimeout(() => {
      fire({ particleCount: 150, spread: 360, origin: { x: 0.2, y: 0.3 }, colors: COLORS, startVelocity: 35, ticks: 100 })
      fire({ particleCount: 150, spread: 360, origin: { x: 0.8, y: 0.3 }, colors: COLORS, startVelocity: 35, ticks: 100 })
      fire({ particleCount: 100, spread: 360, origin: { x: 0.5, y: 0.2 }, colors: ['#fff', '#ffd700'], startVelocity: 25, ticks: 120 })
    }, 4200)

    const timer = setTimeout(onClose, 9000)
    return () => clearTimeout(timer)
  }, [onClose])

  const hearts = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    emoji: HEARTS[i % HEARTS.length],
    left: `${3 + (i * 4.7) % 92}%`,
    delay: `${(i * 0.22) % 2.5}s`,
    duration: `${2.8 + (i * 0.3) % 2}s`,
    size: `${1.2 + (i * 0.17) % 1.5}rem`,
  }))

  return createPortal(
    <div className="tde-overlay" onClick={onClose}>
      <div className="tde-inner" onClick={e => e.stopPropagation()}>
        <div className="tde-text">박보경 강사님<br />감사합니다</div>
        <div className="tde-sub">🎓 스승의 날을 진심으로 축하합니다 🎓</div>
        <button className="tde-close" onClick={onClose}>닫기</button>
      </div>
      <div className="tde-hearts" aria-hidden="true">
        {hearts.map(h => (
          <span key={h.id} className="tde-heart"
            style={{ left: h.left, animationDelay: h.delay, animationDuration: h.duration, fontSize: h.size }}>
            {h.emoji}
          </span>
        ))}
      </div>
    </div>,
    document.body
  )
}
