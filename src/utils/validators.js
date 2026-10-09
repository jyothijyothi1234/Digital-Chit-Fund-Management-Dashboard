// Field rules. They mirror the backend's validation so most errors are caught before a request.

const MOBILE_RE = /^[6-9]\d{9}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const NAME_RE = /^[\p{L} .'-]+$/u

export function digitsOnly(value, max) {
  const digits = String(value || '').replace(/\D/g, '')
  return max ? digits.slice(0, max) : digits
}

export function validateName(value) {
  const name = value.trim()
  if (!name) return 'Enter your full name'
  if (name.length < 2) return 'Name must be at least 2 characters'
  if (name.length > 100) return 'Name must be at most 100 characters'
  if (!NAME_RE.test(name)) return 'Use letters, spaces, dots, apostrophes or hyphens only'
  return undefined
}

export function validateMobile(value) {
  if (!value) return 'Enter your mobile number'
  if (value.length !== 10) return 'Mobile number must be 10 digits'
  if (!MOBILE_RE.test(value)) return 'Enter a valid Indian mobile number starting with 6, 7, 8 or 9'
  return undefined
}

export function validateOptionalEmail(value) {
  const email = value.trim()
  if (!email) return undefined
  if (email.length > 100) return 'Email must be at most 100 characters'
  if (!EMAIL_RE.test(email)) return 'Enter a valid email, like name@example.com'
  return undefined
}

export function passwordChecks(value) {
  return [
    { id: 'length', label: '8 or more characters', ok: value.length >= 8 },
    { id: 'letter', label: 'A letter', ok: /[A-Za-z]/.test(value) },
    { id: 'number', label: 'A number', ok: /\d/.test(value) },
  ]
}

export function validateNewPassword(value) {
  if (!value) return 'Create a password'
  if (value.length > 64) return 'Password must be at most 64 characters'
  if (!passwordChecks(value).every((c) => c.ok)) {
    return 'Use at least 8 characters with a letter and a number'
  }
  return undefined
}

/** Accepts "98765 43210", "+91 9876543210", "09876543210" or an email. */
export function normalizeIdentifier(value) {
  const raw = value.trim()
  if (raw.includes('@')) return raw.toLowerCase()
  let digits = raw.replace(/[\s()-]/g, '').replace(/^\+/, '')
  if (/^91\d{10}$/.test(digits)) digits = digits.slice(2)
  if (/^0\d{10}$/.test(digits)) digits = digits.slice(1)
  return digits
}

export function validateIdentifier(value) {
  const raw = value.trim()
  if (!raw) return 'Enter your mobile number or email'
  const id = normalizeIdentifier(raw)
  if (raw.includes('@')) return EMAIL_RE.test(id) ? undefined : 'Enter a valid email, like name@example.com'
  if (!/^\d+$/.test(id)) return 'Enter a 10-digit mobile number or an email'
  return MOBILE_RE.test(id) ? undefined : 'Enter a valid 10-digit mobile number'
}

export function validatePassword(value) {
  return value ? undefined : 'Enter your password'
}

export function maskMobile(mobile) {
  if (!mobile || mobile.length < 4) return mobile || ''
  return `${mobile.slice(0, 2)}••••••${mobile.slice(-2)}`
}

export function formatMobile(mobile) {
  if (!mobile || mobile.length !== 10) return mobile || ''
  return `+91 ${mobile.slice(0, 5)} ${mobile.slice(5)}`
}
