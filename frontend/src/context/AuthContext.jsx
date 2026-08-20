import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { SESSION_EXPIRED_EVENT, tokenStore } from '@/services/apiClient'
import { authService } from '@/services/authService'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [initialising, setInitialising] = useState(true)

  // Restore the session on a hard refresh.
  useEffect(() => {
    let cancelled = false
    async function restore() {
      if (!tokenStore.get()) {
        setInitialising(false)
        return
      }
      try {
        const me = await authService.me()
        if (!cancelled) setUser(me)
      } catch {
        tokenStore.clear()
      } finally {
        if (!cancelled) setInitialising(false)
      }
    }
    restore()
    return () => {
      cancelled = true
    }
  }, [])

  // A 401 anywhere in the app drops us back to the sign-in screen.
  useEffect(() => {
    const handler = () => setUser(null)
    window.addEventListener(SESSION_EXPIRED_EVENT, handler)
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handler)
  }, [])

  const login = useCallback(async (credentials) => {
    const me = await authService.login(credentials)
    setUser(me)
    return me
  }, [])

  const logout = useCallback(() => {
    authService.logout()
    setUser(null)
  }, [])

  const value = useMemo(
    () => ({ user, login, logout, initialising, isAuthenticated: Boolean(user) }),
    [user, login, logout, initialising],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>')
  return context
}
