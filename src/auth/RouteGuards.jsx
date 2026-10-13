import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './useAuth'

/** Only for signed-in users; others go to sign in and come back afterwards. */
export function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}

/** Sign-in and registration pages: signed-in users go straight to the dashboard. */
export function GuestOnly({ children }) {
  const { isAuthenticated } = useAuth()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}
