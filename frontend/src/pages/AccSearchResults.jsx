import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CalendarDays, MapPin, Search, SlidersHorizontal, User, X } from 'lucide-react'
import BottomNav from '../components/layout/BottomNav'
import Navbar from '../components/layout/Navbar'
import { formatKrwPrice, toKrw } from '../utils/currency'
import { searchStays } from '../api/accommodationApi'
import '../styles/accommodation.css'

const SORT_OPTIONS = {
  rating: { value: 'rating', label: '고객평점순' },
  priceLow: { value: 'priceLow', label: '낮은가격순' },
  priceHigh: { value: 'priceHigh', label: '높은가격순' },
}

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

export default function AccSearchResults() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const countryKey = searchParams.get('countryKey') || ''
  const countryCode = searchParams.get('countryCode') || countryKey
  const destination = searchParams.get('destination') || countryKey
  const checkIn = searchParams.get('checkIn') || ''
  const checkOut = searchParams.get('checkOut') || ''
  const guests = Number(searchParams.get('guests') || 2)

  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('')

  useEffect(() => {
    if (!countryKey) {
      setError('여행지를 선택해주세요.')
      setLoading(false)
      return
    }

    searchStays({ country: countryKey, countryCode, checkIn, checkOut, guests })
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
        <div className="asr-search-cell">
          <Search size={24} />
          <div>
            <span>여행지</span>
            <strong>{destination || '여행지 선택'}</strong>
          </div>
          {destination && <X size={20} className="asr-search-clear" />}
        </div>

        <div className="asr-search-cell">
          <CalendarDays size={24} />
          <div>
            <span>일정</span>
            <strong>{formatDateLabel(checkIn)} - {formatDateLabel(checkOut)}</strong>
          </div>
          {(checkIn || checkOut) && <X size={20} className="asr-search-clear" />}
        </div>

        <div className="asr-search-cell">
          <User size={24} />
          <div>
            <span>숙박 인원</span>
            <strong>성인 {guests}명</strong>
          </div>
        </div>

        <button className="asr-search-submit" onClick={() => navigate('/accommodation')}>숙소 검색</button>
      </div>

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
                  {filtered.map(hotel => {
                    const amenities = compactAmenities(hotel.amenities)
                    const displayPrice = hotel.displayPrice || formatKrwPrice(hotel.price, hotel.currency)
                    const hasPreviousPrice = hasValue(hotel.previousPrice) && hotel.previousPrice !== displayPrice

                    return (
                    <div key={hotel.id} className="asr-card" onClick={() => goDetail(hotel)}>
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

      <BottomNav />
    </div>
  )
}
