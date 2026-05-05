import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Smartphone, Menu, X } from 'lucide-react'
import CTASection from '../main/CTASection'

const NAV_LINKS = [
  { label: '항공권', to: '/flights' },
  { label: 'eSIM', to: '/esim' },
  { label: '숙소', to: '/accommodation' },
  { label: '투어 및 액티비티', to: '/tour-ticket' },
]

function NavLink({ to, children }) {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const isActive = to === '/' ? pathname === '/' : pathname.startsWith(to)

  return (
    <a
      href={to}
      onClick={e => { e.preventDefault(); navigate(to) }}
      className={`relative text-sm font-medium px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-gray-50 group ${
        isActive ? 'text-sky-600' : 'text-gray-600'
      }`}
    >
      {children}
      <span className={`absolute bottom-0.5 left-3 right-3 h-[2px] bg-sky-500 rounded-full transition-transform duration-200 origin-left ${
        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
      }`} />
    </a>
  )
}

export default function Navbar() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [showStartCard, setShowStartCard] = useState(false)

  const openStartCard = () => {
    setOpen(false)
    setShowStartCard(true)
  }

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center shadow-sm">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">폰가이즈</span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink key={to} to={to}>{label}</NavLink>
            ))}
            <button
              onClick={() => navigate('/login')}
              className="relative text-sm font-medium text-gray-600 px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-gray-50 ml-2"
            >
              로그인
            </button>
            <button
              onClick={openStartCard}
              className="ml-3 bg-sky-500 text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-md shadow-sky-100 hover:bg-sky-400 hover:shadow-lg hover:shadow-sky-200 hover:scale-[1.03] active:scale-95 transition-all duration-200"
            >
              시작하기
            </button>
          </div>

          <button
            className="md:hidden p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setOpen(v => !v)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-1">
            {NAV_LINKS.map(({ label, to }) => (
              <NavLink key={to} to={to}>{label}</NavLink>
            ))}
            <button
              onClick={() => navigate('/login')}
              className="text-left text-sm font-medium text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              로그인
            </button>
            <button
              onClick={openStartCard}
              className="w-full bg-sky-500 text-white text-sm font-semibold py-3 rounded-full mt-2 shadow-md shadow-sky-100 hover:bg-sky-400 hover:shadow-lg transition-all"
            >
              시작하기
            </button>
          </div>
        )}
      </nav>

      {showStartCard && (
        <CTASection modal onClose={() => setShowStartCard(false)} />
      )}
    </>
  )
}

