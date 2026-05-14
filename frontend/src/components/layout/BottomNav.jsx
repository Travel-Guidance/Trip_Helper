import { Link, useLocation } from 'react-router-dom'
import { Home, Sparkles } from 'lucide-react'
import '../../styles/layout.css'

const TABS = [
  { label: '홈',    Icon: Home,     to: '/home',                  match: p => p === '/home' || p === '/' },
  { label: 'AI 여행', Icon: Sparkles, to: '/ai-generation-inputform', match: p => p.startsWith('/ai-generation') || p.startsWith('/ai-travel-duration') || p.startsWith('/ai-collab') },
]

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav">
      {TABS.map(tab => (
        <Link
          key={tab.to}
          to={tab.to}
          className={`bottom-nav-item${tab.match(pathname) ? ' active' : ''}`}
        >
          <span className="bottom-nav-icon"><tab.Icon size={22} /></span>
          <span className="bottom-nav-label">{tab.label}</span>
        </Link>
      ))}
    </nav>
  )
}
