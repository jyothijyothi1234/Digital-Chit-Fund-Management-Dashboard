import { useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import OtpInput from '../components/OtpInput'
import Button from '../components/Button'
import Alert from '../components/Alert'
import Icon from '../components/Icon'
import StepIndicator from '../components/StepIndicator'
import { resendOtp, verifyOtp } from '../api/authApi'
import { parseApiError } from '../api/client'
import { IS_DEV, OTP_DEFAULTS } from '../config'
import {
  clearPendingVerification,
  clearRegisterDraft,
  loadPendingVerification,
  savePendingVerification,
} from '../utils/flowStorage'
import { formatClock, useDocumentTitle, useSecondsUntil } from '../utils/hooks'
import { formatMobile } from '../utils/validators'

// These mean the current OTP can no longer be used; the only way on is a new one.
const NEEDS_NEW_OTP = new Set(['OTP_EXPIRED', 'OTP_ATTEMPTS_EXCEEDED', 'OTP_ALREADY_USED', 'OTP_NOT_FOUND'])

export default function VerifyOtpPage() {
  useDocumentTitle('Verify mobile')
  const navigate = useNavigate()
  const [pending, setPending] = useState(() => loadPendingVerification())
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState(null) // { tone, text }
  const [blocked, setBlocked] = useState(false) // current OTP unusable
  const [shakeKey, setShakeKey] = useState(0)
  const submittingRef = useRef(false)

  const [expiresIn, resendIn] = useSecondsUntil(pending?.expiresAt, pending?.resendAt)

  if (!pending?.mobile) return <Navigate to="/register" replace />

  const expired = expiresIn === 0
  const canVerify = otp.length === OTP_DEFAULTS.length && !expired && !blocked

  const submit = async (code) => {
    if (submittingRef.current) return
    if (code.length !== OTP_DEFAULTS.length || expired || blocked) return
    submittingRef.current = true
    setVerifying(true)
    setMessage(null)
    try {
      await verifyOtp({ mobile: pending.mobile, otp: code })
      clearPendingVerification()
      clearRegisterDraft()
      navigate('/login', {
        replace: true,
        state: { flash: 'Your mobile number is verified. Sign in to continue.', identifier: pending.mobile },
      })
    } catch (error) {
      const err = parseApiError(error)
      if (err.code === 'ALREADY_VERIFIED') {
        clearPendingVerification()
        clearRegisterDraft()
        navigate('/login', { replace: true, state: { flash: err.message, identifier: pending.mobile } })
        return
      }
      setOtp('')
      setShakeKey((k) => k + 1)
      setBlocked(NEEDS_NEW_OTP.has(err.code))
      setMessage({ tone: 'error', text: err.message })
    } finally {
      submittingRef.current = false
      setVerifying(false)
    }
  }

  const resend = async () => {
    setResending(true)
    setMessage(null)
    try {
      const { message: text, data } = await resendOtp({ mobile: pending.mobile })
      setPending(savePendingVerification({ mobile: pending.mobile, otpInfo: data, defaults: OTP_DEFAULTS }))
      setOtp('')
      setBlocked(false)
      setMessage({ tone: 'success', text: text || 'We sent you a new OTP.' })
    } catch (error) {
      const err = parseApiError(error)
      if (err.code === 'ALREADY_VERIFIED') {
        clearPendingVerification()
        navigate('/login', { replace: true, state: { flash: err.message, identifier: pending.mobile } })
        return
      }
      setMessage({ tone: 'error', text: err.message })
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout headline="One step left: confirm your number.">
      <Link to="/register" className="back-link">
        <Icon name="back" size={18} />
        Change details
      </Link>

      <header className="form-head">
        <StepIndicator current={2} steps={['Your details', 'Verify mobile']} />
        <h1 className="form-head__title">Enter the OTP</h1>
        <p className="form-head__lede" id="otp-help">
          We sent a 6-digit code to <strong className="nowrap">{formatMobile(pending.mobile)}</strong>.
        </p>
      </header>

      {message && <Alert tone={message.tone}>{message.text}</Alert>}

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
              if (message?.tone === 'error' && !blocked) setMessage(null)
            }}
            onComplete={submit}
            disabled={verifying || expired || blocked}
            invalid={message?.tone === 'error'}
            autoFocus
            describedBy="otp-help otp-timer"
          />
        </div>

        <p className="otp-meta" id="otp-timer" aria-live="polite">
          {expired ? (
            <span className="otp-meta__expired">This OTP has expired. Request a new one below.</span>
          ) : blocked ? (
            <span className="otp-meta__expired">Request a new OTP to try again.</span>
          ) : (
            <span>
              Code expires in <strong className="tabular">{formatClock(expiresIn)}</strong>.
              {message?.tone !== 'error' && ` You have ${pending.maxAttempts} attempts.`}
            </span>
          )}
        </p>

        <Button loading={verifying} loadingText="Verifying…" disabled={!canVerify} className="btn--block">
          Verify and create account
        </Button>

        <div className="resend">
          <span>Didn't get the code?</span>
          {resendIn > 0 && !expired && !blocked ? (
            <span className="resend__wait tabular">Resend in {formatClock(resendIn)}</span>
          ) : (
            <button type="button" className="link-btn" onClick={resend} disabled={resending}>
              {resending ? 'Sending…' : 'Send a new OTP'}
            </button>
          )}
        </div>

        {IS_DEV && (
          <p className="dev-note">
            Development: no SMS is sent yet. The OTP is printed in the Spring Boot console.
          </p>
        )}
      </form>
    </AuthLayout>
  )
}
