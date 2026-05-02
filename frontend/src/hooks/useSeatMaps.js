import { useState, useEffect } from 'react'
import { getSeatMaps } from '../services/seatApi'

export function useSeatMaps(offerId) {
  const [seatMaps, setSeatMaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getSeatMaps(offerId)
      .then(setSeatMaps)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [offerId])

  return { seatMaps, loading, error }
}
