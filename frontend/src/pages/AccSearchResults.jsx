import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, MapPin, Search, SlidersHorizontal, User, X } from 'lucide-react'
import BottomNav from '../components/layout/BottomNav'
import Navbar from '../components/layout/Navbar'
import DestinationSearch from '../components/accommodation/DestinationSearch'
import AccomCalendar, { formatKo } from '../components/accommodation/AccomCalendar'
import { formatKrwPrice, toKrw } from '../utils/currency'
import { searchStays } from '../api/accommodationApi'
import { getCountryCode } from '../data/mockHotels'
import '../styles/accommodation.css'

function getDefaultDates() {
  const ci = new Date()
  ci.setDate(ci.getDate() + 30)
  const co = new Date(ci)
  co.setDate(co.getDate() + 1)
  const fmt = (d) => d.toISOString().slice(0, 10)
  return { checkIn: fmt(ci), checkOut: fmt(co) }
}

const SORT_OPTIONS = {
  rating: { value: 'rating', label: '고객평점순' },
  priceLow: { value: 'priceLow', label: '낮은가격순' },
  priceHigh: { value: 'priceHigh', label: '높은가격순' },
}

const AI_ACCOM_BOOKING_SOURCE = 'ai-generation-schedule'

function formatDateLabel(value) {
  if (!value) return ''
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return `${String(date.getMonth() + 1).padStart(2, '0')}월 ${String(date.getDate()).padStart(2, '0')}일`
}

function hasValue(value) {
  return value !== null && value !== undefined && value !== ''
}

function compactAmenities(amenities) {
  if (!Array.isArray(amenities)) return []
  return amenities
    .map(item => typeof item === 'string' ? item : item?.text || item?.name)
    .filter(Boolean)
    .slice(0, 3)
}

function isSameBookingSearch(current, queued) {
  if (!queued) return false
  return ['countryKey', 'destination', 'checkIn', 'checkOut', 'guests', 'children']
    .every(key => String(current[key] || '') === String(queued[key] || ''))
}

export default function AccSearchResults() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const countryKey = searchParams.get('countryKey') || ''
  const countryCode = searchParams.get('countryCode') || countryKey
  const destination = searchParams.get('destination') || countryKey
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = Number(searchParams.get('guests') || 2)

  const [editDest,        setEditDest]        = useState(destination)
  const [editCountryKey,  setEditCountryKey]  = useState(countryKey)
  const [editCountryCode, setEditCountryCode] = useState(countryCode)
  const [editCheckIn,     setEditCheckIn]     = useState(checkIn)
  const [editCheckOut,    setEditCheckOut]    = useState(checkOut)
  const [editAdults,      setEditAdults]      = useState(guests)
  const [editChildren,    setEditChildren]    = useState(Number(searchParams.get('children') || 0))
  const [calOpen,         setCalOpen]         = useState(false)
  const [destOpen,        setDestOpen]        = useState(false)
  const [guestOpen,       setGuestOpen]       = useState(false)

  const editGuestLabel = [
    `성인 ${editAdults}명`,
    editChildren > 0 ? `아동 ${editChildren}명` : '',
  ].filter(Boolean).join(' · ')

  const handleSearch = () => {
    if (!editCountryKey && !editDest) return
    const defaults = getDefaultDates()
    const params = new URLSearchParams({
      destination: editDest || editCountryKey || '',
      countryKey:  editCountryKey || '',
      countryCode: editCountryCode || getCountryCode(editCountryKey),
      checkIn:     editCheckIn  || defaults.checkIn,
      checkOut:    editCheckOut || defaults.checkOut,
      guests:      String(editAdults),
      children:    String(editChildren),
    })
    setGuestOpen(false)
    navigate(`/accommodation/results?${params}`)
  }

  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('')

  const bookingQueue = useMemo(() => {
    try {
      const source = sessionStorage.getItem('accom_booking_source')
      if (source !== AI_ACCOM_BOOKING_SOURCE) return null

      const queue = JSON.parse(sessionStorage.getItem('accom_booking_queue') || 'null')
      const idx   = Number(sessionStorage.getItem('accom_booking_index') || '0')
      const current = {
        countryKey,
        destination,
        checkIn,
        checkOut,
        guests: String(guests),
        children: String(searchParams.get('children') || 0),
      }
      return queue && isSameBookingSearch(current, queue[idx]) ? { items: queue, index: idx } : null
    } catch { return null }
  }, [checkIn, checkOut, countryKey, destination, guests, searchParams])

  const goNextBooking = () => {
    if (!bookingQueue) return
    const nextIndex = bookingQueue.index + 1
    if (nextIndex >= bookingQueue.items.length) {
      const returnUrl = sessionStorage.getItem('accom_return_url') || '/accommodation'
      sessionStorage.removeItem('accom_booking_queue')
      sessionStorage.removeItem('accom_booking_index')
      sessionStorage.removeItem('accom_return_url')
      sessionStorage.removeItem('accom_booking_source')
      navigate(returnUrl)
      return
    }
    sessionStorage.setItem('accom_booking_index', String(nextIndex))
    const { name: _n, ...next } = bookingQueue.items[nextIndex]
    navigate(`/accommodation/results?${new URLSearchParams(next)}`)
  }

  useEffect(() => {
    if (!countryKey) {
      setError('여행지를 선택해주세요.')
      setLoading(false)
      return
    }

    searchStays({ country: countryKey, countryCode, destination, checkIn, checkOut, guests })
      .then(data => {
        setHotels(data)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message || '검색 중 오류가 발생했습니다.')
        setLoading(false)
      })
  }, [countryKey, countryCode, checkIn, checkOut, guests])

  const nights = checkIn && checkOut
    ? Math.max(1, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 1

  const supportsRating = hotels.some(hotel => hasValue(hotel.reviewScore))
  const supportsPrice = hotels.some(hotel => Number(hotel.price) > 0)
  const sortOptions = [
    supportsRating && SORT_OPTIONS.rating,
    supportsPrice && SORT_OPTIONS.priceLow,
    supportsPrice && SORT_OPTIONS.priceHigh,
  ].filter(Boolean)

  useEffect(() => {
    if (sortBy && !sortOptions.some(option => option.value === sortBy)) setSortBy('')
  }, [sortBy, sortOptions])

  const filtered = [...hotels].sort((a, b) => {
    if (sortBy === 'priceLow') return toKrw(a.price, a.currency) - toKrw(b.price, b.currency)
    if (sortBy === 'priceHigh') return toKrw(b.price, b.currency) - toKrw(a.price, a.currency)
    if (sortBy === 'rating') return Number(b.reviewScore || 0) - Number(a.reviewScore || 0)
    return 0
  })

  const goDetail = (hotel) => {
    const params = new URLSearchParams({
      destination,
      countryKey,
      countryCode,
      checkIn,
      checkOut,
      guests: String(guests),
    })
    navigate(`/accommodation/${hotel.id}?${params}`, { state: { hotel } })
  }

  return (
    <div className="asr-page">
      <Navbar />

      <div className="asr-search-panel">
        <div className="asr-search-cell asr-search-cell--btn" onClick={() => setDestOpen(true)}>
          <Search size={24} />
          <div>
            <span>여행지</span>
            <strong>{editDest || '여행지 선택'}</strong>
          </div>
          {editDest && (
            <X size={20} className="asr-search-clear"
              onClick={e => { e.stopPropagation(); setEditDest(''); setEditCountryKey(''); setEditCountryCode('') }}
            />
          )}
        </div>

        <div className="asr-search-cell asr-search-cell--btn" onClick={() => setCalOpen(true)}>
          <CalendarDays size={24} />
          <div>
            <span>일정</span>
            <strong>
              {editCheckIn ? formatKo(editCheckIn) : '체크인'} - {editCheckOut ? formatKo(editCheckOut) : '체크아웃'}
            </strong>
          </div>
          {(editCheckIn || editCheckOut) && (
            <X size={20} className="asr-search-clear"
              onClick={e => { e.stopPropagation(); setEditCheckIn(''); setEditCheckOut('') }}
            />
          )}
        </div>

        <div className="asr-search-cell asr-guest-wrap" style={{ position: 'relative' }}>
          <div className="asr-search-cell--btn" style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}
            onClick={() => setGuestOpen(o => !o)}>
            <User size={24} />
            <div>
              <span>숙박 인원</span>
              <strong>{editGuestLabel}</strong>
            </div>
          </div>
          {guestOpen && (
            <>
              <div className="ac-guest-dimmer" onClick={() => setGuestOpen(false)} />
              <div className="ac-guest-dropdown">
                <div className="ac-guest-row">
                  <div className="ac-guest-row-info">
                    <span className="ac-guest-row-label">성인</span>
                    <span className="ac-guest-row-sub">만 18세 이상</span>
                  </div>
                  <div className="ac-guests-ctrl">
                    <button className="ac-guest-btn" onClick={() => setEditAdults(a => Math.max(1, a - 1))}>−</button>
                    <span className="ac-guests-num">{editAdults}</span>
                    <button className="ac-guest-btn" onClick={() => setEditAdults(a => a + 1)}>+</button>
                  </div>
                </div>
                <div className="ac-guest-row">
                  <div className="ac-guest-row-info">
                    <span className="ac-guest-row-label">청소년/아동</span>
                    <span className="ac-guest-row-sub">만 17세 이하</span>
                  </div>
                  <div className="ac-guests-ctrl">
                    <button className="ac-guest-btn" onClick={() => setEditChildren(c => Math.max(0, c - 1))}>−</button>
                    <span className="ac-guests-num">{editChildren}</span>
                    <button className="ac-guest-btn" onClick={() => setEditChildren(c => c + 1)}>+</button>
                  </div>
                </div>
                <button className="ac-guest-confirm" onClick={() => setGuestOpen(false)}>확인</button>
              </div>
            </>
          )}
        </div>

        <button className="asr-search-submit" onClick={handleSearch}>숙소 검색</button>
      </div>

      {bookingQueue && (
        <div className="asr-queue-banner">
          <div className="asr-queue-info">
            <p className="asr-queue-label">
              숙소 예약 진행 중 {bookingQueue.index + 1} / {bookingQueue.items.length}
            </p>
            <p className="asr-queue-name">
              {bookingQueue.items[bookingQueue.index]?.name}
            </p>
          </div>
          <div className="asr-queue-dots">
            {bookingQueue.items.map((_, i) => (
              <span
                key={i}
                className={`asr-queue-dot${i < bookingQueue.index ? ' done' : i === bookingQueue.index ? ' current' : ''}`}
              />
            ))}
          </div>
          {bookingQueue.index + 1 < bookingQueue.items.length ? (
            <button className="asr-queue-next-btn" onClick={goNextBooking}>
              다음 숙소 예약 →
            </button>
          ) : (
            <button className="asr-queue-done-btn" onClick={goNextBooking}>
              예약 완료
            </button>
          )}
        </div>
      )}

      <div className="asr-filter-bar">
        <button className="asr-filter-pill"><SlidersHorizontal size={19} /> 필터</button>
        {sortOptions.map(option => (
          <button
            key={option.value}
            className={`asr-filter-pill${sortBy === option.value ? ' active' : ''}`}
            onClick={() => setSortBy(current => current === option.value ? '' : option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="asr-body">
        <main className="asr-main">
          {loading ? (
            <div className="asr-list">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="asr-skeleton-card">
                  <div className="asr-skeleton-img" />
                  <div className="asr-skeleton-body">
                    <div className="ac-skeleton-line" />
                    <div className="ac-skeleton-line ac-skeleton-line--short" />
                    <div className="ac-skeleton-line ac-skeleton-line--short" />
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="asr-error">
              <p className="asr-error-msg">{error}</p>
              <button className="asr-error-btn" onClick={() => navigate('/accommodation')}>돌아가기</button>
            </div>
          ) : (
            <>
              <div className="asr-results-hd">
                <span className="asr-total">총 <b>{filtered.length}</b>개 숙소</span>
              </div>

              {filtered.length === 0 ? (
                <div className="asr-empty">조건에 맞는 숙소가 없습니다.</div>
              ) : (
                <div className="asr-list">
                  {filtered.map((hotel, idx) => {
                    const amenities = compactAmenities(hotel.amenities)
                    const displayPrice = hotel.displayPrice || formatKrwPrice(hotel.price, hotel.currency)
                    const hasPreviousPrice = hasValue(hotel.previousPrice) && hotel.previousPrice !== displayPrice

                    return (
                    <div key={`${hotel.id}_${idx}`} className="asr-card" onClick={() => goDetail(hotel)}>
                      <div className="asr-card-img-wrap">
                        {hotel.image
                          ? <img src={hotel.image} alt={hotel.name} className="asr-card-img" />
                          : <div className="asr-card-img asr-card-img--placeholder" />}
                        {hotel.priceBadge && <span className="asr-card-tag">{hotel.priceBadge}</span>}
                      </div>

                      <div className="asr-card-info">
                        <div className="asr-card-info-top">
                          {hotel.location && <p className="asr-card-location"><MapPin size={16} /> {hotel.location}</p>}
                          <p className="asr-card-name">{hotel.name}</p>

                          {hotel.reviewScore != null && (
                            <div className="asr-review-row">
                              <span className="asr-review-score">{Number(hotel.reviewScore).toFixed(1)}/10</span>
                              {hotel.reviewText && <span className="asr-review-text">{hotel.reviewText}</span>}
                              {hotel.reviewCountText && <span className="asr-review-count">{hotel.reviewCountText}</span>}
                            </div>
                          )}

                          {amenities.length > 0 && (
                            <div className="asr-amenities">
                              {amenities.map(item => <span key={item}>{item}</span>)}
                            </div>
                          )}
                        </div>

                        <div className="asr-card-info-bottom">
                          <div className="asr-price-note">
                            {hotel.pricePeriodText && <span>{hotel.pricePeriodText}</span>}
                          </div>
                          {Number(hotel.price) > 0 && (
                            <div className="asr-price-block">
                              {hasPreviousPrice && <span className="asr-prev-price">{hotel.previousPrice}</span>}
                              <span className="asr-price">{displayPrice}</span>
                              <span className="asr-price-sub">{hotel.totalPriceText || `총 ${nights}박 기준`}</span>
                              {hotel.taxText && <span className="asr-tax-text">{hotel.taxText}</span>}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {destOpen && (
        <DestinationSearch
          onSelect={(item) => {
            setEditDest(item.city)
            setEditCountryKey(item.key)
            setEditCountryCode(item.countryCode || getCountryCode(item.key, item.flag))
          }}
          onClose={() => setDestOpen(false)}
        />
      )}

      {calOpen && (
        <AccomCalendar
          checkIn={editCheckIn}
          checkOut={editCheckOut}
          onSelect={(ci, co) => { setEditCheckIn(ci); setEditCheckOut(co) }}
          onClose={() => setCalOpen(false)}
        />
      )}

      <BottomNav />
    </div>
  )
}
