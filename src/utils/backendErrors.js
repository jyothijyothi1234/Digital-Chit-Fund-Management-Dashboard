// The backend returns plain messages (no error codes yet), so these helpers
// recognise its exact wording. If a message changes in AuthService/OtpService, update it here.

/** What kind of OTP failure this is: 'invalid' | 'expired' | 'exhausted' | 'used' | 'missing' | null */
export function otpFailure(err) {
  const code = err?.code
  const msg = (err?.message || '').toLowerCase()
  if (
    code === 'OTP_INVALID' ||
    msg === 'invalid otp' ||
    msg.startsWith('incorrect otp')
  )
    return 'invalid'
  if (code === 'OTP_EXPIRED' || msg.includes('expired')) return 'expired'
  if (
    code === 'OTP_ATTEMPTS_EXCEEDED' ||
    msg.includes('maximum otp attempts') ||
    msg.includes('too many')
  )
    return 'exhausted'
  if (
    code === 'OTP_ALREADY_USED' ||
    code === 'ALREADY_VERIFIED' ||
    msg.includes('already verified')
  )
    return 'used'
  if (
    code === 'OTP_NOT_FOUND' ||
    msg.includes('otp not found') ||
    msg.includes('recovery otp not found')
  )
    return 'missing'
  return null
}

/** Which registration field a duplicate error belongs to: 'mobile' | 'email' | null */
export function duplicateField(err) {
  const code = err?.code
  const msg = (err?.message || '').toLowerCase()
  if (
    code === 'MOBILE_ALREADY_REGISTERED' ||
    (msg.includes('mobile') && msg.includes('already'))
  )
    return 'mobile'
  if (
    code === 'EMAIL_ALREADY_REGISTERED' ||
    (msg.includes('email') && msg.includes('already'))
  )
    return 'email'
  return null
}

/** "User account is not active": registered but OTP never verified (or blocked). */
export function isInactiveAccount(err) {
  return (
    err?.code === 'ACCOUNT_NOT_VERIFIED' ||
    /not active/i.test(err?.message || '')
  )
}

/** forgot-password answers 400 with this when the account doesn't exist; treat it as neutral. */
export function isNeutralRecoveryReply(err) {
  return /^if the account exists/i.test(err?.message || '')
}
