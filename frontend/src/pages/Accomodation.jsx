import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import BottomNav from '../components/layout/BottomNav'
import Navbar from '../components/layout/Navbar'
import { DEST_DATA, POPULAR_REGIONS } from '../data/destinations'
import { formatKrwPrice } from '../utils/currency'
import { searchStays } from '../api/accomodationApi'
import '../styles/accommodation.css'

/* ── 여행지 메타 ── */
const DESTINATIONS = [
  { key: null,         flag: null,  label: '전체보기',   city: '',          photo: null },
  { key: '일본',       flag: 'jp',  label: '일본',       city: '도쿄 · 오사카', photo: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=300&q=80' },
  { key: '태국',       flag: 'th',  label: '태국',       city: '방콕',         photo: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=300&q=80' },
  { key: '프랑스',     flag: 'fr',  label: '프랑스',     city: '파리',         photo: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=300&q=80' },
  { key: '인도네시아', flag: 'id',  label: '인도네시아', city: '발리',         photo: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=300&q=80' },
  { key: '싱가포르',   flag: 'sg',  label: '싱가포르',   city: '마리나베이',   photo: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=300&q=80' },
  { key: '미국',       flag: 'us',  label: '미국',       city: '뉴욕',         photo: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=300&q=80' },
  { key: '영국',       flag: 'gb',  label: '영국',       city: '런던',         photo: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&q=80' },
]

const COUNTRIES_ORDER = ['일본', '태국', '프랑스', '인도네시아', '싱가포르', '미국', '영국']

/* ── Mock 데이터 (초기 로드용) ── */
const MOCK_HOTELS = {
  '일본': [
    { id: 'jp1', name: 'The Peninsula Tokyo', location: '도쿄 · 마루노우치', rating: 5, price: 450000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80', tag: '인기' },
    { id: 'jp2', name: 'Park Hyatt Tokyo', location: '도쿄 · 신주쿠', rating: 5, price: 380000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&q=80', tag: null },
    { id: 'jp3', name: 'Aman Tokyo', location: '도쿄 · 오테마치', rating: 5, price: 620000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&q=80', tag: null },
    { id: 'jp4', name: 'Hotel Gracery Shinjuku', location: '도쿄 · 신주쿠', rating: 3, price: 120000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80', tag: null },
    { id: 'jp5', name: 'Dormy Inn Akihabara', location: '도쿄 · 아키하바라', rating: 3, price: 95000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&q=80', tag: null },
    { id: 'jp6', name: 'The Ritz-Carlton Osaka', location: '오사카 · 우메다', rating: 5, price: 410000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=300&q=80', tag: null },
    { id: 'jp7', name: 'Cross Hotel Osaka', location: '오사카 · 난바', rating: 4, price: 155000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&q=80', tag: null },
  ],
  '태국': [
    { id: 'th1', name: 'Mandarin Oriental Bangkok', location: '방콕 · 차오프라야', rating: 5, price: 320000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300&q=80', tag: '인기' },
    { id: 'th2', name: 'The Peninsula Bangkok', location: '방콕 · 차오프라야', rating: 5, price: 280000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80', tag: null },
    { id: 'th3', name: 'Capella Bangkok', location: '방콕 · 차오프라야', rating: 5, price: 490000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=300&q=80', tag: null },
    { id: 'th4', name: 'Centara Grand CentralWorld', location: '방콕 · 시암', rating: 4, price: 150000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&q=80', tag: null },
    { id: 'th5', name: 'ibis Bangkok Sukhumvit', location: '방콕 · 수쿰빗', rating: 3, price: 75000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80', tag: null },
    { id: 'th6', name: 'Rosewood Bangkok', location: '방콕 · 플런칫', rating: 5, price: 420000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&q=80', tag: null },
    { id: 'th7', name: 'Chatrium Hotel Riverside', location: '방콕 · 야와랏', rating: 4, price: 130000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&q=80', tag: null },
  ],
  '프랑스': [
    { id: 'fr1', name: 'Four Seasons Hotel George V', location: '파리 · 샹젤리제', rating: 5, price: 750000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&q=80', tag: '인기' },
    { id: 'fr2', name: 'Le Bristol Paris', location: '파리 · 포부르 생토노레', rating: 5, price: 680000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80', tag: null },
    { id: 'fr3', name: 'Hôtel Plaza Athénée', location: '파리 · 몽테뉴 거리', rating: 5, price: 820000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=300&q=80', tag: null },
    { id: 'fr4', name: 'Hotel Lutetia', location: '파리 · 생제르맹데프레', rating: 5, price: 520000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&q=80', tag: null },
    { id: 'fr5', name: 'Hôtel du Louvre', location: '파리 · 루브르', rating: 4, price: 280000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&q=80', tag: null },
    { id: 'fr6', name: 'Novotel Paris Centre Tour Eiffel', location: '파리 · 에펠탑', rating: 4, price: 210000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=300&q=80', tag: null },
    { id: 'fr7', name: 'ibis Paris Gare de Lyon', location: '파리 · 리옹역', rating: 3, price: 110000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80', tag: null },
  ],
  '인도네시아': [
    { id: 'id1', name: 'Four Seasons Resort Bali at Sayan', location: '발리 · 우붓', rating: 5, price: 480000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=300&q=80', tag: '인기' },
    { id: 'id2', name: 'COMO Uma Canggu', location: '발리 · 짱구', rating: 5, price: 420000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=300&q=80', tag: null },
    { id: 'id3', name: 'Alaya Resort Ubud', location: '발리 · 우붓', rating: 5, price: 350000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80', tag: null },
    { id: 'id4', name: 'W Bali - Seminyak', location: '발리 · 스미냑', rating: 5, price: 390000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=300&q=80', tag: null },
    { id: 'id5', name: 'The Layar Seminyak', location: '발리 · 스미냑', rating: 4, price: 220000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=300&q=80', tag: null },
    { id: 'id6', name: 'Aloft Bali Seminyak', location: '발리 · 스미냑', rating: 4, price: 140000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&q=80', tag: null },
    { id: 'id7', name: 'Komaneka at Bisma', location: '발리 · 우붓', rating: 5, price: 560000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&q=80', tag: null },
  ],
  '싱가포르': [
    { id: 'sg1', name: 'Marina Bay Sands', location: '싱가포르 · 마리나베이', rating: 5, price: 580000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=300&q=80', tag: '인기' },
    { id: 'sg2', name: 'Capella Singapore', location: '싱가포르 · 센토사', rating: 5, price: 680000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80', tag: null },
    { id: 'sg3', name: 'The Fullerton Hotel', location: '싱가포르 · CBD', rating: 5, price: 420000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&q=80', tag: null },
    { id: 'sg4', name: 'Raffles Hotel Singapore', location: '싱가포르 · 시티홀', rating: 5, price: 750000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=300&q=80', tag: null },
    { id: 'sg5', name: 'Pan Pacific Singapore', location: '싱가포르 · 마리나', rating: 5, price: 350000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=300&q=80', tag: null },
    { id: 'sg6', name: 'Hotel Indigo Singapore Katong', location: '싱가포르 · 카통', rating: 4, price: 210000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&q=80', tag: null },
    { id: 'sg7', name: 'ibis Singapore on Bencoolen', location: '싱가포르 · 부기스', rating: 3, price: 120000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80', tag: null },
  ],
  '미국': [
    { id: 'us1', name: 'The Plaza Hotel', location: '뉴욕 · 센트럴파크', rating: 5, price: 650000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1490644658840-3f2e3f8c5625?w=300&q=80', tag: '인기' },
    { id: 'us2', name: 'The St. Regis New York', location: '뉴욕 · 미드타운', rating: 5, price: 580000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80', tag: null },
    { id: 'us3', name: 'Four Seasons New York Downtown', location: '뉴욕 · 로어맨해튼', rating: 5, price: 720000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&q=80', tag: null },
    { id: 'us4', name: 'The High Line Hotel', location: '뉴욕 · 첼시', rating: 4, price: 320000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&q=80', tag: null },
    { id: 'us5', name: 'Arlo NoMad', location: '뉴욕 · 노마드', rating: 4, price: 240000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=300&q=80', tag: null },
    { id: 'us6', name: 'citizenM New York Bowery', location: '뉴욕 · 로어이스트사이드', rating: 4, price: 180000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=300&q=80', tag: null },
    { id: 'us7', name: 'Pod 51 Hotel', location: '뉴욕 · 미드타운이스트', rating: 3, price: 130000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80', tag: null },
  ],
  '영국': [
    { id: 'gb1', name: 'The Ritz London', location: '런던 · 메이페어', rating: 5, price: 780000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=300&q=80', tag: '인기' },
    { id: 'gb2', name: "Claridge's", location: '런던 · 메이페어', rating: 5, price: 850000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=300&q=80', tag: null },
    { id: 'gb3', name: 'The Savoy', location: '런던 · 스트랜드', rating: 5, price: 720000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=300&q=80', tag: null },
    { id: 'gb4', name: 'The Goring', location: '런던 · 빅토리아', rating: 5, price: 580000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=300&q=80', tag: null },
    { id: 'gb5', name: 'Ham Yard Hotel', location: '런던 · 소호', rating: 4, price: 350000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=300&q=80', tag: null },
    { id: 'gb6', name: 'citizenM London Tower of London', location: '런던 · 타워브리지', rating: 4, price: 220000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1596436889106-be35e843f974?w=300&q=80', tag: null },
    { id: 'gb7', name: 'ibis London Blackfriars', location: '런던 · 블랙프라이어스', rating: 3, price: 140000, currency: 'KRW', image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300&q=80', tag: null },
  ],
}

function getDefaultDates() {
  const ci = new Date()
  ci.setDate(ci.getDate() + 30)
  const co = new Date(ci)
  co.setDate(co.getDate() + 1)
  const fmt = (d) => d.toISOString().slice(0, 10)
  return { checkIn: fmt(ci), checkOut: fmt(co) }
}

/* ── 달력 날짜 유틸 ── */
const toStr = (y, m, d) =>
  `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

const formatKo = (str) => {
  if (!str) return '날짜 선택'
  const d = new Date(str + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function highlightMatch(text, query) {
  if (!query) return text
  const idx = text.indexOf(query)
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="ac-ds-highlight">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

/* ── 여행지 검색 오버레이 ── */
function DestinationSearch({ onSelect, onClose }) {
  const [query, setQuery] = useState('')
  const [recent, setRecent] = useState(() => {
    try { return JSON.parse(localStorage.getItem('ac_recent') || '[]') } catch { return [] }
  })
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const filtered = query.trim()
    ? DEST_DATA.filter(d => d.city.includes(query.trim()))
    : []

  const handleSelect = (item) => {
    const next = [item, ...recent.filter(r => r.city !== item.city)].slice(0, 5)
    localStorage.setItem('ac_recent', JSON.stringify(next))
    setRecent(next)
    onSelect(item)
    onClose()
  }

  const clearRecent = () => {
    localStorage.removeItem('ac_recent')
    setRecent([])
  }

  return (
    <div className="ac-ds-overlay" onClick={onClose}>
      <div className="ac-ds-panel" onClick={e => e.stopPropagation()}>

        {/* 검색 입력 */}
        <div className="ac-ds-input-row">
          <span className="ac-ds-icon">🔍</span>
          <input
            ref={inputRef}
            className="ac-ds-input"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="여행지나 숙소명 검색"
          />
          {query && (
            <button className="ac-ds-clear" onClick={() => setQuery('')}>✕</button>
          )}
        </div>

        <div className="ac-ds-body">
          {query.trim() === '' ? (
            <>
              {recent.length > 0 && (
                <div className="ac-ds-section">
                  <div className="ac-ds-section-hd">
                    <span className="ac-ds-section-title">최근 검색</span>
                    <button className="ac-ds-delete-all" onClick={clearRecent}>전체 삭제</button>
                  </div>
                  {recent.map((item, i) => (
                    <button key={i} className="ac-ds-recent-item" onClick={() => handleSelect(item)}>
                      <span className="ac-ds-recent-icon">🔍</span>
                      <span className="ac-ds-recent-city">{item.city}</span>
                      <span className="ac-ds-recent-sub">{item.display}</span>
                      <span className="ac-ds-recent-arrow">↗</span>
                    </button>
                  ))}
                </div>
              )}
              <div className="ac-ds-section">
                <div className="ac-ds-section-hd">
                  <span className="ac-ds-section-title">인기 지역</span>
                </div>
                <div className="ac-ds-pills">
                  {POPULAR_REGIONS.map(p => (
                    <button key={p.city} className="ac-ds-pill" onClick={() => handleSelect(p)}>
                      <img src={`https://flagcdn.com/w20/${p.flag}.png`} alt="" className="ac-ds-pill-flag" />
                      {p.city}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : filtered.length === 0 ? (
            <p className="ac-ds-empty">검색 결과가 없습니다.</p>
          ) : (
            <div className="ac-ds-results">
              {filtered.map((item, i) => (
                <button key={i} className="ac-ds-result-item" onClick={() => handleSelect(item)}>
                  <img src={`https://flagcdn.com/w20/${item.flag}.png`} alt="" className="ac-ds-result-flag" />
                  <div className="ac-ds-result-text">
                    <span className="ac-ds-result-city">{highlightMatch(item.city, query.trim())}</span>
                    <span className="ac-ds-result-country">{item.display}</span>
                  </div>
                  <span className="ac-ds-result-arrow">↗</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* ── 달력 컴포넌트 ── */
function CalendarPicker({ checkIn, checkOut, onSelect, onClose }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate())

  const [year, setYear] = useState(checkIn ? +checkIn.slice(0, 4) : today.getFullYear())
  const [month, setMonth] = useState(checkIn ? +checkIn.slice(5, 7) - 1 : today.getMonth())
  const [tempIn, setTempIn] = useState(checkIn || '')
  const [tempOut, setTempOut] = useState(checkOut || '')
  const [phase, setPhase] = useState('in')
  const [hover, setHover] = useState('')

  const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
  const DAYS = ['일','월','화','수','목','금','토']

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()

  const prevMonth = () => month === 0 ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1)
  const nextMonth = () => month === 11 ? (setYear(y => y + 1), setMonth(0)) : setMonth(m => m + 1)

  const handleDay = (dateStr) => {
    if (phase === 'in' || dateStr <= tempIn) {
      setTempIn(dateStr)
      setTempOut('')
      setPhase('out')
    } else {
      setTempOut(dateStr)
      setPhase('in')
    }
  }

  const effectiveEnd = tempOut || hover
  const nights = tempIn && tempOut
    ? Math.round((new Date(tempOut) - new Date(tempIn)) / 86400000)
    : 0

  const getDayClass = (dateStr) => {
    if (dateStr < todayStr) return 'ac-cal-day ac-cal-day--past'
    let cls = 'ac-cal-day'
    if (dateStr === tempIn)  cls += ' ac-cal-day--start'
    if (dateStr === tempOut) cls += ' ac-cal-day--end'
    if (tempIn && effectiveEnd && dateStr > tempIn && dateStr < effectiveEnd) cls += ' ac-cal-day--range'
    return cls
  }

  return (
    <div className="ac-cal-overlay" onClick={onClose}>
      <div className="ac-cal-panel" onClick={e => e.stopPropagation()}>

        {/* 체크인/아웃 탭 */}
        <div className="ac-cal-tabs">
          <button className={`ac-cal-tab${phase === 'in' ? ' active' : ''}`} onClick={() => setPhase('in')}>
            <span className="ac-cal-tab-label">체크인</span>
            <span className="ac-cal-tab-date">{formatKo(tempIn)}</span>
          </button>
          <div className="ac-cal-tab-sep">
            {nights > 0 ? <span className="ac-cal-nights">{nights}박</span> : '→'}
          </div>
          <button className={`ac-cal-tab${phase === 'out' ? ' active' : ''}`} onClick={() => tempIn && setPhase('out')}>
            <span className="ac-cal-tab-label">체크아웃</span>
            <span className="ac-cal-tab-date">{formatKo(tempOut)}</span>
          </button>
        </div>

        {/* 월 네비 */}
        <div className="ac-cal-nav">
          <button className="ac-cal-nav-btn" onClick={prevMonth}>‹</button>
          <span className="ac-cal-month-label">{year}년 {MONTHS[month]}</span>
          <button className="ac-cal-nav-btn" onClick={nextMonth}>›</button>
        </div>

        {/* 요일 헤더 */}
        <div className="ac-cal-weekdays">
          {DAYS.map((d, i) => (
            <span key={d} className={i === 0 ? 'red' : i === 6 ? 'blue' : ''}>{d}</span>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="ac-cal-grid">
          {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = toStr(year, month, day)
            const past = dateStr < todayStr
            return (
              <button
                key={day}
                className={getDayClass(dateStr)}
                disabled={past}
                onClick={() => !past && handleDay(dateStr)}
                onMouseEnter={() => phase === 'out' && tempIn && setHover(dateStr)}
                onMouseLeave={() => setHover('')}
              >
                {day}
              </button>
            )
          })}
        </div>

        {/* 하단 버튼 */}
        <div className="ac-cal-footer">
          <button className="ac-cal-reset" onClick={() => { setTempIn(''); setTempOut(''); setPhase('in') }}>
            초기화
          </button>
          <button
            className="ac-cal-confirm"
            disabled={!tempIn || !tempOut}
            onClick={() => { onSelect(tempIn, tempOut); onClose() }}
          >
            완료
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── 국가별 숙소 섹션 ── */
function HotelSection({ country, hotels, loading, liked, onLike }) {
  const scrollRef = useRef(null)
  const dest = DESTINATIONS.find(d => d.key === country)

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * scrollRef.current.clientWidth, behavior: 'smooth' })
  }

  return (
    <div className="ac-hsection">
      <div className="ac-hsection-hd">
        <div className="ac-hsection-title-row">
          {dest?.flag && (
            <img src={`https://flagcdn.com/w20/${dest.flag}.png`} alt={country} className="ac-hsection-flag" />
          )}
          <span className="ac-hsection-title">{country} 인기 숙소</span>
        </div>
        <div className="ac-arrow-group">
          <button className="ac-arrow-btn" onClick={() => scroll(-1)}>‹</button>
          <button className="ac-arrow-btn" onClick={() => scroll(1)}>›</button>
        </div>
      </div>

      <div className="ac-hotel-scroll" ref={scrollRef}>
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="ac-hotel-card ac-hotel-card--skeleton">
              <div className="ac-skeleton-img" />
              <div className="ac-hotel-body">
                <div className="ac-skeleton-line ac-skeleton-line--short" />
                <div className="ac-skeleton-line" />
                <div className="ac-skeleton-line ac-skeleton-line--short" />
              </div>
            </div>
          ))
        ) : hotels.length === 0 ? (
          <p className="ac-no-results">검색 결과가 없습니다.</p>
        ) : (
          hotels.map(hotel => (
            <div key={hotel.id} className="ac-hotel-card">
              <div className="ac-hotel-img-wrap">
                {hotel.image
                  ? <img src={hotel.image} alt={hotel.name} className="ac-hotel-img" />
                  : <div className="ac-hotel-img ac-hotel-img--placeholder" />}
                {hotel.tag && <span className="ac-hotel-tag">{hotel.tag}</span>}
                <button className="ac-like-btn" onClick={e => onLike(e, hotel.id)}>
                  {liked[hotel.id] ? '❤️' : '🤍'}
                </button>
              </div>
              <div className="ac-hotel-body">
                <p className="ac-hotel-location">{hotel.location}</p>
                <p className="ac-hotel-name">{hotel.name}</p>
                {hotel.rating != null && (
                  <div className="ac-hotel-rating">
                    <span className="ac-stars">{'★'.repeat(Math.min(5, Math.floor(hotel.rating)))}</span>
                    <span className="ac-rating-num">{hotel.rating}</span>
                  </div>
                )}
                <div className="ac-hotel-price">
                  <span className="ac-price-amt">{formatKrwPrice(hotel.price, hotel.currency)}</span>
                  <span className="ac-price-unit">/1박</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ── 메인 페이지 ── */
export default function Accomodation() {
  const navigate = useNavigate()
  const [destination, setDestination] = useState('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [guests, setGuests] = useState(2)
  const [selectedCountry, setSelectedCountry] = useState(null)
  const [calOpen, setCalOpen] = useState(false)
  const [destOpen, setDestOpen] = useState(false)
  const [liked, setLiked] = useState({})
  const [hotelsByCountry, setHotelsByCountry] = useState({})
  const [loadingCountries, setLoadingCountries] = useState(new Set())

  const toggleLike = (e, id) => { e.stopPropagation(); setLiked(p => ({ ...p, [id]: !p[id] })) }

  const fetchHotels = (ci, co, g) => {
    const defaults = getDefaultDates()
    const resolvedCi = ci || defaults.checkIn
    const resolvedCo = co || defaults.checkOut
    const targets = selectedCountry ? [selectedCountry] : COUNTRIES_ORDER
    setLoadingCountries(new Set(targets))
    targets.forEach(country => {
      searchStays({ country, checkIn: resolvedCi, checkOut: resolvedCo, guests: g })
        .then(data => {
          setHotelsByCountry(prev => ({ ...prev, [country]: data }))
          setLoadingCountries(prev => { const s = new Set(prev); s.delete(country); return s })
        })
        .catch(() => {
          setHotelsByCountry(prev => ({ ...prev, [country]: [] }))
          setLoadingCountries(prev => { const s = new Set(prev); s.delete(country); return s })
        })
    })
  }

  useEffect(() => { setHotelsByCountry(MOCK_HOTELS) }, [])

  const handleSearch = () => {
    if (!selectedCountry && !destination) return
    const defaults = getDefaultDates()
    const params = new URLSearchParams({
      destination: destination || selectedCountry || '',
      countryKey:  selectedCountry || '',
      checkIn:     checkIn  || defaults.checkIn,
      checkOut:    checkOut || defaults.checkOut,
      guests:      String(guests),
    })
    navigate(`/accomodation/results?${params}`)
  }

  const dateLabel = (() => {
    if (!checkIn) return '날짜 선택'
    const nights = checkOut
      ? Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000)
      : null
    return nights ? `${formatKo(checkIn)} - ${formatKo(checkOut)} (${nights}박)` : formatKo(checkIn)
  })()

  return (
    <div className="ac-page">
      <Navbar />

      {/* ── 검색 폼 ── */}
      <div className="ac-search-section">
        <div className="ac-search-inner">
          {/* 여행지 */}
          <button className="ac-search-field ac-field-full" onClick={() => setDestOpen(true)}>
            <span className="ac-field-icon">📍</span>
            <div className="ac-field-texts">
              <span className="ac-field-label">여행지</span>
              <span className={`ac-field-value${!destination ? ' placeholder' : ''}`}>
                {destination || '여행지를 선택해주세요'}
              </span>
            </div>
          </button>

          {/* 날짜 + 인원 */}
          <div className="ac-search-row2">
            <button className="ac-search-field ac-field-date" onClick={() => setCalOpen(true)}>
              <span className="ac-field-icon">📅</span>
              <div className="ac-field-texts">
                <span className="ac-field-label">입실 · 퇴실</span>
                <span className={`ac-field-value${!checkIn ? ' placeholder' : ''}`}>{dateLabel}</span>
              </div>
            </button>
            <div className="ac-search-divider" />
            <div className="ac-search-field">
              <span className="ac-field-icon">👤</span>
              <div className="ac-field-texts" style={{ flex: 1 }}>
                <span className="ac-field-label">인원</span>
                <span className="ac-field-value">성인 {guests}명</span>
              </div>
              <div className="ac-guests-ctrl">
                <button className="ac-guest-btn" onClick={() => setGuests(g => Math.max(1, g - 1))}>−</button>
                <span className="ac-guests-num">{guests}</span>
                <button className="ac-guest-btn" onClick={() => setGuests(g => g + 1)}>+</button>
              </div>
            </div>
          </div>

          <button className="ac-search-btn" onClick={handleSearch}>숙소 검색</button>
        </div>
      </div>

      {/* ── 여행지 검색 오버레이 ── */}
      {destOpen && (
        <DestinationSearch
          onSelect={(item) => {
            setDestination(item.city)
            setSelectedCountry(item.key)
          }}
          onClose={() => setDestOpen(false)}
        />
      )}

      {/* ── 달력 팝업 ── */}
      {calOpen && (
        <CalendarPicker
          checkIn={checkIn}
          checkOut={checkOut}
          onSelect={(ci, co) => { setCheckIn(ci); setCheckOut(co) }}
          onClose={() => setCalOpen(false)}
        />
      )}

      {/* ── 여행지 사진 카드 ── */}
      <div className="ac-dest-section">
        <h2 className="ac-dest-title">인기 해외 여행지</h2>
        <div className="ac-dest-scroll">
          {DESTINATIONS.map(dest => (
            <button
              key={dest.label}
              className={`ac-dest-card${selectedCountry === dest.key ? ' ac-dest-card--active' : ''}`}
              onClick={() => setSelectedCountry(dest.key)}
            >
              {dest.photo ? (
                <>
                  <img src={dest.photo} alt={dest.label} className="ac-dest-photo" />
                  <div className="ac-dest-overlay" />
                  <div className="ac-dest-info">
                    <div className="ac-dest-flag-wrap">
                      <img src={`https://flagcdn.com/w40/${dest.flag}.png`} alt={dest.label} className="ac-dest-flag-img" />
                    </div>
                    <span className="ac-dest-name">{dest.label}</span>
                    <span className="ac-dest-city">{dest.city}</span>
                  </div>
                </>
              ) : (
                <div className="ac-dest-all-card">
                  <span className="ac-dest-all-icon">🌏</span>
                  <span className="ac-dest-all-text">전체보기</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── 국가별 숙소 섹션 ── */}
      <div className="ac-hotels-wrap">
        {COUNTRIES_ORDER
          .filter(c => !selectedCountry || c === selectedCountry)
          .map(country => (
            <HotelSection
              key={country}
              country={country}
              hotels={hotelsByCountry[country] || []}
              loading={loadingCountries.has(country)}
              liked={liked}
              onLike={toggleLike}
            />
          ))}
      </div>

      <BottomNav />
    </div>
  )
}
