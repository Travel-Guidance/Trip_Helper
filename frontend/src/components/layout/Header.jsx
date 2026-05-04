import { Link, useNavigate } from 'react-router-dom'
import { Smartphone } from 'lucide-react'
import '../../styles/layout.css'

export default function Header({ tripType, onTripTypeChange, navLinks = [] }) {
  const navigate = useNavigate()

  return (
    <header className="header">
      <div className="header-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {/* 메인페이지와 동일한 로고 */}
          <button
            onClick={() => navigate('/home')}
            className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
              <Smartphone className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">폰가이즈</span>
          </button>

          {/* 페이지별 네비 링크 */}
          {navLinks.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="relative text-sm font-medium text-gray-600 px-3 py-1.5 rounded-lg transition-all duration-200 hover:text-gray-900 hover:bg-gray-50 group"
            >
              {label}
              <span className="absolute bottom-0.5 left-3 right-3 h-[2px] bg-gradient-to-r from-blue-600 to-purple-600 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-200 origin-left" />
            </Link>
          ))}

          {onTripTypeChange && (
            <div className="trip-tabs">
              {['round', 'one_way'].map((type, i) => (
                <button
                  key={type}
                  className={`trip-tab${tripType === type ? ' active' : ''}`}
                  onClick={() => onTripTypeChange(type)}
                >
                  {i === 0 ? '왕복' : '편도'}
                </button>
              ))}
              <button className="trip-tab">다구간</button>
            </div>
          )}
        </div>

        <div className="header-right">
          <button className="btn-outline">내 예약내역</button>
        </div>
      </div>
    </header>
  )
}
