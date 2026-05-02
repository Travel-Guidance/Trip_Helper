import { useState, useRef, useEffect } from 'react'
import { getPlaces } from '../services/flightApi'

const QUICK_CITIES = [
  {
    region: '국내',
    cities: [
      { name: '서울', code: 'ICN' },
      { name: '김포', code: 'GMP' },
      { name: '제주', code: 'CJU' },
      { name: '부산', code: 'PUS' },
      { name: '광주', code: 'KWJ' },
      { name: '대구', code: 'TAE' },
      { name: '청주', code: 'CJJ' },
      { name: '여수', code: 'RSU' },
    ],
  },
  {
    region: '일본',
    cities: [
      { name: '오사카/간사이', code: 'KIX' },
      { name: '도쿄', code: 'TYO' },
      { name: '후쿠오카', code: 'FUK' },
      { name: '삿포로/치토세', code: 'CTS' },
      { name: '오키나와', code: 'OKA' },
      { name: '나고야', code: 'NGO' },
      { name: '이시가키', code: 'ISG' },
      { name: '구마모토', code: 'KMJ' },
      { name: '마쓰야마', code: 'MYJ' },
      { name: '기타큐슈', code: 'KKJ' },
      { name: '다카마쓰', code: 'TAK' },
      { name: '히로시마', code: 'HIJ' },
    ],
  },
  {
    region: '아시아',
    cities: [
      { name: '나트랑/깜란', code: 'CXR' },
      { name: '다낭', code: 'DAD' },
      { name: '방콕/수완나품', code: 'BKK' },
      { name: '발리', code: 'DPS' },
      { name: '하노이', code: 'HAN' },
      { name: '호치민', code: 'SGN' },
      { name: '푸꾸옥', code: 'PQC' },
      { name: '세부', code: 'CEB' },
      { name: '치앙마이', code: 'CNX' },
      { name: '싱가포르', code: 'SIN' },
      { name: '보홀(팡라오)', code: 'TAG' },
      { name: '마닐라', code: 'MNL' },
      { name: '클락', code: 'CRK' },
      { name: '푸켓', code: 'HKT' },
      { name: '코타키나발루', code: 'BKI' },
      { name: '비엔티엔', code: 'VTE' },
      { name: '몰디브/말레', code: 'MLE' },
      { name: '쿠알라룸푸르', code: 'KUL' },
      { name: '대만/타오위안', code: 'TPE' },
      { name: '카오슝', code: 'KHH' },
      { name: '타이중', code: 'RMQ' },
      { name: '대만/송산', code: 'TSA' },
      { name: '알마티', code: 'ALA' },
      { name: '울란바토르', code: 'ULN' },
      { name: '마카오', code: 'MFM' },
      { name: '홍콩', code: 'HKG' },
    ],
  },
  {
    region: '미주',
    cities: [
      { name: '뉴욕', code: 'JFK' },
      { name: '로스앤젤레스', code: 'LAX' },
      { name: '하와이/호놀룰루', code: 'HNL' },
      { name: '캘거리', code: 'YYC' },
      { name: '밴쿠버', code: 'YVR' },
      { name: '토론토', code: 'YYZ' },
      { name: '샌프란시스코', code: 'SFO' },
      { name: '워싱턴/덜레스', code: 'IAD' },
      { name: '시애틀', code: 'SEA' },
      { name: '애틀란타', code: 'ATL' },
      { name: '라스베이거스', code: 'LAS' },
      { name: '뉴욕/뉴왁', code: 'EWR' },
    ],
  },
  {
    region: '유럽',
    cities: [
      { name: '파리', code: 'CDG' },
      { name: '로마', code: 'FCO' },
      { name: '바르셀로나', code: 'BCN' },
      { name: '런던', code: 'LHR' },
      { name: '프라하', code: 'PRG' },
      { name: '이스탄불', code: 'IST' },
      { name: '리스본', code: 'LIS' },
      { name: '프랑크푸르트', code: 'FRA' },
      { name: '취리히', code: 'ZRH' },
      { name: '마드리드', code: 'MAD' },
      { name: '발렌샤', code: 'VLC' },
      { name: '부다페스트', code: 'BUD' },
      { name: '레이캬비크', code: 'KEF' },
      { name: '헬싱키', code: 'HEL' },
      { name: '비엔나', code: 'VIE' },
      { name: '암스테르담', code: 'AMS' },
    ],
  },
  {
    region: '대양주',
    cities: [
      { name: '시드니', code: 'SYD' },
      { name: '멜버른', code: 'MEL' },
      { name: '브리즈번', code: 'BNE' },
      { name: '오클랜드', code: 'AKL' },
      { name: '괌', code: 'GUM' },
      { name: '사이판', code: 'SPN' },
    ],
  },
  {
    region: '중동',
    cities: [
      { name: '두바이', code: 'DXB' },
      { name: '아부다비', code: 'AUH' },
      { name: '도하', code: 'DOH' },
      { name: '텔아비브', code: 'TLV' },
    ],
  },
]

export default function AirportModal({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [searching, setSearching] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setQuery('')
      setSuggestions([])
      setTimeout(() => inputRef.current?.focus(), 60)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const doSearch = async (q) => {
    if (!q || q.length < 2) { setSuggestions([]); return }
    setSearching(true)
    try {
      const data = await getPlaces(q)
      setSuggestions(data.slice(0, 8))
    } catch {
      setSuggestions([])
    } finally {
      setSearching(false)
    }
  }

  const handleQueryChange = (e) => {
    const v = e.target.value
    setQuery(v)
    if (!v) setSuggestions([])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') doSearch(query)
  }

  const selectSuggestion = (item) => {
    const code = item.iata_code || item.iata_city_code
    const name = item.iata_code
      ? `${item.city_name || item.name} ${item.iata_code}`
      : `${item.name} ${item.iata_city_code}`
    onSelect({ code, name, fullName: item.name })
    onClose()
  }

  const selectQuick = (city) => {
    onSelect({ code: city.code, name: `${city.name} ${city.code}` })
    onClose()
  }

  if (!open) return null

  return (
    <div className="am-overlay" onMouseDown={onClose}>
      <div className="am-panel" onMouseDown={e => e.stopPropagation()}>
        <div className="am-header">
          <span className="am-title">도시 선택</span>
          <button className="am-close" onClick={onClose}>✕</button>
        </div>

        <div className="am-search-row">
          <input
            ref={inputRef}
            className="am-search-input"
            placeholder="도시명을 입력하세요"
            value={query}
            onChange={handleQueryChange}
            onKeyDown={handleKeyDown}
          />
          <button className="am-search-btn" onClick={() => doSearch(query)}>검색</button>
        </div>

        {suggestions.length > 0 && (
          <div className="am-suggestions">
            {suggestions.map(item => {
              const code = item.iata_code || item.iata_city_code
              return (
                <div key={item.id} className="am-suggestion-item" onClick={() => selectSuggestion(item)}>
                  <span className="am-suggestion-code">{code}</span>
                  <div>
                    <div className="am-suggestion-name">{item.name}</div>
                    <div className="am-suggestion-city">
                      {item.city_name ? `${item.city_name} · 공항` : item.type === 'city' ? '도시 전체' : '공항'}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <div className="am-quick-section">
          <div className="am-quick-title">주요도시 바로 선택</div>
          <div className="am-quick-body">
            {QUICK_CITIES.map(({ region, cities }) => (
              <div key={region} className="am-region-row">
                <div className="am-region-label">{region}</div>
                <div className="am-region-cities">
                  {cities.map(city => (
                    <button key={city.code} className="am-city-btn" onClick={() => selectQuick(city)}>
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
