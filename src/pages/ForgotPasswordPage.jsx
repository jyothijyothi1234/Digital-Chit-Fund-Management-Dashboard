import { useRef, useState } from 'react'
import { useFormik } from 'formik'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextField from '../components/TextField'
import PasswordField from '../components/PasswordField'
import PasswordChecklist from '../components/PasswordChecklist'
import OtpInput from '../components/OtpInput'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Icon from '../components/Icon'
import StepIndicator from '../components/StepIndicator'
import { forgotPassword, resetPassword, verifyRecoveryOtp } from '../api/authApi'
import { parseApiError } from '../api/client'
import { IS_DEV, OTP_DEFAULTS } from '../config'
import { isNeutralRecoveryReply, otpFailure } from '../utils/backendErrors'
import { clearRecovery, loadRecovery, saveRecovery, startRecovery } from '../utils/flowStorage'
import { formatClock, useDocumentTitle, useSecondsUntil } from '../utils/hooks'
import { fieldError } from '../utils/formErrors'
import { formatMobile, normalizeIdentifier, validateIdentifier, validateNewPassword } from '../utils/validators'

const STEPS = ['Account', 'Verify OTP', 'New password']
const STEP_NUMBER = { find: 1, otp: 2, reset: 3 }

const displayIdentifier = (id) => (id?.includes('@') ? id : formatMobile(id))

/**
 * Password recovery in three steps, matching the backend:
 * 1. POST /api/auth/forgot-password       { identifier }
 * 2. POST /api/auth/verify-recovery-otp   { identifier, otp }
 * 3. POST /api/auth/reset-password        { identifier, newPassword }  (within the OTP's 5 minutes)
 */
export default function ForgotPasswordPage() {
  useDocumentTitle('Reset password')
  const navigate = useNavigate()
  const location = useLocation()
  const [recovery, setRecovery] = useState(() => loadRecovery())
  const [message, setMessage] = useState(null) // { tone, text }

  const step = recovery?.step || 'find'
  const [expiresIn, resendIn] = useSecondsUntil(recovery?.expiresAt, recovery?.resendAt)

  const update = (next) => {
    if (next) saveRecovery(next)
    else clearRecovery()
    setRecovery(next)
  }

  const startOver = (text) => {
    update(null)
    setMessage(text ? { tone: 'error', text } : null)
  }

  // ---------- Step 1: find the account ----------
  const findForm = useFormik({
    initialValues: { identifier: location.state?.identifier || '' },
    validate: (v) => {
      const e = validateIdentifier(v.identifier)
      return e ? { identifier: e } : {}
    },
    onSubmit: async (values) => {
      setMessage(null)
      const identifier = normalizeIdentifier(values.identifier)
      try {
        await forgotPassword({ identifier })
      } catch (error) {
        const err = parseApiError(error)
        // The backend answers 400 "If the account exists…" for unknown accounts. Continue
        // the same way so the page never reveals whether an account exists.
        if (!isNeutralRecoveryReply(err)) {
          setMessage({ tone: 'error', text: err.message })
          return
        }
      }
      update(startRecovery({ identifier, defaults: OTP_DEFAULTS }))
      setMessage({ tone: 'info', text: `If an account exists for ${displayIdentifier(identifier)}, we've sent it a 6-digit OTP.` })
    },
  })

  return (
    <AuthLayout headline="Locked out? Get back in with an OTP.">
      {step === 'find' ? (
        <Link to="/login" className="back-link">
          <Icon name="back" size={18} />
          Back to sign in
        </Link>
      ) : (
        <button type="button" className="back-link link-reset" onClick={() => startOver()}>
          <Icon name="back" size={18} />
          Use a different mobile or email
        </button>
      )}

      <header className="form-head">
        <StepIndicator current={STEP_NUMBER[step]} steps={STEPS} />
        <h1 className="form-head__title">
          {step === 'find' ? 'Reset your password' : step === 'otp' ? 'Enter the OTP' : 'Choose a new password'}
        </h1>
        <p className="form-head__lede">
          {step === 'find' && "Enter the mobile number or email on your account. We'll send you a one-time code."}
          {step === 'otp' && (
            <>
              Enter the 6-digit code sent for <strong className="nowrap">{displayIdentifier(recovery.identifier)}</strong>.
            </>
          )}
          {step === 'reset' && 'Use at least 8 characters with a letter and a number.'}
        </p>
      </header>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}

      {step === 'find' && (
        <form className="form" onSubmit={findForm.handleSubmit} noValidate>
          <TextField
            label="Mobile number or email"
            name="identifier"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="98765 43210 or name@example.com"
            value={findForm.values.identifier}
            onChange={findForm.handleChange}
            onBlur={findForm.handleBlur}
            error={fieldError(findForm, 'identifier')}
            autoFocus
          />
          <Button loading={findForm.isSubmitting} loadingText="Sending OTP…" className="btn--block">
            Send OTP
          </Button>
        </form>
      )}

      {step === 'otp' && (
        <RecoveryOtpStep
          recovery={recovery}
          expiresIn={expiresIn}
          resendIn={resendIn}
          onVerified={() => {
            update({ ...recovery, step: 'reset' })
            setMessage({ tone: 'success', text: 'Code verified. Now choose a new password.' })
          }}
          onUpdate={update}
          setMessage={setMessage}
        />
      )}

      {step === 'reset' && (
        <ResetStep
          recovery={recovery}
          expiresIn={expiresIn}
          onExpired={() => startOver('The time to reset your password ran out. Request a new OTP.')}
          onDone={() => {
            clearRecovery()
            navigate('/login', {
              replace: true,
              state: { flash: 'Your password has been changed. Sign in with your new password.', identifier: recovery.identifier },
            })
          }}
          setMessage={setMessage}
        />
      )}

      {IS_DEV && step === 'otp' && (
        <p className="dev-note form-gap">
          Development: no SMS is sent yet. The OTP is printed in the Spring Boot console (purpose PASSWORD_RECOVERY).
        </p>
      )}
    </AuthLayout>
  )
}

// ---------- Step 2: verify the recovery OTP ----------
function RecoveryOtpStep({ recovery, expiresIn, resendIn, onVerified, onUpdate, setMessage }) {
  const [otp, setOtp] = useState('')
  const [busy, setBusy] = useState(false)
  const [resending, setResending] = useState(false)
  const [invalid, setInvalid] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)
  const submittingRef = useRef(false)

  const attemptsLeft = Math.max(0, recovery.maxAttempts - (recovery.attemptsUsed || 0))
  const expired = expiresIn === 0
  const dead = expired || blocked || attemptsLeft === 0

  const submit = async (code) => {
    if (submittingRef.current || code.length !== OTP_DEFAULTS.length || dead) return
    submittingRef.current = true
    setBusy(true)
    setMessage(null)
    try {
      await verifyRecoveryOtp({ identifier: recovery.identifier, otp: code })
      onVerified()
    } catch (error) {
      const err = parseApiError(error)
      const kind = otpFailure(err)
      setOtp('')
      setInvalid(true)
      setShakeKey((k) => k + 1)
      if (kind === 'invalid') {
        const next = { ...recovery, attemptsUsed: (recovery.attemptsUsed || 0) + 1 }
        onUpdate(next)
        const left = Math.max(0, next.maxAttempts - next.attemptsUsed)
        setMessage({
          tone: 'error',
          text: left > 0 ? `Incorrect OTP. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.` : 'Incorrect OTP. No attempts left. Request a new one.',
        })
      } else {
        // "Invalid recovery details" (unknown account), expired, exhausted, already used.
        setBlocked(kind !== null || /invalid recovery details/i.test(err.message))
        setMessage({ tone: 'error', text: err.message })
      }
    } finally {
      submittingRef.current = false
      setBusy(false)
    }
  }

  // Resending = asking forgot-password again; the backend creates a fresh OTP.
  const resend = async () => {
    setResending(true)
    setMessage(null)
    try {
      await forgotPassword({ identifier: recovery.identifier })
    } catch (error) {
      const err = parseApiError(error)
      if (!isNeutralRecoveryReply(err)) {
        setMessage({ tone: 'error', text: err.message })
        setResending(false)
        return
      }
    }
    onUpdate(startRecovery({ identifier: recovery.identifier, defaults: OTP_DEFAULTS }))
    setOtp('')
    setInvalid(false)
    setBlocked(false)
    setMessage({ tone: 'success', text: 'We sent you a new OTP.' })
    setResending(false)
  }

  return (
    <form
      className="form"
      noValidate
      onSubmit={(e) => {
        e.preventDefault()
        submit(otp)
      }}
    >
      <div key={shakeKey} className={shakeKey ? 'shake' : undefined}>
        <OtpInput
          value={otp}
          onChange={(v) => {
            setOtp(v)
            if (invalid && !dead) {
              setInvalid(false)
              setMessage(null)
            }
          }}
          onComplete={submit}
          disabled={busy || dead}
          invalid={invalid}
          autoFocus
          describedBy="recovery-timer"
        />
      </div>

      <p className="otp-meta" id="recovery-timer" aria-live="polite">
        {dead ? (
          <span className="otp-meta__expired">
            {expired ? 'This OTP has expired. Request a new one below.' : 'Request a new OTP to try again.'}
          </span>
        ) : (
          <span>
            Code expires in <strong className="tabular">{formatClock(expiresIn)}</strong>.
            {!invalid && ` You have ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'}.`}
          </span>
        )}
      </p>

      <Button loading={busy} loadingText="Verifying…" disabled={otp.length !== OTP_DEFAULTS.length || dead} className="btn--block">
        Verify code
      </Button>

      <div className="resend">
        <span>Didn't get the code?</span>
        {resendIn > 0 && !dead ? (
          <span className="resend__wait tabular">Resend in {formatClock(resendIn)}</span>
        ) : (
          <button type="button" className="link-btn" onClick={resend} disabled={resending}>
            {resending ? 'Sending…' : 'Send a new OTP'}
          </button>
        )}
      </div>
    </form>
  )
}

// ---------- Step 3: set the new password ----------
function ResetStep({ recovery, expiresIn, onExpired, onDone, setMessage }) {
  const [focused, setFocused] = useState(false)
  const expired = expiresIn === 0

  const form = useFormik({
    initialValues: { newPassword: '', confirmPassword: '' },
    validate: (v) => {
      const errors = {}
      const pw = validateNewPassword(v.newPassword)
      if (pw) errors.newPassword = pw
      if (!v.confirmPassword) errors.confirmPassword = 'Type the new password again'
      else if (v.confirmPassword !== v.newPassword) errors.confirmPassword = "The passwords don't match"
      return errors
    },
    onSubmit: async (values) => {
      if (expired) {
        onExpired()
        return
      }
      setMessage(null)
      try {
        await resetPassword({ identifier: recovery.identifier, newPassword: values.newPassword })
        onDone()
      } catch (error) {
        const err = parseApiError(error)
        if (/expired|verify the recovery otp|recovery otp not found/i.test(err.message)) onExpired()
        else setMessage({ tone: 'error', text: err.message })
      }
    },
  })

  const show = (n) => fieldError(form, n)

  return (
    <form className="form" onSubmit={form.handleSubmit} noValidate>
      <div>
        <PasswordField
          label="New password"
          name="newPassword"
          autoComplete="new-password"
          value={form.values.newPassword}
          onChange={form.handleChange}
          onFocus={() => setFocused(true)}
          onBlur={(e) => {
            setFocused(false)
            form.handleBlur(e)
          }}
          error={focused ? undefined : show('newPassword')}
          maxLength={64}
          autoFocus
        />
        {(focused || form.values.newPassword) && <PasswordChecklist value={form.values.newPassword} />}
      </div>

      <PasswordField
        label="Confirm new password"
        name="confirmPassword"
        autoComplete="new-password"
        value={form.values.confirmPassword}
        onChange={form.handleChange}
        onBlur={form.handleBlur}
        error={show('confirmPassword')}
        maxLength={64}
      />

      <p className="otp-meta" aria-live="polite">
        {expired ? (
          <span className="otp-meta__expired">Time ran out. Request a new OTP to continue.</span>
        ) : (
          <span>
            Set your new password within <strong className="tabular">{formatClock(expiresIn)}</strong>.
          </span>
        )}
      </p>

      {expired ? (
        <Button type="button" onClick={onExpired} className="btn--block">
          Request a new OTP
        </Button>
      ) : (
        <Button loading={form.isSubmitting} loadingText="Saving…" className="btn--block">
          Save new password
        </Button>
      )}
    </form>
  )
}
