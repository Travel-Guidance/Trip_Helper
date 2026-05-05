import { useState, useEffect } from 'react'
import { searchFlights } from '../api/flightApi'

export function useFlightSearch({ origin, destination, departureDate, returnDate, adults, cabinClass, tripType }) {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!origin || !destination || !departureDate) return
    if (!/^[A-Z]{3}$/i.test(origin) || !/^[A-Z]{3}$/i.test(destination)) {
      setLoading(false)
      setOffers([])
      setError('출발지와 도착지는 유효한 3자리 공항코드로 선택해주세요.')
      return
    }
    setLoading(true)
    setError(null)
    setOffers([])

    searchFlights({ origin, destination, departureDate, returnDate, adults, cabinClass, tripType })
      .then(data => setOffers(data.offers || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [origin, destination, departureDate, returnDate, adults, cabinClass, tripType])

  return { offers, loading, error }
}
