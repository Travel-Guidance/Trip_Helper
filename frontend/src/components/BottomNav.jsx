import { Link, useLocation } from 'react-router-dom'

const TABS = [
  { label: '홈', icon: '🏠', to: '/' },
  { label: 'AI 여행', icon: '✨', to: '/ai-travel' },
  { label: '항공권', icon: '✈️', to: '/flights' },
  { label: 'eSIM', icon: '📱', to: '/esim' },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <Link
          key={tab.to}
          to={tab.to}
          className={`bottom-nav-item${pathname === tab.to ? ' active' : ''}`}
        >
          <span className="bottom-nav-icon">{tab.icon}</span>
          <span className="bottom-nav-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
