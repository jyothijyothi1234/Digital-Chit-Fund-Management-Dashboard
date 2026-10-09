import { useCallback, useEffect, useMemo, useState } from 'react'
import { UNAUTHORIZED_EVENT } from '../api/client'
import { clearSession, readSession, writeSession } from './session'
import { AuthContext } from './context'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())

  const signIn = useCallback(({ data, identifier, remember }) => {
    const user = {
      id: data?.userId ?? null,
      name: data?.name ?? null,
      mobile: data?.mobile ?? (identifier.includes('@') ? null : identifier),
      email: data?.email ?? (identifier.includes('@') ? identifier : null),
      userType: data?.userType ?? null,
      role: data?.role ?? null,
    }
    const next = {
      user,
      accessToken: data?.accessToken ?? null,
      refreshToken: data?.refreshToken ?? null,
      signedInAt: new Date().toISOString(),
    }
    writeSession(next, remember)
    setSession(next)
  }, [])

  const signOut = useCallback(() => {
    clearSession()
    setSession(null)
  }, [])


  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, signOut)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, signOut)
  }, [signOut])

  const value = useMemo(
    () => ({ session, user: session?.user ?? null, isAuthenticated: Boolean(session), signIn, signOut }),
    [session, signIn, signOut],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
