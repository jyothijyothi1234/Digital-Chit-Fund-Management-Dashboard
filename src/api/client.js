import axios from 'axios'
import { API_BASE_URL } from '../config'
import { getAccessToken } from '../auth/session'

export const UNAUTHORIZED_EVENT = 'dc:unauthorized'

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Ready for JWT: once the backend returns an accessToken at login, every request carries it.
http.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) {
    config.headers = config.headers || {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const isAuthCall = error.config?.url?.startsWith('/api/auth/')
    if (status === 401 && !isAuthCall && getAccessToken()) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  },
)

/**
 * Normalises any success body into { message, data }.
 * Works with the new ApiResponse envelope and with the older plain-string responses.
 */
export function unwrap(response) {
  const body = response?.data
  if (typeof body === 'string') return { message: body, data: null }
  if (body && typeof body === 'object') return { message: body.message || '', data: body.data ?? null }
  return { message: '', data: null }
}

const STATUS_MESSAGES = {
  400: 'Some details are not valid. Check the form and try again.',
  401: 'Your session has ended. Sign in again.',
  403: 'You do not have access to this.',
  404: 'This service is not available on the server yet.',
  409: 'These details are already registered.',
  429: 'Too many attempts. Wait a moment and try again.',
}

/**
 * Turns an axios error into { status, code, message, fieldErrors, data } for the UI.
 * Handles: the ApiResponse envelope, plain-string bodies, Spring's default error JSON,
 * timeouts and the server being unreachable.
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
    // An HTML error page is not a message for people.
    const usable = text && !text.startsWith('<')
    return { status, code: 'ERROR', message: usable ? text : fallback, fieldErrors: {} }
  }

  if (data && typeof data === 'object') {
    // Spring's default error JSON has "error": "Internal Server Error" and often an empty message.
    const isSpringDefault = !data.code && 'error' in data && 'path' in data
    const message = isSpringDefault ? data.message || fallback : data.message || fallback
    return {
      status,
      code: data.code || 'ERROR',
      message: status >= 500 && isSpringDefault ? fallback : message,
      fieldErrors: data.errors && typeof data.errors === 'object' ? data.errors : {},
      data: data.data ?? null,
    }
  }

  return { status, code: 'ERROR', message: fallback, fieldErrors: {} }
}
