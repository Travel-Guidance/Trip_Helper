import { createContext, useContext, useState, useCallback } from 'react'

const AuthContext = createContext(null)

function loadStoredAuth() {
  try {
    const token = localStorage.getItem('tripHelperToken')
    const user = JSON.parse(localStorage.getItem('tripHelperUser') || 'null')
    if (token && user) return { token, user }
  } catch {
    // ignore parse errors
  }
  return { token: null, user: null }
}

function loadProfilePic(userId) {
  if (!userId) return null
  return localStorage.getItem(`profilePic_${userId}`) || null
}

export function AuthProvider({ children }) {
  const [{ token, user }, setAuth] = useState(loadStoredAuth)
  const [profilePic, setProfilePicState] = useState(() => {
    const { user: u } = loadStoredAuth()
    return loadProfilePic(u?.id)
  })

  const login = useCallback((userData, authToken) => {
    localStorage.setItem('tripHelperToken', authToken)
    localStorage.setItem('tripHelperUser', JSON.stringify(userData))
    localStorage.setItem('tripHelperUserName', userData.name)
    setAuth({ token: authToken, user: userData })
    setProfilePicState(loadProfilePic(userData.id))
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('tripHelperToken')
    localStorage.removeItem('tripHelperUser')
    localStorage.removeItem('tripHelperUserName')
    setAuth({ token: null, user: null })
    setProfilePicState(null)
  }, [])

  const updateProfilePic = useCallback((userId, base64) => {
    localStorage.setItem(`profilePic_${userId}`, base64)
    setProfilePicState(base64)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoggedIn: !!user, profilePic, updateProfilePic }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
