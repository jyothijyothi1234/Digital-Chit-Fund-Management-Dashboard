import { http, unwrap } from './client'


export async function registerCustomer({ name, mobile, email, password }) {
  const response = await http.post('/api/auth/register', {
    name: name.trim(),
    mobile,
    email: email?.trim() ? email.trim().toLowerCase() : null,
    password,
  })
  return unwrap(response)
}

export async function verifyOtp({ mobile, otp }) {
  const response = await http.post('/api/auth/verify-otp', { mobile, otp })
  return unwrap(response)
}

export async function resendOtp({ mobile }) {
  const response = await http.post('/api/auth/resend-otp', { mobile })
  return unwrap(response)
}

export async function login({ identifier, password }) {
  const response = await http.post('/api/auth/login', { identifier, email: identifier, password })
  return unwrap(response)
}
