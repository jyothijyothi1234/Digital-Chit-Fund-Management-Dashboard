import { http, unwrap, withToken } from './client'

// Every /api/auth endpoint of the Spring Boot backend (AuthController).

/** POST /api/auth/register – creates a PENDING customer and sends a REGISTRATION OTP. */
export async function registerCustomer({ name, mobile, email, password }) {
  const response = await http.post('/api/auth/register', {
    name: name.trim(),
    mobile,
    // null, not "", so an empty email never hits the unique constraint
    email: email?.trim() ? email.trim().toLowerCase() : null,
    password,
  })
  return unwrap(response)
}

/** POST /api/auth/verify-otp – activates the account (status ACTIVE). */
export async function verifyOtp({ mobile, otp }) {
  return unwrap(await http.post('/api/auth/verify-otp', { mobile, otp }))
}

/** POST /api/auth/resend-otp – only when FEATURES.resendRegistrationOtp is on. */
export async function resendOtp({ mobile }) {
  return unwrap(await http.post('/api/auth/resend-otp', { mobile }))
}

/** POST /api/auth/login – returns data { token, userType, role }. */
export async function login({ identifier, password }) {
  return unwrap(await http.post('/api/auth/login', { identifier, password }))
}

/** GET /api/auth/me – data { id, email, userType, role }. Pass a token right after login. */
export async function getCurrentUser(token) {
  return unwrap(await http.get('/api/auth/me', token ? withToken(token) : undefined))
}

/** POST /api/auth/logout – revokes the current token on the server. */
export async function logout(token) {
  return unwrap(await http.post('/api/auth/logout', {}, token ? withToken(token) : undefined))
}

/** POST /api/auth/forgot-password – sends a PASSWORD_RECOVERY OTP. Call again to resend. */
export async function forgotPassword({ identifier }) {
  return unwrap(await http.post('/api/auth/forgot-password', { identifier }))
}

/** POST /api/auth/verify-recovery-otp */
export async function verifyRecoveryOtp({ identifier, otp }) {
  return unwrap(await http.post('/api/auth/verify-recovery-otp', { identifier, otp }))
}

/** POST /api/auth/reset-password – only works within 5 minutes of a verified recovery OTP. */
export async function resetPassword({ identifier, newPassword }) {
  return unwrap(await http.post('/api/auth/reset-password', { identifier, newPassword }))
}
