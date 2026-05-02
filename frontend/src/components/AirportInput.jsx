import { useState, useEffect, useRef, useCallback } from 'react'
import { getPlaces } from '../services/flightApi'

export default function AirportInput({ value, onChange, placeholder }) {
  const [query, setQuery] = useState(value?.name || '')
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const timer = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    setQuery(value?.name || '')
  }, [value])

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = useCallback(async (q) => {
    if (q.length < 2) { setSuggestions([]); return }
    try {
      const data = await getPlaces(q)
      setSuggestions(data.slice(0, 8))
      setOpen(true)
    } catch {
      setSuggestions([])
    }
  }, [])

  const handleChange = (e) => {
    const q = e.target.value
    setQuery(q)
    if (!q) { onChange(null); setSuggestions([]); return }
    clearTimeout(timer.current)
    timer.current = setTimeout(() => search(q), 300)
  }

  const handleSelect = (item) => {
    const code = item.iata_code || item.iata_city_code
    const name = item.iata_code
      ? `${item.city_name || item.name} ${item.iata_code}`
      : `${item.name} ${item.iata_city_code}`
    setQuery(name)
    onChange({ code, name, fullName: item.name })
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div className="airport-input-wrap" ref={wrapRef}>
      <input
        className="airport-input"
        value={query}
        onChange={handleChange}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
      />
      {open && suggestions.length > 0 && (
        <div className="airport-dropdown">
          {suggestions.map((item) => {
            const code = item.iata_code || item.iata_city_code
            return (
              <div key={item.id} className="airport-item" onMouseDown={() => handleSelect(item)}>
                <div className="airport-item-code">{code}</div>
                <div>
                  <div className="airport-item-name">{item.name}</div>
                  <div className="airport-item-city">
                    {item.city_name ? `${item.city_name} · 공항` : item.type === 'city' ? '도시 전체' : '공항'}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
