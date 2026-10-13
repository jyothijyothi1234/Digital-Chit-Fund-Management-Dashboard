import { useState } from 'react'
import { useFormik } from 'formik'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextField from '../components/TextField'
import PasswordField from '../components/PasswordField'
import Button from '../components/Button'
import Alert from '../components/Alert'
import { login, resendOtp } from '../api/authApi'
import { parseApiError } from '../api/client'
import { useAuth } from '../auth/useAuth'
import { OTP_DEFAULTS } from '../config'
import { savePendingVerification } from '../utils/flowStorage'
import { useDocumentTitle } from '../utils/hooks'
import {
  normalizeIdentifier,
  validateIdentifier,
  validatePassword,
} from '../utils/validators'

export default function LoginPage() {
  useDocumentTitle('Sign in')
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn } = useAuth()

  const flash = location.state?.flash
  const [problem, setProblem] = useState(null) // { message, code, data }
  const [sendingOtp, setSendingOtp] = useState(false)

  const formik = useFormik({
    initialValues: {
      identifier: location.state?.identifier || '',
      password: '',
      remember: true,
    },
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
        const { data } = await login({ identifier, password: values.password })
        signIn({ data, identifier, remember: values.remember })
        navigate(location.state?.from || '/dashboard', { replace: true })
      } catch (error) {
        const err = parseApiError(error)
        if (Object.keys(err.fieldErrors).length)
          helpers.setErrors(err.fieldErrors)
        if (err.code === 'INVALID_CREDENTIALS' || err.status === 401)
          helpers.setFieldValue('password', '', false)
        setProblem(err)
      }
    },
  })

  // Account exists but the OTP step was never finished: send a fresh OTP and continue there.
  const continueVerification = async () => {
    const mobile =
      problem?.data?.mobile || normalizeIdentifier(formik.values.identifier)
    setSendingOtp(true)
    try {
      const { data } = await resendOtp({ mobile })
      savePendingVerification({ mobile, otpInfo: data, defaults: OTP_DEFAULTS })
      navigate('/verify-otp')
    } catch (error) {
      const err = parseApiError(error)
      if (err.code === 'OTP_COOLDOWN') {
        // An OTP was sent moments ago and is still valid.
        savePendingVerification({
          mobile,
          otpInfo: null,
          defaults: OTP_DEFAULTS,
        })
        navigate('/verify-otp')
      } else {
        setProblem(err)
      }
    } finally {
      setSendingOtp(false)
    }
  }

  const showError = (name) =>
    formik.touched[name] || formik.submitCount > 0
      ? formik.errors[name]
      : undefined

  return (
    <AuthLayout headline="Your chit, every month, in one place.">
      <header className="form-head">
        <h1 className="form-head__title">Sign in</h1>
        <p className="form-head__lede">
          Use the mobile number or email you registered with.
        </p>
      </header>

      {flash && !problem && <Alert tone="success">{flash}</Alert>}

      {problem && (
        <Alert
          tone={problem.code === 'ACCOUNT_NOT_VERIFIED' ? 'info' : 'error'}
          action={
            problem.code === 'ACCOUNT_NOT_VERIFIED' && (
              <button
                type="button"
                className="link-btn"
                onClick={continueVerification}
                disabled={sendingOtp}
              >
                {sendingOtp ? 'Sending OTP…' : 'Verify mobile number'}
              </button>
            )
          }
        >
          {problem.message}
        </Alert>
      )}

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
        />

        <label className="check">
          <input
            type="checkbox"
            name="remember"
            checked={formik.values.remember}
            onChange={formik.handleChange}
          />
          <span>Keep me signed in on this device</span>
        </label>

        <Button
          loading={formik.isSubmitting}
          loadingText="Signing in…"
          className="btn--block"
        >
          Sign in
        </Button>
      </form>

      <p className="form-foot">
        New to Digital Chit? <Link to="/register">Create an account</Link>
      </p>
    </AuthLayout>
  )
}
