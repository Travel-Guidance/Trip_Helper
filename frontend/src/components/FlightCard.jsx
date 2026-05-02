import { useNavigate } from 'react-router-dom'
import { formatTime, formatDateShort, parseDuration, formatDuration, formatPrice, getStopsText, getStopsBadgeClass } from '../utils'

function calcDuration(segments) {
  const first = segments[0]
  const last = segments[segments.length - 1]
  if (!first?.departing_at || !last?.arriving_at) return 0
  return Math.round((new Date(last.arriving_at) - new Date(first.departing_at)) / 60000)
}

function SliceRow({ slice }) {
  const firstSeg = slice.segments[0]
  const lastSeg = slice.segments[slice.segments.length - 1]
  const airline = firstSeg?.marketing_carrier
  const durationMins = parseDuration(slice.duration) || calcDuration(slice.segments)

  return (
    <div className="flight-slice">
      <div className="airline-info">
        {airline?.logo_symbol_url
          ? <img className="airline-logo" src={airline.logo_symbol_url} alt={airline.name} />
          : <div className="airline-logo-placeholder">{airline?.iata_code || '?'}</div>
        }
        <div>
          <div className="airline-name">{airline?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--text-light)' }}>
            {airline?.iata_code}{firstSeg?.marketing_carrier_flight_number}
          </div>
        </div>
      </div>

      <div className="flight-times">
        <div className="time-block">
          <div className="time">{formatTime(firstSeg?.departing_at)}</div>
          <div className="iata">{firstSeg?.origin?.iata_code}</div>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
            {formatDateShort(firstSeg?.departing_at)}
          </div>
        </div>

        <div className="duration-block">
          <div className="duration-text">{formatDuration(durationMins)}</div>
          <div className="duration-line" />
          <span className={`stops-badge ${getStopsBadgeClass(slice.segments)}`}>
            {getStopsText(slice.segments)}
          </span>
        </div>

        <div className="time-block">
          <div className="time">{formatTime(lastSeg?.arriving_at)}</div>
          <div className="iata">{lastSeg?.destination?.iata_code}</div>
          <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
            {formatDateShort(lastSeg?.arriving_at)}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FlightCard({ offer }) {
  const navigate = useNavigate()

  const handleSelect = () => {
    sessionStorage.setItem('selected_offer', JSON.stringify(offer))
    navigate(`/seats/${offer.id}`)
  }

  return (
    <div className="flight-card">
      <div className="flight-info">
        {offer.slices.map((slice, i) => (
          <SliceRow key={slice.id} slice={slice} />
        ))}
      </div>
      <div className="flight-price-box">
        <div className="price-label">1인 기준</div>
        <div className="price-amount">
          {formatPrice(offer.total_amount, offer.total_currency)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 2 }}>
          세금 포함
        </div>
        <button className="select-btn" onClick={handleSelect}>선택하기</button>
      </div>
    </div>
  )
}
