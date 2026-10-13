import { useCallback, useEffect, useMemo, useState } from 'react'
import { UNAUTHORIZED_EVENT } from '../api/client'
import { logout as logoutApi } from '../api/authApi'
import { clearSession, readSession, tokenExpiresAt, writeSession } from './session'
import { AuthContext } from './context'
import { fetchProfile } from './profile'

const NOTICES = {
  expired: 'Your session expired. Sign in again to continue.',
  signedOut: 'You have signed out.',
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession())
  const [notice, setNotice] = useState(null) // shown once on the sign-in page

  const save = useCallback((next) => {
    writeSession(next)
    setSession(next)
  }, [])

  /**
   * Called by LoginPage after POST /api/auth/login succeeds.
   * `profile` may be null if loading it failed; sign-in still works.
   */
  const signIn = useCallback(
    ({ token, userType, role, profile, identifier, remember }) => {
      const isEmail = identifier.includes('@')
      save({
        accessToken: token,
        remember,
        signedInAt: new Date().toISOString(),
        user: {
          userType,
          role: role ?? profile?.role ?? null,
          name: profile?.name ?? null,
          email: profile?.email ?? (isEmail ? identifier : null),
          mobile: profile?.mobile ?? (isEmail ? null : identifier),
          status: profile?.status ?? null,
          createdAt: profile?.createdAt ?? null,
          customerId: profile?.customerId ?? null,
          id: profile?.id ?? null,
        },
      })
      setNotice(null)
    },
    [save],
  )

  /** Reloads the profile from the server, e.g. on the dashboard or after editing. */
  const refreshProfile = useCallback(async () => {
    const current = readSession()
    if (!current) return null
    const profile = await fetchProfile(current.user.userType)
    // The person may have signed out (or in as someone else) while this was loading.
    const latest = readSession()
    if (!latest || latest.accessToken !== current.accessToken) return null
    const next = { ...latest, user: { ...latest.user, ...profile, role: latest.user.role ?? profile.role ?? null } }
    save(next)
    return next.user
  }, [save])

  /** Merge server data (e.g. the PUT /api/customers/me response) into the saved user. */
  const updateUser = useCallback(
    (fields) => {
      const current = readSession()
      if (!current) return
      save({ ...current, user: { ...current.user, ...fields } })
    },
    [save],
  )

  /**
   * Signs out locally, and on the server unless the token is already dead.
   * POST /api/auth/logout revokes the token so it cannot be reused.
   */
  const signOut = useCallback(async ({ reason = 'signedOut', callServer = true } = {}) => {
    const token = readSession()?.accessToken
    clearSession()
    setSession(null)
    setNotice(NOTICES[reason] || null)
    if (callServer && token) {
      try {
        await logoutApi(token)
      } catch {
        /* token already invalid or server down: the local session is gone either way */
      }
    }
  }, [])

  const clearNotice = useCallback(() => setNotice(null), [])

  // A protected call returned 401 (expired or revoked token).
  useEffect(() => {
    const onUnauthorized = () => signOut({ reason: 'expired', callServer: false })
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized)
  }, [signOut])

  // Sign out exactly when the JWT expires (backend: jwt.expiration = 1 hour).
  useEffect(() => {
    const at = tokenExpiresAt(session?.accessToken)
    if (!at) return undefined
    const id = setTimeout(() => signOut({ reason: 'expired', callServer: false }), Math.max(0, at - Date.now()))
    return () => clearTimeout(id)
  }, [session?.accessToken, signOut])

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      isAuthenticated: Boolean(session),
      notice,
      clearNotice,
      signIn,
      signOut,
      refreshProfile,
      updateUser,
    }),
    [session, notice, clearNotice, signIn, signOut, refreshProfile, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
