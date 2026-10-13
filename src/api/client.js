import axios from 'axios'
import { API_BASE_URL } from '../config'
import { getAccessToken } from '../auth/session'

export const UNAUTHORIZED_EVENT = 'dc:unauthorized'

// Endpoints that work without a token (SecurityConfig.permitAll).
const PUBLIC_PATHS = [
  '/api/auth/register',
  '/api/auth/verify-otp',
  '/api/auth/login',
  '/api/auth/forgot-password',
  '/api/auth/verify-recovery-otp',
  '/api/auth/reset-password',
]

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Every protected request carries the JWT from login, unless the caller set one already.
http.interceptors.request.use((config) => {
  const token = getAccessToken()
  config.headers = config.headers || {}
  const hasAuth = Boolean(config.headers.Authorization || config.headers.authorization)
  if (token && !hasAuth && !PUBLIC_PATHS.includes(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// A 401 from a protected endpoint means the token expired or was revoked: sign out.
http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url
    const usedSavedToken = !error.config?.skipAuthEvent
    if (status === 401 && url && !PUBLIC_PATHS.includes(url) && usedSavedToken && getAccessToken()) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

/** Bearer header for a token that is not saved yet (right after login). */
export const withToken = (token) => ({ headers: { Authorization: `Bearer ${token}` }, skipAuthEvent: true })

/**
 * Normalises any success body into { message, data }.
 * - plain text            "OTP verified successfully"   -> { message: text, data: null }
 * - { message }           { message: "Logout successful" } -> { message, data: body }
 * - an object             { token, userType, role }      -> { message: '', data: body }
 * - ApiResponse envelope  { success, message, data }     -> { message, data }
 */
export function unwrap(response) {
  const body = response?.data
  if (typeof body === 'string') return { message: body, data: null }
  if (body && typeof body === 'object') {
    if (typeof body.success === 'boolean') return { message: body.message || '', data: body.data ?? null }
    return { message: body.message || '', data: body }
  }
  return { message: '', data: null }
}

const STATUS_MESSAGES = {
  400: 'Some details are not valid. Check them and try again.',
  401: 'Your session has ended. Sign in again.',
  403: 'You do not have access to this.',
  404: 'This service is not available on the server yet.',
  409: 'These details are already registered.',
  429: 'Too many attempts. Wait a moment and try again.',
}

/**
 * Turns an axios error into { status, code, message, fieldErrors, data } for the UI.
 * Handles plain-text bodies, { message } bodies, the ApiResponse envelope,
 * Spring's default error JSON, timeouts and the server being unreachable.
 */
export function parseApiError(error) {
  if (!error?.response) {
    if (error?.code === 'ECONNABORTED') {
      return {
        status: 0,
        code: 'TIMEOUT',
        message: 'The server took too long to respond. Check your connection and try again.',
        fieldErrors: {},
      }
    }
    return {
      status: 0,
      code: 'NETWORK',
      message: `Can't reach the server at ${API_BASE_URL}. Check your internet connection or that the backend is running.`,
      fieldErrors: {},
    }
  }

  const { status, data } = error.response
  const fallback =
    STATUS_MESSAGES[status] ||
    (status >= 500 ? 'Something went wrong on the server. Please try again in a moment.' : 'Request failed.')

  if (typeof data === 'string') {
    const text = data.trim()
    const usable = text && !text.startsWith('<') // an HTML error page is not a message for people
    return { status, code: 'ERROR', message: usable ? text : fallback, fieldErrors: {} }
  }

  if (data && typeof data === 'object') {
    const isSpringDefault = !data.code && 'error' in data && 'path' in data
    let message = data.message || fallback
    if (isSpringDefault && (status >= 500 || !data.message)) message = fallback
    return {
      status,
      code: data.code || 'ERROR',
      message,
      fieldErrors: data.errors && typeof data.errors === 'object' ? data.errors : {},
      data: data.data ?? null,
    }
  }

  return { status, code: 'ERROR', message: fallback, fieldErrors: {} }
}
