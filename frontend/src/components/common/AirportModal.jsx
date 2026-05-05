import { useState, useRef, useEffect } from 'react'
import { getPlaces } from '../../api/flightApi'
import '../../styles/flight.css'

const QUICK_CITIES = [
  {
    region: '국내',
    cities: [
      { name: '서울/인천', code: 'ICN' },
      { name: '김포', code: 'GMP' },
      { name: '제주', code: 'CJU' },
      { name: '부산', code: 'PUS' },
      { name: '광주', code: 'KWJ' },
      { name: '대구', code: 'TAE' },
      { name: '청주', code: 'CJJ' },
      { name: '여수', code: 'RSU' },
      { name: '포항', code: 'KPO' },
      { name: '군산', code: 'KUV' },
    ],
  },
  {
    region: '일본',
    cities: [
      { name: '도쿄', code: 'TYO' },
      { name: '도쿄/나리타', code: 'NRT' },
      { name: '도쿄/하네다', code: 'HND' },
      { name: '오사카/간사이', code: 'KIX' },
      { name: '후쿠오카', code: 'FUK' },
      { name: '삿포로/치토세', code: 'CTS' },
      { name: '오키나와', code: 'OKA' },
      { name: '나고야', code: 'NGO' },
      { name: '히로시마', code: 'HIJ' },
      { name: '가고시마', code: 'KOJ' },
      { name: '구마모토', code: 'KMJ' },
      { name: '나가사키', code: 'NGS' },
      { name: '센다이', code: 'SDJ' },
      { name: '다카마쓰', code: 'TAK' },
      { name: '기타큐슈', code: 'KKJ' },
      { name: '마쓰야마', code: 'MYJ' },
    ],
  },
  {
    region: '중국/대만/홍콩/마카오',
    cities: [
      { name: '베이징', code: 'PEK' },
      { name: '상하이/푸동', code: 'PVG' },
      { name: '상하이/홍차오', code: 'SHA' },
      { name: '광저우', code: 'CAN' },
      { name: '선전', code: 'SZX' },
      { name: '칭다오', code: 'TAO' },
      { name: '다롄', code: 'DLC' },
      { name: '항저우', code: 'HGH' },
      { name: '청두', code: 'CTU' },
      { name: '홍콩', code: 'HKG' },
      { name: '마카오', code: 'MFM' },
      { name: '타이베이/타오위안', code: 'TPE' },
      { name: '타이베이/송산', code: 'TSA' },
      { name: '가오슝', code: 'KHH' },
      { name: '타이중', code: 'RMQ' },
    ],
  },
  {
    region: '동남아',
    cities: [
      { name: '방콕/수완나품', code: 'BKK' },
      { name: '방콕/돈므앙', code: 'DMK' },
      { name: '치앙마이', code: 'CNX' },
      { name: '푸켓', code: 'HKT' },
      { name: '다낭', code: 'DAD' },
      { name: '하노이', code: 'HAN' },
      { name: '호치민', code: 'SGN' },
      { name: '나트랑/깜란', code: 'CXR' },
      { name: '푸꾸옥', code: 'PQC' },
      { name: '싱가포르', code: 'SIN' },
      { name: '쿠알라룸푸르', code: 'KUL' },
      { name: '페낭', code: 'PEN' },
      { name: '코타키나발루', code: 'BKI' },
      { name: '자카르타', code: 'CGK' },
      { name: '발리', code: 'DPS' },
      { name: '마닐라', code: 'MNL' },
      { name: '세부', code: 'CEB' },
      { name: '보홀(팡라오)', code: 'TAG' },
      { name: '클락', code: 'CRK' },
      { name: '프놈펜', code: 'PNH' },
      { name: '씨엠립', code: 'REP' },
      { name: '비엔티엔', code: 'VTE' },
      { name: '양곤', code: 'RGN' },
    ],
  },
  {
    region: '남아시아/중앙아시아',
    cities: [
      { name: '델리', code: 'DEL' },
      { name: '뭄바이', code: 'BOM' },
      { name: '콜롬보', code: 'CMB' },
      { name: '카트만두', code: 'KTM' },
      { name: '알마티', code: 'ALA' },
      { name: '타슈켄트', code: 'TAS' },
      { name: '울란바토르', code: 'ULN' },
    ],
  },
  {
    region: '중동',
    cities: [
      { name: '두바이', code: 'DXB' },
      { name: '아부다비', code: 'AUH' },
      { name: '도하', code: 'DOH' },
      { name: '리야드', code: 'RUH' },
      { name: '제다', code: 'JED' },
      { name: '쿠웨이트', code: 'KWI' },
      { name: '암만', code: 'AMM' },
      { name: '텔아비브', code: 'TLV' },
      { name: '이스탄불', code: 'IST' },
    ],
  },
  {
    region: '유럽',
    cities: [
      { name: '런던/히드로', code: 'LHR' },
      { name: '파리', code: 'CDG' },
      { name: '로마', code: 'FCO' },
      { name: '밀라노', code: 'MXP' },
      { name: '바르셀로나', code: 'BCN' },
      { name: '마드리드', code: 'MAD' },
      { name: '리스본', code: 'LIS' },
      { name: '프랑크푸르트', code: 'FRA' },
      { name: '뮌헨', code: 'MUC' },
      { name: '암스테르담', code: 'AMS' },
      { name: '취리히', code: 'ZRH' },
      { name: '비엔나', code: 'VIE' },
      { name: '프라하', code: 'PRG' },
      { name: '부다페스트', code: 'BUD' },
      { name: '베를린', code: 'BER' },
      { name: '코펜하겐', code: 'CPH' },
      { name: '스톡홀름', code: 'ARN' },
      { name: '헬싱키', code: 'HEL' },
      { name: '아테네', code: 'ATH' },
      { name: '이스탄불', code: 'IST' },
      { name: '베네치아', code: 'VCE' },
      { name: '제네바', code: 'GVA' },
      { name: '브뤼셀', code: 'BRU' },
      { name: '더블린', code: 'DUB' },
      { name: '레이캬비크', code: 'KEF' },
    ],
  },
  {
    region: '미주',
    cities: [
      { name: '뉴욕/JFK', code: 'JFK' },
      { name: '뉴욕/뉴왁', code: 'EWR' },
      { name: '로스앤젤레스', code: 'LAX' },
      { name: '샌프란시스코', code: 'SFO' },
      { name: '시애틀', code: 'SEA' },
      { name: '시카고', code: 'ORD' },
      { name: '라스베이거스', code: 'LAS' },
      { name: '보스턴', code: 'BOS' },
      { name: '워싱턴/덜레스', code: 'IAD' },
      { name: '댈러스', code: 'DFW' },
      { name: '마이애미', code: 'MIA' },
      { name: '애틀란타', code: 'ATL' },
      { name: '밴쿠버', code: 'YVR' },
      { name: '토론토', code: 'YYZ' },
      { name: '캘거리', code: 'YYC' },
      { name: '멕시코시티', code: 'MEX' },
      { name: '하와이/호놀룰루', code: 'HNL' },
    ],
  },
  {
    region: '남미',
    cities: [
      { name: '상파울루', code: 'GRU' },
      { name: '리우데자네이루', code: 'GIG' },
      { name: '부에노스아이레스', code: 'EZE' },
      { name: '리마', code: 'LIM' },
      { name: '산티아고', code: 'SCL' },
    ],
  },
  {
    region: '대양주',
    cities: [
      { name: '시드니', code: 'SYD' },
      { name: '멜버른', code: 'MEL' },
      { name: '브리즈번', code: 'BNE' },
      { name: '퍼스', code: 'PER' },
      { name: '오클랜드', code: 'AKL' },
      { name: '웰링턴', code: 'WLG' },
      { name: '괌', code: 'GUM' },
      { name: '사이판', code: 'SPN' },
      { name: '피지/난디', code: 'NAN' },
    ],
  },
  {
    region: '아프리카',
    cities: [
      { name: '카이로', code: 'CAI' },
      { name: '케이프타운', code: 'CPT' },
      { name: '요하네스버그', code: 'JNB' },
      { name: '나이로비', code: 'NBO' },
      { name: '카사블랑카', code: 'CMN' },
    ],
  },
]

const AIRPORT_ALIASES = [
  { names: ['나리타', '도쿄 나리타', 'tokyo narita', 'narita'], code: 'NRT', label: '나리타 NRT' },
  { names: ['하네다', '도쿄 하네다', 'tokyo haneda', 'haneda'], code: 'HND', label: '하네다 HND' },
  { names: ['인천', '서울 인천', 'seoul incheon', 'incheon'], code: 'ICN', label: '서울/인천 ICN' },
  { names: ['김포', '서울 김포', 'gimpo'], code: 'GMP', label: '김포 GMP' },
  { names: ['김해', '부산 김해', 'busan gimhae', 'gimhae'], code: 'PUS', label: '부산/김해 PUS' },
  { names: ['간사이', '오사카 간사이', 'osaka kansai', 'kansai'], code: 'KIX', label: '오사카/간사이 KIX' },
  { names: ['수완나품', '방콕 수완나품', 'suvarnabhumi'], code: 'BKK', label: '방콕/수완나품 BKK' },
  { names: ['돈므앙', '방콕 돈므앙', 'don mueang'], code: 'DMK', label: '방콕/돈므앙 DMK' },
  { names: ['타오위안', '대만 타오위안', 'taipei taoyuan'], code: 'TPE', label: '대만/타오위안 TPE' },
  { names: ['송산', '대만 송산', 'taipei songshan'], code: 'TSA', label: '대만/송산 TSA' },
]

const COUNTRY_AIRPORT_ALIASES = [
  { names: ['한국', '대한민국', 'korea', 'south korea'], code: 'ICN', label: '서울/인천 ICN' },
  { names: ['일본', 'japan'], code: 'NRT', label: '도쿄/나리타 NRT' },
  { names: ['중국', 'china'], code: 'PEK', label: '베이징 PEK' },
  { names: ['대만', '타이완', 'taiwan'], code: 'TPE', label: '타이베이/타오위안 TPE' },
  { names: ['홍콩', 'hong kong'], code: 'HKG', label: '홍콩 HKG' },
  { names: ['마카오', 'macau', 'macao'], code: 'MFM', label: '마카오 MFM' },
  { names: ['태국', 'thailand'], code: 'BKK', label: '방콕/수완나품 BKK' },
  { names: ['베트남', 'vietnam'], code: 'HAN', label: '하노이 HAN' },
  { names: ['싱가포르', 'singapore'], code: 'SIN', label: '싱가포르 SIN' },
  { names: ['말레이시아', 'malaysia'], code: 'KUL', label: '쿠알라룸푸르 KUL' },
  { names: ['인도네시아', 'indonesia'], code: 'CGK', label: '자카르타 CGK' },
  { names: ['필리핀', 'philippines'], code: 'MNL', label: '마닐라 MNL' },
  { names: ['캄보디아', 'cambodia'], code: 'PNH', label: '프놈펜 PNH' },
  { names: ['라오스', 'laos'], code: 'VTE', label: '비엔티엔 VTE' },
  { names: ['미얀마', 'myanmar'], code: 'RGN', label: '양곤 RGN' },
  { names: ['인도', 'india'], code: 'DEL', label: '델리 DEL' },
  { names: ['몽골', 'mongolia'], code: 'ULN', label: '울란바토르 ULN' },
  { names: ['아랍에미리트', 'uae', 'united arab emirates'], code: 'DXB', label: '두바이 DXB' },
  { names: ['카타르', 'qatar'], code: 'DOH', label: '도하 DOH' },
  { names: ['터키', '튀르키예', 'turkey', 'turkiye'], code: 'IST', label: '이스탄불 IST' },
  { names: ['영국', 'uk', 'united kingdom', 'england'], code: 'LHR', label: '런던/히드로 LHR' },
  { names: ['프랑스', 'france'], code: 'CDG', label: '파리 CDG' },
  { names: ['이탈리아', 'italy'], code: 'FCO', label: '로마 FCO' },
  { names: ['스페인', 'spain'], code: 'MAD', label: '마드리드 MAD' },
  { names: ['포르투갈', 'portugal'], code: 'LIS', label: '리스본 LIS' },
  { names: ['독일', 'germany'], code: 'FRA', label: '프랑크푸르트 FRA' },
  { names: ['네덜란드', 'netherlands'], code: 'AMS', label: '암스테르담 AMS' },
  { names: ['스위스', 'switzerland'], code: 'ZRH', label: '취리히 ZRH' },
  { names: ['오스트리아', 'austria'], code: 'VIE', label: '비엔나 VIE' },
  { names: ['체코', 'czech', 'czech republic'], code: 'PRG', label: '프라하 PRG' },
  { names: ['헝가리', 'hungary'], code: 'BUD', label: '부다페스트 BUD' },
  { names: ['덴마크', 'denmark'], code: 'CPH', label: '코펜하겐 CPH' },
  { names: ['스웨덴', 'sweden'], code: 'ARN', label: '스톡홀름 ARN' },
  { names: ['핀란드', 'finland'], code: 'HEL', label: '헬싱키 HEL' },
  { names: ['그리스', 'greece'], code: 'ATH', label: '아테네 ATH' },
  { names: ['미국', 'usa', 'united states', 'america'], code: 'LAX', label: '로스앤젤레스 LAX' },
  { names: ['캐나다', 'canada'], code: 'YYZ', label: '토론토 YYZ' },
  { names: ['멕시코', 'mexico'], code: 'MEX', label: '멕시코시티 MEX' },
  { names: ['브라질', 'brazil'], code: 'GRU', label: '상파울루 GRU' },
  { names: ['아르헨티나', 'argentina'], code: 'EZE', label: '부에노스아이레스 EZE' },
  { names: ['페루', 'peru'], code: 'LIM', label: '리마 LIM' },
  { names: ['칠레', 'chile'], code: 'SCL', label: '산티아고 SCL' },
  { names: ['호주', '오스트레일리아', 'australia'], code: 'SYD', label: '시드니 SYD' },
  { names: ['뉴질랜드', 'new zealand'], code: 'AKL', label: '오클랜드 AKL' },
  { names: ['괌', 'guam'], code: 'GUM', label: '괌 GUM' },
  { names: ['사이판', 'saipan'], code: 'SPN', label: '사이판 SPN' },
  { names: ['이집트', 'egypt'], code: 'CAI', label: '카이로 CAI' },
  { names: ['남아공', '남아프리카공화국', 'south africa'], code: 'JNB', label: '요하네스버그 JNB' },
  { names: ['케냐', 'kenya'], code: 'NBO', label: '나이로비 NBO' },
  { names: ['모로코', 'morocco'], code: 'CMN', label: '카사블랑카 CMN' },
]

const normalizeAirportQuery = (value) => (
  value
    .trim()
    .toLowerCase()
    .replace(/[\s/·,()-]/g, '')
)

const findLocalAirport = (value) => {
  const normalized = normalizeAirportQuery(value)
  if (!normalized) return null

  const countryMatch = COUNTRY_AIRPORT_ALIASES.find(({ names, code }) => (
    code.toLowerCase() === normalized || names.some(name => normalizeAirportQuery(name) === normalized)
  ))
  if (countryMatch) return { code: countryMatch.code, name: countryMatch.label, fullName: countryMatch.label }

  const quickMatch = QUICK_CITIES
    .flatMap(group => group.cities)
    .find(city => {
      const cityName = normalizeAirportQuery(city.name)
      return cityName === normalized || cityName.includes(normalized) || normalized.includes(cityName)
    })
  if (quickMatch) return { code: quickMatch.code, name: `${quickMatch.name} ${quickMatch.code}`, fullName: quickMatch.name }

  const aliasMatch = AIRPORT_ALIASES.find(({ names, code }) => (
    code.toLowerCase() === normalized || names.some(name => normalizeAirportQuery(name) === normalized)
  ))
  if (aliasMatch) return { code: aliasMatch.code, name: aliasMatch.label, fullName: aliasMatch.label }

  return null
}

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

  const buildPlaceSelection = (item) => {
    const code = item.iata_code || item.iata_city_code
    const name = item.iata_code
      ? `${item.city_name || item.name} ${item.iata_code}`
      : `${item.name} ${item.iata_city_code}`
    return { code, name, fullName: item.name }
  }

  const buildCustomSelection = (value) => {
    const name = value.trim()
    const code = /^[A-Za-z]{3}$/.test(name) ? name.toUpperCase() : name
    return { code, name, fullName: name, custom: true }
  }

  const selectAirport = (airport) => {
    onSelect(airport)
    onClose()
  }

  const doSearch = async (q, { selectFirst = false } = {}) => {
    const keyword = q.trim()
    if (!keyword) { setSuggestions([]); return }
    const localAirport = findLocalAirport(keyword)
    if (selectFirst && localAirport) {
      selectAirport(localAirport)
      return
    }
    if (keyword.length < 2) {
      if (selectFirst) selectAirport(buildCustomSelection(keyword))
      else setSuggestions([])
      return
    }
    setSearching(true)
    try {
      const data = await getPlaces(keyword)
      const nextSuggestions = data.slice(0, 8)
      setSuggestions(nextSuggestions)
      if (selectFirst) {
        selectAirport(nextSuggestions[0] ? buildPlaceSelection(nextSuggestions[0]) : buildCustomSelection(keyword))
      }
    } catch {
      setSuggestions([])
      if (selectFirst) selectAirport(buildCustomSelection(keyword))
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
    if (e.key === 'Enter') {
      e.preventDefault()
      doSearch(query, { selectFirst: true })
    }
  }

  const selectSuggestion = (item) => {
    selectAirport(buildPlaceSelection(item))
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
          <button className="am-search-btn" onClick={() => doSearch(query, { selectFirst: true })} disabled={searching}>
            {searching ? '검색 중' : '검색'}
          </button>
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
