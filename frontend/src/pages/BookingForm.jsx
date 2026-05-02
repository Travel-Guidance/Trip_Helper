import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Header from '../components/Header'
import { formatTime, formatDateShort, parseDuration, formatDuration, formatPrice, getStopsText } from '../utils'
import { useOffer } from '../hooks/useOffer'
import { createOrder } from '../services/flightApi'

function SliceSummary({ slice }) {
  const first = slice.segments[0]
  const last = slice.segments[slice.segments.length - 1]
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 16, fontWeight: 700 }}>
        {first?.origin?.iata_code} → {last?.destination?.iata_code}
      </div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
        {formatDateShort(first?.departing_at)} &nbsp;
        {formatTime(first?.departing_at)} → {formatTime(last?.arriving_at)} &nbsp;·&nbsp;
        {formatDuration(parseDuration(slice.duration))} &nbsp;·&nbsp;
        {getStopsText(slice.segments)}
      </div>
    </div>
  )
}

const TITLES = ['mr', 'ms', 'mrs', 'miss', 'dr']
const TITLE_LABELS = { mr: 'Mr.', ms: 'Ms.', mrs: 'Mrs.', miss: 'Miss', dr: 'Dr.' }

export default function BookingForm() {
  const { offerId } = useParams()
  const navigate = useNavigate()
  const { offer, loading, error: offerError } = useOffer(offerId)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [passengers, setPassengers] = useState([])

  useEffect(() => {
    if (offer) {
      setPassengers(
        offer.passengers.map((p) => ({
          id: p.id,
          title: 'mr',
          given_name: '',
          family_name: '',
          born_on: '',
          gender: 'm',
          email: '',
          phone_number: '+82',
        }))
      )
    }
  }, [offer])

  const updatePassenger = (idx, field, value) => {
    setPassengers((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], [field]: value }
      return next
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setSubmitError(null)

    try {
      const services = JSON.parse(sessionStorage.getItem('selected_services') || '[]')
      const data = await createOrder({ offerId, passengers, services })
      sessionStorage.removeItem('selected_offer')
      sessionStorage.removeItem('selected_services')
      navigate(`/confirmation/${data.id}`, { state: { order: data } })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Header />
        <div className="loading-box" style={{ maxWidth: 900, margin: '40px auto', borderRadius: 12 }}>
          <div className="spinner" />
          항공편 정보를 불러오는 중...
        </div>
      </div>
    )
  }

  if (offerError && !offer) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <Header />
        <div className="error-box" style={{ maxWidth: 900, margin: '40px auto' }}>오류: {offerError}</div>
      </div>
    )
  }

  const totalAmount = formatPrice(offer?.total_amount, offer?.total_currency)
  const taxAmount = formatPrice(offer?.tax_amount, offer?.total_currency)
  const baseAmount = formatPrice(offer?.base_amount, offer?.total_currency)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Header />

      <div className="page-hero">
        <div className="page-hero-inner">
          <div className="page-hero-route">승객 정보 입력</div>
          <div className="page-hero-detail">예약을 완료하려면 승객 정보를 정확하게 입력해주세요</div>
        </div>
      </div>

      <form className="booking-layout" onSubmit={handleSubmit}>
        <div className="booking-main">
          {/* 선택된 항공편 요약 */}
          {offer && (
            <div className="booking-card">
              <div className="booking-card-title">선택한 항공편</div>
              {offer.slices.map((slice, i) => (
                <div key={slice.id}>
                  {offer.slices.length > 1 && (
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>
                      {i === 0 ? '가는 편' : '오는 편'}
                    </div>
                  )}
                  <SliceSummary slice={slice} />
                </div>
              ))}
            </div>
          )}

          {/* 승객 정보 폼 */}
          {passengers.map((pax, idx) => (
            <div key={pax.id} className="booking-card">
              <div className="booking-card-title">
                승객 {idx + 1} 정보 {passengers.length > 1 && `(성인 ${idx + 1})`}
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">호칭</label>
                  <select
                    className="form-select"
                    value={pax.title}
                    onChange={(e) => updatePassenger(idx, 'title', e.target.value)}
                    required
                  >
                    {TITLES.map((t) => (
                      <option key={t} value={t}>{TITLE_LABELS[t]}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">성별</label>
                  <select
                    className="form-select"
                    value={pax.gender}
                    onChange={(e) => updatePassenger(idx, 'gender', e.target.value)}
                    required
                  >
                    <option value="m">남성</option>
                    <option value="f">여성</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">성 (영문)</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="예: KIM"
                    value={pax.family_name}
                    onChange={(e) => updatePassenger(idx, 'family_name', e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">이름 (영문)</label>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="예: GILDONG"
                    value={pax.given_name}
                    onChange={(e) => updatePassenger(idx, 'given_name', e.target.value.toUpperCase())}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">생년월일</label>
                  <input
                    className="form-input"
                    type="date"
                    value={pax.born_on}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => updatePassenger(idx, 'born_on', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">연락처 (국제전화번호)</label>
                  <input
                    className="form-input"
                    type="tel"
                    placeholder="+821012345678"
                    value={pax.phone_number}
                    onChange={(e) => updatePassenger(idx, 'phone_number', e.target.value)}
                    required
                  />
                </div>
                <div className="form-group full">
                  <label className="form-label">이메일</label>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="example@email.com"
                    value={pax.email}
                    onChange={(e) => updatePassenger(idx, 'email', e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>
          ))}

          {submitError && <div className="error-box">{submitError}</div>}
        </div>

        {/* 주문 요약 */}
        <aside>
          <div className="order-summary">
            <div className="summary-title">결제 요약</div>

            {offer?.slices.map((slice, i) => {
              const first = slice.segments[0]
              const last = slice.segments[slice.segments.length - 1]
              return (
                <div key={slice.id} className="summary-flight">
                  {offer.slices.length > 1 && (
                    <div className="summary-slice-label">{i === 0 ? '가는 편' : '오는 편'}</div>
                  )}
                  <div className="summary-route">
                    {first?.origin?.iata_code} → {last?.destination?.iata_code}
                  </div>
                  <div className="summary-detail">
                    {formatTime(first?.departing_at)} → {formatTime(last?.arriving_at)}
                  </div>
                </div>
              )
            })}

            <div className="summary-divider" />

            <div className="summary-price-row">
              <span>항공요금</span>
              <span>{baseAmount}</span>
            </div>
            <div className="summary-price-row">
              <span>세금 및 수수료</span>
              <span>{taxAmount}</span>
            </div>
            <div className="summary-total-row">
              <span>총 결제금액</span>
              <span style={{ color: 'var(--primary)' }}>{totalAmount}</span>
            </div>

            <button
              type="submit"
              className="book-btn"
              disabled={submitting}
            >
              {submitting ? '예약 처리 중...' : '결제하기'}
            </button>

            <div style={{ fontSize: 12, color: 'var(--text-light)', textAlign: 'center', marginTop: 12 }}>
              테스트 모드 - 실제 결제가 이루어지지 않습니다
            </div>
          </div>
        </aside>
      </form>
    </div>
  )
}
