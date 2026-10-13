// App-wide settings. Override the API address with VITE_API_BASE_URL in a .env file.
export const APP_NAME = 'Digital Chit'

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
).replace(/\/+$/, '')

// The backend's OTP rules (OtpService): 6 digits, valid 5 minutes, 3 attempts.
export const OTP_DEFAULTS = {
  length: 6,
  expiresInSeconds: 300,
  resendAfterSeconds: 30,
  maxAttempts: 3,
}

// Switch on when the backend has the matching endpoint.
export const FEATURES = {
  // POST /api/auth/resend-otp { mobile } – not in the backend yet.
  resendRegistrationOtp: false,
}

export const IS_DEV = import.meta.env.DEV
