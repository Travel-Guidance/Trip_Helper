import { useState, useEffect } from 'react'
import { getOffer } from '../services/flightApi'

export function useOffer(offerId) {
  const [offer, setOffer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const cached = sessionStorage.getItem('selected_offer')
    if (cached) {
      try {
        const o = JSON.parse(cached)
        if (o.id === offerId) {
          setOffer(o)
          setLoading(false)
          return
        }
      } catch {}
    }
    getOffer(offerId)
      .then(setOffer)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [offerId])

  return { offer, loading, error }
}
