import { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextField from '../components/TextField'
import PasswordField from '../components/PasswordField'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { login } from '../api/authApi'
import { parseApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { fetchProfile } from '../auth/profile'
import { isInactiveAccount } from '../utils/backendErrors'
import { loadPendingVerification } from '../utils/flowStorage'
import { useDocumentTitle } from '../utils/hooks'
import { fieldError } from '../utils/formErrors'
import { normalizeIdentifier, validateIdentifier, validatePassword } from '../utils/validators'

export default function LoginPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, notice, clearNotice } = useAuth()

  // A message carried over from another page (verified, password changed) or from sign-out.
  const [flash] = useState(() => location.state?.flash || notice)
  const [problem, setProblem] = useState(null)

  useEffect(() => {
    if (notice) clearNotice()
  }, [notice, clearNotice])

  const formik = useFormik({
    initialValues: { identifier: location.state?.identifier || '', password: '', remember: true },
    validate: (values) => {
      const errors = {}
      const id = validateIdentifier(values.identifier)
      if (id) errors.identifier = id
      const pw = validatePassword(values.password)
      if (pw) errors.password = pw
      return errors
    },
    onSubmit: async (values, helpers) => {
      setProblem(null)
      const identifier = normalizeIdentifier(values.identifier)
      try {
        // 1. POST /api/auth/login -> { token, userType, role }
        const { data } = await login({ identifier, password: values.password })
        if (!data?.token) throw new Error('Login response has no token')

        // 2. Load name, mobile etc. with the new token. Sign-in still works if this fails.
        let profile = null
        try {
          profile = await fetchProfile(data.userType, data.token)
        } catch {
          profile = null
        }

        signIn({ token: data.token, userType: data.userType, role: data.role, profile, identifier, remember: values.remember })
        navigate(location.state?.from || '/dashboard', { replace: true })
      } catch (error) {
        const err = error?.response || error?.code ? parseApiError(error) : { message: 'Sign-in failed. Please try again.' }
        if (Object.keys(err.fieldErrors || {}).length) helpers.setErrors(err.fieldErrors)
        if (/invalid email or password|incorrect/i.test(err.message)) helpers.setFieldValue('password', '', false)
        setProblem(err)
      }
    },
  })

  const pending = loadPendingVerification()
  const inactive = problem && isInactiveAccount(problem)
  const showError = (name) => fieldError(formik, name)

  return (
    <AuthLayout headline="Your chit, every month, in one place.">
      <header className="form-head">
        <h1 className="form-head__title">Sign in</h1>
        <p className="form-head__lede">Use the mobile number or email you registered with.</p>
      </header>

      {flash && !problem && <Alert tone="success">{flash}</Alert>}

      {problem &&
        (inactive ? (
          <Alert
            tone="info"
            action={
              pending?.mobile && (
                <Link to="/verify-otp" className="link-btn">
                  Enter the OTP sent to your mobile
                </Link>
              )
            }
          >
            Your account isn't active yet. If you've just registered, verify your mobile number with the OTP.
            Otherwise, contact your branch.
          </Alert>
        ) : (
          <Alert tone="error">{problem.message}</Alert>
        ))}

      <form className="form" onSubmit={formik.handleSubmit} noValidate>
        <TextField
          label="Mobile number or email"
          name="identifier"
          type="text"
          inputMode="email"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="98765 43210 or name@example.com"
          value={formik.values.identifier}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={showError('identifier')}
          autoFocus={!formik.values.identifier}
        />

        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={formik.values.password}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={showError('password')}
          autoFocus={Boolean(formik.values.identifier)}
          labelAside={
            <Link
              to="/forgot-password"
              state={{ identifier: formik.values.identifier }}
              className="field__aside-link"
            >
              Forgot password?
            </Link>
          }
        />

        <label className="check">
          <input type="checkbox" name="remember" checked={formik.values.remember} onChange={formik.handleChange} />
          <span>Keep me signed in on this device</span>
        </label>

        <Button loading={formik.isSubmitting} loadingText="Signing in…" className="btn--block">
          Sign in
        </Button>
      </form>

      <p className="form-foot">
        New to Digital Chit? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  )
}
