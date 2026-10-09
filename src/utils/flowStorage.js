// Keeps the registration flow alive across a page refresh (sessionStorage only).
// The password is never stored.

const PENDING_KEY = 'dc.pendingVerification'
const DRAFT_KEY = 'dc.registerDraft'

function read(key) {
  try {
    const raw = sessionStorage.getItem(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function write(key, value) {
  try {
    sessionStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

function remove(key) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    /* storage unavailable */
  }
}

/**
 * Builds the pending-verification record from the backend's OTP response.
 * Stores absolute deadlines so countdowns stay correct after a refresh.
 */
export function savePendingVerification({ mobile, otpInfo, defaults }) {
  const now = Date.now()
  const expiresIn = otpInfo?.expiresInSeconds ?? defaults.expiresInSeconds
  const resendAfter = otpInfo?.resendAfterSeconds ?? defaults.resendAfterSeconds
  const record = {
    mobile,
    maskedMobile: otpInfo?.maskedMobile || null,
    expiresAt: now + expiresIn * 1000,
    resendAt: now + resendAfter * 1000,
    maxAttempts: otpInfo?.maxAttempts ?? defaults.maxAttempts,
  }
  write(PENDING_KEY, record)
  return record
}

export const loadPendingVerification = () => read(PENDING_KEY)
export const clearPendingVerification = () => remove(PENDING_KEY)

export const saveRegisterDraft = ({ name, mobile, email }) => write(DRAFT_KEY, { name, mobile, email })
export const loadRegisterDraft = () => read(DRAFT_KEY)
export const clearRegisterDraft = () => remove(DRAFT_KEY)
