// App-wide settings. Override the API address with VITE_API_BASE_URL in a .env file.
export const APP_NAME = 'Digital Chit'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080').replace(/\/+$/, '')

// Used when the backend does not send OTP timings (older backend versions).
export const OTP_DEFAULTS = {
  length: 6,
  expiresInSeconds: 300,
  resendAfterSeconds: 30,
  maxAttempts: 3,
}

export const IS_DEV = import.meta.env.DEV
