import { Link, useNavigate } from 'react-router-dom'
import { Smartphone } from 'lucide-react'
import '../../styles/layout.css'

export default function Header({ tripType, onTripTypeChange, navLinks = [] }) {
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="header-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center shadow-sm">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">폰가이즈</span>
          </button>

          {navLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="relative text-sm font-medium text-gray-600 px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-gray-50 group"
            >
              {label}
              <span className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-sky-500 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </Link>
          ))}

          {onTripTypeChange && (
            <div className="trip-tabs">
              {[
                { value: 'round', label: '왕복' },
                { value: 'one_way', label: '편도' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  className={`trip-tab${tripType === value ? ' active' : ''}`}
                  onClick={() => onTripTypeChange(value)}
                >
                  {label}
                </button>
              ))}
              <button className="trip-tab">다구간</button>
            </div>
          )}
        </div>

        <div className="header-right">
          <button className="btn-outline">예약내역</button>
        </div>
      </div>
    </header>
  )
}
