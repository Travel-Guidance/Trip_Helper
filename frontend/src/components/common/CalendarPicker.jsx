import { useState, useEffect, useRef } from 'react'
import '../../styles/calendar.css'

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay()
}

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function parseDate(str) {
  if (!str) return null
  const [y, m, d] = str.split('-').map(Number)
  return { year: y, month: m - 1, day: d }
}

function getNights(start, end) {
  if (!start || !end || end <= start) return null
  const ms = new Date(end) - new Date(start)
  return Math.round(ms / 86400000)
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

export default function CalendarPicker({ value, onChange, onClose, minDate, rangeStart }) {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const minStr = minDate || todayStr

  const parsed = parseDate(value)
  const initial = parsed || { year: today.getFullYear(), month: today.getMonth() }

  const [viewYear, setViewYear] = useState(initial.year)
  const [viewMonth, setViewMonth] = useState(initial.month)
  const [selected, setSelected] = useState(value || '')
  const [hovered, setHovered] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [onClose])

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  const daysInMonth = getDaysInMonth(viewYear, viewMonth)
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth)

  const cells = []
  for (let i = 0; i < firstDay; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)

  // range preview: rangeStart ~ (hovered or selected)
  const rangeEnd = hovered || selected
  const rangeMin = rangeStart && rangeEnd && rangeStart < rangeEnd ? rangeStart : null
  const rangeMax = rangeMin ? rangeEnd : null

  const handleDay = (day) => {
    if (!day) return
    const dateStr = toDateStr(viewYear, viewMonth, day)
    if (dateStr < minStr) return
    setSelected(dateStr)
  }

  const handleConfirm = () => {
    if (selected) onChange(selected)
    onClose()
  }

  const handleReset = () => {
    setSelected('')
    onChange('')
  }

  // nights badge
  const previewNights = getNights(rangeStart, hovered || selected)

  return (
    <div className="cal-overlay" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="cal-panel" ref={ref}>
        <div className="cal-header">
          <button className="cal-nav" onClick={prevMonth}>‹</button>
          <span className="cal-title">{viewYear}년 {viewMonth + 1}월</span>
          <button className="cal-nav" onClick={nextMonth}>›</button>
        </div>

        {rangeStart && previewNights !== null && (
          <div className="cal-nights">
            {previewNights}박 {previewNights + 1}일
          </div>
        )}

        <div className="cal-grid">
          {DAY_LABELS.map((d, i) => (
            <div key={d} className={`cal-dow ${i === 0 ? 'cal-dow--sun' : i === 6 ? 'cal-dow--sat' : ''}`}>{d}</div>
          ))}
          {cells.map((day, i) => {
            if (!day) return <div key={`e${i}`} />
            const dateStr = toDateStr(viewYear, viewMonth, day)
            const isDisabled = dateStr < minStr
            const isSelected = dateStr === selected
            const isToday = dateStr === todayStr
            const dow = (firstDay + day - 1) % 7
            const isRangeStart = dateStr === rangeStart
            const isInRange = rangeMin && rangeMax && dateStr > rangeMin && dateStr < rangeMax
            const isRangeEnd = rangeMin && dateStr === rangeMax
            const isEdge = isRangeStart || isRangeEnd || isSelected

            let cls = 'cal-day'
            if (isSelected) cls += ' cal-day--selected'
            else if (isRangeStart) cls += ' cal-day--range-start'
            else if (isRangeEnd) cls += ' cal-day--range-end'
            if (isInRange) cls += ' cal-day--in-range'
            if (isDisabled) cls += ' cal-day--disabled'
            if (isToday && !isEdge) cls += ' cal-day--today'
            if (dow === 0 && !isEdge) cls += ' cal-day--sun'
            if (dow === 6 && !isEdge) cls += ' cal-day--sat'

            return (
              <button
                key={day}
                className={cls}
                onClick={() => handleDay(day)}
                onMouseEnter={() => !isDisabled && setHovered(dateStr)}
                onMouseLeave={() => setHovered('')}
                disabled={isDisabled}
              >
                {day}
              </button>
            )
          })}
        </div>

        <div className="cal-footer">
          <button className="cal-reset" onClick={handleReset}>초기화</button>
          <button className="cal-confirm" onClick={handleConfirm} disabled={!selected}>완료</button>
        </div>
      </div>
    </div>
  )
}
