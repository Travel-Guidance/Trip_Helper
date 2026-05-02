import { Link } from 'react-router-dom'

export default function Header({ tripType, onTripTypeChange }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link to="/" className="logo">폰가이즈</Link>
          <Link to="/esim" className="header-esim-link">eSIM</Link>
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
          <button className="btn-outline">회원 예약내역 →</button>
          <button className="btn-outline">비회원 예약내역 →</button>
        </div>
      </div>
    </header>
  )
}
