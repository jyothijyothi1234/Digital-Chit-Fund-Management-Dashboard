// Where the signed-in session lives. "Keep me signed in" uses localStorage;
// otherwise sessionStorage, which clears when the browser tab closes.
const SESSION_KEY = 'dc.session'

function safeGet(storage, key) {
  try {
    const raw = storage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function safeRemove(storage, key) {
  try {
    storage.removeItem(key)
  } catch {
    /* storage unavailable */
  }
}

/** Reads the payload of a JWT without verifying it (the backend verifies). */
export function decodeJwt(token) {
  try {
    const part = token.split('.')[1]
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '='))
    return JSON.parse(json)
  } catch {
    return null
  }
}

/** Milliseconds timestamp when the token expires, or null if unknown. */
export function tokenExpiresAt(token) {
  const exp = token ? decodeJwt(token)?.exp : null
  return typeof exp === 'number' ? exp * 1000 : null
}

export function isTokenExpired(token) {
  const at = tokenExpiresAt(token)
  return at !== null && at <= Date.now()
}

function storageFor(remember) {
  return remember ? localStorage : sessionStorage
}

/** Returns the saved session, or null. An expired token counts as signed out. */
export function readSession() {
  const session = safeGet(localStorage, SESSION_KEY) || safeGet(sessionStorage, SESSION_KEY)
  if (!session?.accessToken || isTokenExpired(session.accessToken)) {
    if (session) clearSession()
    return null
  }
  return session
}

export function writeSession(session) {
  clearSession()
  try {
    storageFor(session.remember).setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* storage unavailable: session lives in memory only */
  }
}

export function clearSession() {
  safeRemove(localStorage, SESSION_KEY)
  safeRemove(sessionStorage, SESSION_KEY)
}

export function getAccessToken() {
  const s = safeGet(localStorage, SESSION_KEY) || safeGet(sessionStorage, SESSION_KEY)
  return s?.accessToken || null
}
