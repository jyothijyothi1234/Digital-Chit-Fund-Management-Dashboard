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

export function readSession() {
  return safeGet(localStorage, SESSION_KEY) || safeGet(sessionStorage, SESSION_KEY)
}

export function writeSession(session, remember) {
  clearSession()
  try {
    ;(remember ? localStorage : sessionStorage).setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    /* storage unavailable: session lives in memory only */
  }
}

export function clearSession() {
  safeRemove(localStorage, SESSION_KEY)
  safeRemove(sessionStorage, SESSION_KEY)
}

export function getAccessToken() {
  return readSession()?.accessToken || null
}
