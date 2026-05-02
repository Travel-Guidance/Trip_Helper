import { useState, useEffect } from 'react'
import { searchFlights } from '../services/flightApi'

export function useFlightSearch({ origin, destination, departureDate, returnDate, adults, cabinClass, tripType }) {
  const [offers, setOffers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!origin || !destination || !departureDate) return
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
