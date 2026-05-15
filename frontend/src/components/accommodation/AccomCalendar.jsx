import { useState } from 'react'

const MONTHS = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월']
const DAYS   = ['일','월','화','수','목','금','토']

function toStr(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

export function formatKo(str) {
  if (!str) return '날짜 선택'
  const d = new Date(str + 'T00:00:00')
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function AccomCalendar({ checkIn, checkOut, onSelect, onClose }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = toStr(today.getFullYear(), today.getMonth(), today.getDate())

  const [year,    setYear]    = useState(checkIn ? +checkIn.slice(0, 4)  : today.getFullYear())
  const [month,   setMonth]   = useState(checkIn ? +checkIn.slice(5, 7) - 1 : today.getMonth())
  const [tempIn,  setTempIn]  = useState(checkIn  || '')
  const [tempOut, setTempOut] = useState(checkOut || '')
  const [phase,   setPhase]   = useState('in')
  const [hover,   setHover]   = useState('')

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay    = new Date(year, month, 1).getDay()

  const prevMonth = () => month === 0  ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1)
  const nextMonth = () => month === 11 ? (setYear(y => y + 1), setMonth(0))  : setMonth(m => m + 1)

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
    if (dateStr <= todayStr) return 'ac-cal-day ac-cal-day--past'
    let cls = 'ac-cal-day'
    const dow = new Date(dateStr + 'T00:00:00').getDay()
    if (dow === 0) cls += ' dow-sun'
    if (dow === 6) cls += ' dow-sat'
    if (dateStr === tempIn)  cls += ' ac-cal-day--start'
    if (dateStr === tempOut) cls += ' ac-cal-day--end'
    if (tempIn && effectiveEnd && dateStr > tempIn && dateStr < effectiveEnd) cls += ' ac-cal-day--range'
    return cls
  }

  return (
    <div className="ac-cal-overlay" onClick={onClose}>
      <div className="ac-cal-panel" onClick={e => e.stopPropagation()}>

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

        <div className="ac-cal-nav">
          <button className="ac-cal-nav-btn" onClick={prevMonth}>‹</button>
          <span className="ac-cal-month-label">{year}년 {MONTHS[month]}</span>
          <button className="ac-cal-nav-btn" onClick={nextMonth}>›</button>
        </div>

        <div className="ac-cal-weekdays">
          {DAYS.map((d, i) => (
            <span key={d} className={i === 0 ? 'red' : i === 6 ? 'blue' : ''}>{d}</span>
          ))}
        </div>

        <div className="ac-cal-grid">
          {Array.from({ length: firstDay }).map((_, i) => <span key={`e${i}`} />)}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day     = i + 1
            const dateStr = toStr(year, month, day)
            const past    = dateStr <= todayStr
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
