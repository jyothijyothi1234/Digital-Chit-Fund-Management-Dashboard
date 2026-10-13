// Keeps multi-step flows alive across a page refresh (sessionStorage only).
// Passwords are never stored.

const PENDING_KEY = 'dc.pendingVerification'
const DRAFT_KEY = 'dc.registerDraft'
const RECOVERY_KEY = 'dc.recovery'

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

/** Absolute deadlines (ms) so countdowns stay right after a refresh. */
function deadlines(otpInfo, defaults) {
  const now = Date.now()
  return {
    expiresAt: now + (otpInfo?.expiresInSeconds ?? defaults.expiresInSeconds) * 1000,
    resendAt: now + (otpInfo?.resendAfterSeconds ?? defaults.resendAfterSeconds) * 1000,
    maxAttempts: otpInfo?.maxAttempts ?? defaults.maxAttempts,
    attemptsUsed: 0,
  }
}

// ---- Registration OTP ----
export function savePendingVerification({ mobile, otpInfo, defaults }) {
  const record = { mobile, ...deadlines(otpInfo, defaults) }
  write(PENDING_KEY, record)
  return record
}
export const updatePendingVerification = (record) => write(PENDING_KEY, record)
export const loadPendingVerification = () => read(PENDING_KEY)
export const clearPendingVerification = () => remove(PENDING_KEY)

export const saveRegisterDraft = ({ name, mobile, email }) => write(DRAFT_KEY, { name, mobile, email })
export const loadRegisterDraft = () => read(DRAFT_KEY)
export const clearRegisterDraft = () => remove(DRAFT_KEY)

// ---- Password recovery ----
/** step: 'find' | 'otp' | 'reset'. resetBy = deadline to set the new password (OTP expiry). */
export function startRecovery({ identifier, defaults }) {
  const record = { step: 'otp', identifier, ...deadlines(null, defaults) }
  write(RECOVERY_KEY, record)
  return record
}
export const saveRecovery = (record) => write(RECOVERY_KEY, record)
export const loadRecovery = () => read(RECOVERY_KEY)
export const clearRecovery = () => remove(RECOVERY_KEY)
