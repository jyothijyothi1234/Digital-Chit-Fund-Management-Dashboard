import { Navigate, Route, Routes } from 'react-router-dom'
import { GuestOnly, RequireAuth } from './auth/RouteGuards'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import VerifyOtpPage from './pages/VerifyOtpPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import DashboardPage from './pages/DashboardPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />
      <Route
        path="/register"
        element={
          <GuestOnly>
            <RegisterPage />
          </GuestOnly>
        }
      />
      <Route
        path="/verify-otp"
        element={
          <GuestOnly>
            <VerifyOtpPage />
          </GuestOnly>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <GuestOnly>
            <ForgotPasswordPage />
          </GuestOnly>
        }
      />
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />

      {/* Old URL from the first version */}
      <Route
        path="/customerregisterationpage"
        element={<Navigate to="/register" replace />}
      />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}
