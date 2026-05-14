import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { API_BASE } from '../api/config'
import { useAuth } from '../store/AuthContext'
import { hasPendingPlanSaveAfterAuth, savePendingPlanAfterAuth } from '../utils/pendingPlanSave'

export default function OAuthCallback() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    const error = params.get('error')

    async function handleGoogleCallback() {
      if (error) {
        console.error('Google OAuth error:', error)
        navigate('/login', { replace: true })
        return
      }

      if (!code) {
        navigate('/login', { replace: true })
        return
      }

      const profileParams = new URLSearchParams({ code })

      const res = await fetch(`${API_BASE}/auth/google/profile?${profileParams.toString()}`)

      if (!res.ok) {
        console.error('Google login failed:', await res.text())
        navigate('/login', { replace: true })
        return
      }

      const data = await res.json()

      if (data.token && data.user) {
        login(data.user, data.token)
        const authSuccessPath = hasPendingPlanSaveAfterAuth() ? '/ai-generation-schedule' : '/home'
        try {
          if (hasPendingPlanSaveAfterAuth()) {
            await savePendingPlanAfterAuth()
          }
        } catch (err) {
          console.error('Pending plan save failed:', err)
        }
        navigate(authSuccessPath, { replace: true })
        return
      }

      navigate('/login', { replace: true })
    }

    handleGoogleCallback().catch(err => {
      console.error('Google login callback failed:', err)
      navigate('/login', { replace: true })
    })
  }, [location.search, navigate, login])

  return null
}
