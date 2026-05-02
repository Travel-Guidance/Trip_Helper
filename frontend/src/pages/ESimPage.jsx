import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { purchaseEsim } from '../services/esimApi'

const COUNTRIES = [
  { code: 'JP', name: '일본',             flag: '🇯🇵', region: 'asia' },
  { code: 'US', name: '미국',             flag: '🇺🇸', region: 'americas' },
  { code: 'VN', name: '베트남',           flag: '🇻🇳', region: 'asia' },
  { code: 'TH', name: '태국',             flag: '🇹🇭', region: 'asia' },
  { code: 'TW', name: '대만',             flag: '🇹🇼', region: 'asia' },
  { code: 'CN', name: '중국',             flag: '🇨🇳', region: 'china' },
  { code: 'FR', name: '프랑스',           flag: '🇫🇷', region: 'europe' },
  { code: 'PH', name: '필리핀',           flag: '🇵🇭', region: 'asia' },
  { code: 'GU', name: '괌',               flag: '🇬🇺', region: 'oceania' },
  { code: 'GR', name: '그리스',           flag: '🇬🇷', region: 'europe' },
  { code: 'NL', name: '네덜란드',         flag: '🇳🇱', region: 'europe' },
  { code: 'NO', name: '노르웨이',         flag: '🇳🇴', region: 'europe' },
  { code: 'NZ', name: '뉴질랜드',         flag: '🇳🇿', region: 'oceania' },
  { code: 'DK', name: '덴마크',           flag: '🇩🇰', region: 'europe' },
  { code: 'DE', name: '독일',             flag: '🇩🇪', region: 'europe' },
  { code: 'LV', name: '라트비아',         flag: '🇱🇻', region: 'europe' },
  { code: 'RU', name: '러시아',           flag: '🇷🇺', region: 'europe' },
  { code: 'RO', name: '루마니아',         flag: '🇷🇴', region: 'europe' },
  { code: 'LU', name: '룩셈부르크',       flag: '🇱🇺', region: 'europe' },
  { code: 'LT', name: '리투아니아',       flag: '🇱🇹', region: 'europe' },
  { code: 'LI', name: '리히텐슈타인',     flag: '🇱🇮', region: 'europe' },
  { code: 'MO', name: '마카오',           flag: '🇲🇴', region: 'asia' },
  { code: 'MY', name: '말레이시아',       flag: '🇲🇾', region: 'asia' },
  { code: 'ME', name: '몬테네그로',       flag: '🇲🇪', region: 'europe' },
  { code: 'MT', name: '몰타',             flag: '🇲🇹', region: 'europe' },
  { code: 'BE', name: '벨기에',           flag: '🇧🇪', region: 'europe' },
  { code: 'BY', name: '벨라루스',         flag: '🇧🇾', region: 'europe' },
  { code: 'BA', name: '보스니아 헤르체고비나', flag: '🇧🇦', region: 'europe' },
  { code: 'MK', name: '북마케도니아',     flag: '🇲🇰', region: 'europe' },
  { code: 'BG', name: '불가리아',         flag: '🇧🇬', region: 'europe' },
  { code: 'MP', name: '사이판',           flag: '🇲🇵', region: 'oceania' },
  { code: 'SA', name: '사우디아라비아',   flag: '🇸🇦', region: 'mideast' },
  { code: 'RS', name: '세르비아',         flag: '🇷🇸', region: 'europe' },
  { code: 'SE', name: '스웨덴',           flag: '🇸🇪', region: 'europe' },
  { code: 'CH', name: '스위스',           flag: '🇨🇭', region: 'europe' },
  { code: 'ES', name: '스페인',           flag: '🇪🇸', region: 'europe' },
  { code: 'SK', name: '슬로바키아',       flag: '🇸🇰', region: 'europe' },
  { code: 'SI', name: '슬로베니아',       flag: '🇸🇮', region: 'europe' },
  { code: 'SG', name: '싱가포르',         flag: '🇸🇬', region: 'asia' },
  { code: 'IS', name: '아이슬란드',       flag: '🇮🇸', region: 'europe' },
  { code: 'AE', name: '아랍에미리트',     flag: '🇦🇪', region: 'mideast' },
  { code: 'GB', name: '영국',             flag: '🇬🇧', region: 'europe' },
  { code: 'AT', name: '오스트리아',       flag: '🇦🇹', region: 'europe' },
  { code: 'AU', name: '호주',             flag: '🇦🇺', region: 'oceania' },
  { code: 'IT', name: '이탈리아',         flag: '🇮🇹', region: 'europe' },
  { code: 'ID', name: '인도네시아',       flag: '🇮🇩', region: 'asia' },
  { code: 'IN', name: '인도',             flag: '🇮🇳', region: 'asia' },
  { code: 'IL', name: '이스라엘',         flag: '🇮🇱', region: 'mideast' },
  { code: 'EG', name: '이집트',           flag: '🇪🇬', region: 'africa' },
  { code: 'PT', name: '포르투갈',         flag: '🇵🇹', region: 'europe' },
  { code: 'PL', name: '폴란드',           flag: '🇵🇱', region: 'europe' },
  { code: 'FI', name: '핀란드',           flag: '🇫🇮', region: 'europe' },
  { code: 'HU', name: '헝가리',           flag: '🇭🇺', region: 'europe' },
  { code: 'HK', name: '홍콩',             flag: '🇭🇰', region: 'asia' },
  { code: 'HR', name: '크로아티아',       flag: '🇭🇷', region: 'europe' },
  { code: 'CZ', name: '체코',             flag: '🇨🇿', region: 'europe' },
  { code: 'CA', name: '캐나다',           flag: '🇨🇦', region: 'americas' },
  { code: 'KH', name: '캄보디아',         flag: '🇰🇭', region: 'asia' },
  { code: 'TR', name: '튀르키예',         flag: '🇹🇷', region: 'mideast' },
  { code: 'MX', name: '멕시코',           flag: '🇲🇽', region: 'americas' },
  { code: 'ZA', name: '남아프리카공화국', flag: '🇿🇦', region: 'africa' },
  { code: 'MM', name: '미얀마',           flag: '🇲🇲', region: 'asia' },
].filter((c, i, arr) => arr.findIndex(x => x.code === c.code) === i)

// Price per day (KRW) by region and data tier
const DAY_PRICES = {
  asia:     { unlimited: 4300, '1gb': 1400, '500mb': 1050, '300mb': 770 },
  china:    { unlimited: 8800, '1gb': 3000, '500mb': 2200, '300mb': 1600 },
  oceania:  { unlimited: 6200, '1gb': 2100, '500mb': 1550, '300mb': 1100 },
  europe:   { unlimited: 10500, '1gb': 3600, '500mb': 2600, '300mb': 1900 },
  americas: { unlimited: 8200, '1gb': 2900, '500mb': 2100, '300mb': 1500 },
  mideast:  { unlimited: 7200, '1gb': 2500, '500mb': 1800, '300mb': 1300 },
  africa:   { unlimited: 8500, '1gb': 2900, '500mb': 2100, '300mb': 1500 },
}

function getDays(start, end) {
  if (!start || !end) return 0
  return Math.max(1, Math.round((new Date(end) - new Date(start)) / 86400000) + 1)
}

function getPlans(country, type, days) {
  const p = DAY_PRICES[country.region] || DAY_PRICES.asia
  const f = type === 'local' ? 1.1 : 1.0
  const round = (v) => Math.round(v * f * days / 100) * 100
  return [
    { id: 'unlimited', name: '무제한', desc: '마음껏 자유롭게 쓰고 싶다면', price: round(p.unlimited) },
    { id: '1gb',       name: '매일 1GB 이후 속도 저하', desc: '지도·간단한 검색 위주라면', price: round(p['1gb']) },
    { id: '500mb',     name: '매일 500MB 이후 속도 저하', desc: '지도·검색만 이용한다면', price: round(p['500mb']) },
    { id: '300mb',     name: '매일 300MB 이후 속도 저하', desc: '적당한 데이터 사용에 적합해요', price: round(p['300mb']) },
  ]
}

const fmt = (n) => n.toLocaleString('ko-KR') + '원'
const fmtDate = (d) => { if (!d) return ''; const [y, m, day] = d.split('-'); return `${y}년 ${m}월 ${day}일` }

function genESimCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ0123456789'
  const seg = () => Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  return `${seg()}-${seg()}-${seg()}-${seg()}`
}

export default function ESimPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState([])
  const [configs, setConfigs] = useState({})

  // modal state
  const [activating, setActivating] = useState(null)
  const [modalStep, setModalStep] = useState(null)
  const [tempType, setTempType] = useState('local')
  const [tempStart, setTempStart] = useState('')
  const [tempEnd, setTempEnd] = useState('')
  const [tempPlan, setTempPlan] = useState(null)

  const [email, setEmail] = useState('')
  const [purchasing, setPurchasing] = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [showDeviceModal, setShowDeviceModal] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return COUNTRIES
    return COUNTRIES.filter(c => c.name.includes(search.trim()) || c.code.toLowerCase().includes(q))
  }, [search])

  const toggleCountry = (c) => {
    setSelected(prev => {
      if (prev.find(x => x.code === c.code)) {
        setConfigs(cfg => { const n = { ...cfg }; delete n[c.code]; return n })
        return prev.filter(x => x.code !== c.code)
      }
      return [...prev, c]
    })
  }

  const openModal = (c) => {
    setActivating(c)
    const existing = configs[c.code]
    setTempType(existing?.type || 'local')
    setTempStart(existing?.start || '')
    setTempEnd(existing?.end || '')
    setTempPlan(existing?.plan || null)
    setModalStep('type')
  }

  const closeModal = () => { setModalStep(null); setActivating(null) }

  const confirmPlan = () => {
    if (!tempPlan) return
    const days = getDays(tempStart, tempEnd)
    setConfigs(prev => ({
      ...prev,
      [activating.code]: { type: tempType, start: tempStart, end: tempEnd, plan: tempPlan, days },
    }))
    closeModal()
  }

  const allConfigured = selected.length > 0 && selected.every(c => configs[c.code])
  const totalPrice = selected.reduce((s, c) => s + (configs[c.code]?.plan?.price || 0), 0)

  const handlePurchase = async () => {
    if (!email) { alert('이메일을 입력해주세요.'); return }
    setPurchasing(true)
    const code = genESimCode()
    try {
      await purchaseEsim({
        email,
        countries: selected.map(c => ({ ...c, config: configs[c.code] })),
        totalPrice,
        code,
      })
    } catch {}
    setConfirmation({ code, countries: selected, configs, totalPrice, email })
    setStep(3)
    setPurchasing(false)
  }

  // ── Step 0: Landing ──────────────────────────────────────────────────────────
  if (step === 0) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      <div className="esim-landing">
        <div className="esim-landing-notice">
          <span className="esim-notice-icon">ⓘ</span>
          잠깐! 이용 가능 기기인가요?
          <span className="esim-notice-link" onClick={() => setShowDeviceModal(true)}>이용 가능 기기 →</span>
        </div>

        <div className="esim-landing-hero">
          <h1 className="esim-landing-title">간편 이심</h1>
          <div className="esim-landing-card">
            <p className="esim-landing-sub">1분 만에 나에게 맞는<br />eSIM을 찾아보세요</p>
            <div className="esim-chip-visual">
              <div className="esim-chip-icon">📱</div>
              <div className="esim-chip-badge">eSIM</div>
            </div>
            <button className="esim-start-btn" onClick={() => setStep(1)}>나에게 맞는 eSIM 찾기</button>
          </div>
        </div>

        <div className="esim-features-section">
          <h2 className="esim-features-title">왜 eSIM은 AIR일까요?</h2>
          <div className="esim-features-list">
            {[
              ['📞', '문제상황 완벽대응', '24시간 안심 고객센터'],
              ['🔄', '제품 결함시', '100% 환불 보장'],
              ['📶', '끊김없는 데이터', '뛰어난 데이터 안정성'],
              ['🎁', '센스있는 여행 선물', '간편한 선물하기 기능'],
            ].map(([icon, sub, main]) => (
              <div key={main} className="esim-feature-item">
                <div className="esim-feature-icon">{icon}</div>
                <div>
                  <div className="esim-feature-sub">{sub}</div>
                  <div className="esim-feature-main">{main}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="esim-features-note">실제 판매되는 eSIM이 아닙니다.</p>
        </div>
      </div>

      {/* 이용 가능 기기 모달 */}
      {showDeviceModal && (
        <div className="esim-overlay" onClick={() => setShowDeviceModal(false)}>
          <div className="esim-modal esim-device-modal" onClick={e => e.stopPropagation()}>
            <div className="esim-device-header">
              <span className="esim-device-title">이용 가능 기기</span>
              <button className="esim-modal-x" style={{ position: 'static', fontSize: 20 }} onClick={() => setShowDeviceModal(false)}>×</button>
            </div>

            <div className="esim-device-section">
              <div className="esim-device-brand">Samsung</div>
              <ul className="esim-device-list">
                <li>Z Fold 7, Z Flip 7, Z Fold 6, Z Flip 6, Z Fold 5, Z Fold 4, Z Flip 4</li>
                <li>S23 Series, S24 Series, S25 Series</li>
              </ul>
            </div>

            <div className="esim-device-section">
              <div className="esim-device-brand">Apple</div>
              <ul className="esim-device-list">
                <li>iPhone XR, iPhone XS, iPhone XS Max</li>
                <li>iPhone SE (2세대), iPhone SE (3세대)</li>
                <li>iPhone 11 Series, iPhone 12 Series, iPhone 13 Series, iPhone 14 Series, iPhone 15 Series, iPhone 16 Series, iPhone 17 Series</li>
              </ul>
            </div>

            <div className="esim-device-note">
              출시 국가가 중국 본토, 홍콩, 마카오인 기기는 eSIM을 지원하지 않아요. (단, iPhone 13 Mini, iPhone 12 Mini, iPhone SE 2020 및 iPhone XS는 지원됨)
            </div>

            <div className="esim-device-check-section">
              <div className="esim-device-brand" style={{ marginBottom: 10 }}>가능한 기종인지 확인하기</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 12 }}>
                · 전화 키패드 &gt; *#06# 입력 &gt; "EID"가 있다면 사용 가능!
              </div>
              <div className="esim-dialpad-demo">
                <div className="esim-dialpad-display">*#06#</div>
                <div className="esim-dialpad-eid">
                  <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 2 }}>EID</div>
                  <div style={{ fontSize: 11, fontFamily: 'monospace', color: '#374151' }}>89283244153534542342342342323234235</div>
                  <div style={{ marginTop: 6, fontSize: 18, letterSpacing: 6, color: '#374151' }}>▌▌▌▌ ▌▌ ▌▌▌▌▌▌▌▌▌</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Step 1: Country selection ────────────────────────────────────────────────
  if (step === 1) return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header />
      <div className="esim-country-page">
        <button className="esim-back" onClick={() => setStep(0)}>←</button>
        <h2 className="esim-page-title">여행할 국가를 모두<br />선택해주세요.</h2>

        <div className="esim-country-search">
          <span className="esim-search-icon">🔍</span>
          <input
            className="esim-search-input"
            placeholder="도시, 국가명 검색"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="esim-country-grid">
          {filtered.map(c => {
            const isSelected = !!selected.find(x => x.code === c.code)
            return (
              <button
                key={c.code}
                className={`esim-country-btn${isSelected ? ' esim-country-selected' : ''}`}
                onClick={() => toggleCountry(c)}
              >
                <img
                  className="esim-flag-img"
                  src={`https://flagcdn.com/w80/${c.code.toLowerCase()}.png`}
                  alt={c.name}
                  onError={e => { e.target.style.display = 'none' }}
                />
                <div className="esim-country-name">{c.name}</div>
              </button>
            )
          })}
        </div>

        <div className="esim-country-footer">
          <button
            className="esim-next-btn"
            disabled={selected.length === 0}
            onClick={() => setStep(2)}
          >
            다음 {selected.length > 0 ? `(${selected.length}개 선택)` : ''}
          </button>
        </div>
      </div>
    </div>
  )

  // ── Step 2: Product combination ──────────────────────────────────────────────
  if (step === 2) return (
    <div style={{ minHeight: '100vh', background: '#fff' }}>
      <Header />
      <div className="esim-combo-page">
        <button className="esim-back" onClick={() => setStep(1)}>←</button>
        <h2 className="esim-combo-title">
          가격과 사용 국가를 고려한<br />
          <span className="esim-combo-highlight">최적의 상품 조합</span>이에요
          <span className="esim-combo-info"> ⓘ</span>
        </h2>

        <div className="esim-combo-list">
          {selected.map(c => {
            const cfg = configs[c.code]
            const minPrice = fmt((DAY_PRICES[c.region]?.['300mb'] || 770))
            return (
              <div key={c.code} className="esim-combo-card">
                <div className="esim-combo-row">
                  <div className="esim-combo-check">
                    <div className={`esim-check-circle${cfg ? ' checked' : ''}`}>
                      {cfg && <span>✓</span>}
                    </div>
                  </div>
                  <span className="esim-combo-country-name">{c.flag} {c.name}</span>
                  <span className="esim-combo-price">
                    {cfg ? fmt(cfg.plan.price) : `${minPrice}~`}
                  </span>
                </div>
                {cfg ? (
                  <div className="esim-combo-detail">
                    <span className="esim-combo-summary">
                      {cfg.type === 'local' ? '로컬망' : '로밍망'} / {cfg.days}일 / {cfg.plan.name} / 1개
                    </span>
                    <button className="esim-reselect" onClick={() => openModal(c)}>다시 선택하기</button>
                  </div>
                ) : (
                  <div className="esim-combo-detail">
                    <button className="esim-select-plan" onClick={() => openModal(c)}>플랜 선택하기</button>
                  </div>
                )}
              </div>
            )
          })}
          <div className="esim-best-notice">✓ 가장 합리적인 가격이에요.</div>
        </div>

        <div className="esim-email-section">
          <input
            type="email"
            className="esim-email-input"
            placeholder="eSIM 정보를 받을 이메일 주소"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
        </div>

        <div className="esim-combo-footer">
          <button
            className="esim-purchase-btn"
            disabled={!allConfigured || !email || purchasing}
            onClick={handlePurchase}
          >
            {purchasing ? '처리 중...' : `구매하기${totalPrice > 0 ? ` · ${fmt(totalPrice)}` : ''}`}
          </button>
        </div>
      </div>

      {/* ── Type modal ── */}
      {activating && modalStep === 'type' && (
        <div className="esim-overlay" onClick={closeModal}>
          <div className="esim-modal" onClick={e => e.stopPropagation()}>
            <button className="esim-modal-x" onClick={closeModal}>×</button>
            <h3 className="esim-modal-title">eSIM 종류를 선택해주세요.</h3>
            <div className="esim-type-options">
              {[
                { key: 'roaming', label: '로밍망', desc: '가격이 합리적이에요', factor: 1.0 },
                { key: 'local',   label: '로컬망', desc: '속도가 빠르고 안정적이에요', factor: 1.1 },
              ].map(({ key, label, desc, factor }) => {
                const baseDay = DAY_PRICES[activating.region]?.['300mb'] || 770
                return (
                  <div
                    key={key}
                    className={`esim-type-opt${tempType === key ? ' selected' : ''}`}
                    onClick={() => setTempType(key)}
                  >
                    <div className="esim-type-label">{label}</div>
                    <div className="esim-type-desc">{desc}</div>
                    <div className="esim-type-price">{fmt(Math.round(baseDay * factor / 10) * 10)}~</div>
                  </div>
                )
              })}
            </div>
            <div className="esim-modal-footer">
              <button className="esim-btn-cancel" onClick={closeModal}>취소</button>
              <button className="esim-btn-next" onClick={() => setModalStep('dates')}>다음</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Dates modal ── */}
      {activating && modalStep === 'dates' && (
        <div className="esim-overlay">
          <div className="esim-modal" onClick={e => e.stopPropagation()}>
            <button className="esim-modal-x" onClick={closeModal}>×</button>
            <h3 className="esim-modal-title">
              {activating.name}에<br />얼마 동안 머무시나요?
            </h3>
            <div className="esim-dates">
              <div className="esim-date-row">
                <input
                  type="date"
                  className="esim-date-input"
                  value={tempStart}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={e => setTempStart(e.target.value)}
                />
                <span className="esim-date-label">부터</span>
              </div>
              <div className="esim-date-row">
                <input
                  type="date"
                  className="esim-date-input"
                  value={tempEnd}
                  min={tempStart || new Date().toISOString().split('T')[0]}
                  onChange={e => setTempEnd(e.target.value)}
                />
                <span className="esim-date-label">까지 여행해요</span>
              </div>
              {tempStart && tempEnd && getDays(tempStart, tempEnd) > 0 && (
                <div className="esim-nights-label">
                  {getDays(tempStart, tempEnd) - 1}박 {getDays(tempStart, tempEnd)}일
                </div>
              )}
            </div>
            <div className="esim-modal-footer">
              <button className="esim-btn-cancel" onClick={() => setModalStep('type')}>이전</button>
              <button className="esim-btn-next" disabled={!tempStart || !tempEnd} onClick={() => setModalStep('plan')}>다음</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Plan modal ── */}
      {activating && modalStep === 'plan' && (
        <div className="esim-overlay">
          <div className="esim-modal esim-modal-tall" onClick={e => e.stopPropagation()}>
            <button className="esim-modal-x" onClick={closeModal}>×</button>
            <h3 className="esim-modal-title">
              {getDays(tempStart, tempEnd)}일 동안<br />사용할 플랜을 골라주세요
            </h3>
            <div className="esim-plans">
              <div className="esim-plans-header">추천 플랜</div>
              {getPlans(activating, tempType, getDays(tempStart, tempEnd)).map(plan => (
                <div
                  key={plan.id}
                  className={`esim-plan-item${tempPlan?.id === plan.id ? ' selected' : ''}`}
                  onClick={() => setTempPlan(plan)}
                >
                  <div>
                    <div className="esim-plan-desc">{plan.desc}</div>
                    <div className="esim-plan-name">{plan.name}</div>
                  </div>
                  <div className="esim-plan-price">{fmt(plan.price)}</div>
                </div>
              ))}
            </div>
            <div className="esim-modal-footer">
              <button className="esim-btn-cancel" onClick={() => setModalStep('dates')}>이전</button>
              <button className="esim-btn-next" disabled={!tempPlan} onClick={confirmPlan}>선택 완료</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── Step 3: Confirmation ─────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />
      <div className="esim-confirm-page">
        <div className="esim-confirm-icon">✅</div>
        <h2 className="esim-confirm-title">eSIM 구매가 완료되었습니다!</h2>
        <p className="esim-confirm-email-notice">
          {confirmation?.email}로 활성화 코드가 발송되었습니다.
        </p>

        <div className="esim-confirm-code-box">
          <div className="esim-confirm-code-label">eSIM 활성화 코드</div>
          <div className="esim-confirm-code-value">{confirmation?.code}</div>
        </div>

        <div className="esim-confirm-countries">
          {confirmation?.countries.map(c => {
            const cfg = confirmation.configs[c.code]
            return (
              <div key={c.code} className="esim-confirm-row">
                <span>{c.flag} {c.name}</span>
                <span className="esim-confirm-row-detail">
                  {cfg.type === 'local' ? '로컬망' : '로밍망'} · {cfg.days}일 · {cfg.plan.name}
                </span>
                <span className="esim-confirm-row-price">{fmt(cfg.plan.price)}</span>
              </div>
            )
          })}
        </div>

        <div className="esim-confirm-total">
          총 결제금액 <strong>{fmt(confirmation?.totalPrice || 0)}</strong>
        </div>

        <div className="esim-confirm-guide">
          <div className="esim-guide-title">eSIM 설치 방법</div>
          <ol className="esim-guide-list">
            <li>기기 설정 → 이동통신 → eSIM 추가</li>
            <li>QR 코드 스캔 또는 위 활성화 코드 수동 입력</li>
            <li>설치 완료 후 여행지 도착 시 자동 연결</li>
          </ol>
        </div>

        <button className="esim-home-btn" onClick={() => navigate('/')}>홈으로 돌아가기</button>
        <div className="esim-confirm-note">테스트 모드 - 실제 결제가 이루어지지 않습니다</div>
      </div>
    </div>
  )
}
