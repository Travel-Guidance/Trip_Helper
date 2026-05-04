import { Link, useLocation } from 'react-router-dom'
import '../../styles/layout.css'

const TABS = [
  { label: '홈', icon: '🏠', to: '/home' },
  { label: 'AI 여행', icon: '✨', to: '/ai-travel' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <Link
          key={tab.to}
          to={tab.to}
          className={`bottom-nav-item${(tab.to === '/home' ? pathname === '/home' || pathname === '/' : pathname.startsWith(tab.to)) ? ' active' : ''}`}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
