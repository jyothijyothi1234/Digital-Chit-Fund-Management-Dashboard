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
import { FEATURES, IS_DEV, OTP_DEFAULTS } from '../config'
import { otpFailure } from '../utils/backendErrors'
import {
  clearPendingVerification,
  clearRegisterDraft,
  loadPendingVerification,
  savePendingVerification,
  updatePendingVerification,
} from '../utils/flowStorage'
import { formatClock, useDocumentTitle, useSecondsUntil } from '../utils/hooks'
import { formatMobile } from '../utils/validators'

export default function VerifyOtpPage() {
  useDocumentTitle('Verify mobile')
  const navigate = useNavigate()
  const [pending, setPending] = useState(() => loadPendingVerification())
  const [otp, setOtp] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const [message, setMessage] = useState(null) // { tone, text }
  const [blocked, setBlocked] = useState(false) // current OTP can no longer be used
  const [shakeKey, setShakeKey] = useState(0)
  const submittingRef = useRef(false)

  const [expiresIn, resendIn] = useSecondsUntil(pending?.expiresAt, pending?.resendAt)

  if (!pending?.mobile) return <Navigate to="/register" replace />

  const expired = expiresIn === 0
  const attemptsLeft = Math.max(0, pending.maxAttempts - (pending.attemptsUsed || 0))
  const dead = expired || blocked || attemptsLeft === 0
  const canVerify = otp.length === OTP_DEFAULTS.length && !dead

  const finish = (flash) => {
    clearPendingVerification()
    clearRegisterDraft()
    navigate('/login', { replace: true, state: { flash, identifier: pending.mobile } })
  }

  const submit = async (code) => {
    if (submittingRef.current || code.length !== OTP_DEFAULTS.length || dead) return
    submittingRef.current = true
    setVerifying(true)
    setMessage(null)
    try {
      await verifyOtp({ mobile: pending.mobile, otp: code })
      finish('Your mobile number is verified. Sign in to continue.')
    } catch (error) {
      const err = parseApiError(error)
      const kind = otpFailure(err)
      if (kind === 'used') {
        finish('This mobile number is already verified. Sign in to continue.')
        return
      }
      setOtp('')
      setShakeKey((k) => k + 1)
      if (kind === 'invalid') {
        // The backend only says "Invalid OTP", so count attempts here (it allows 3).
        const next = { ...pending, attemptsUsed: (pending.attemptsUsed || 0) + 1 }
        updatePendingVerification(next)
        setPending(next)
        const left = Math.max(0, next.maxAttempts - next.attemptsUsed)
        setBlocked(left === 0)
        setMessage({
          tone: 'error',
          text: left > 0 ? `Incorrect OTP. ${left} ${left === 1 ? 'attempt' : 'attempts'} left.` : 'Incorrect OTP. No attempts left.',
        })
      } else {
        setBlocked(kind === 'expired' || kind === 'exhausted' || kind === 'missing')
        setMessage({ tone: 'error', text: err.message })
      }
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
      setMessage({ tone: 'error', text: parseApiError(error).message })
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
              if (message?.tone === 'error' && !dead) setMessage(null)
            }}
            onComplete={submit}
            disabled={verifying || dead}
            invalid={message?.tone === 'error'}
            autoFocus
            describedBy="otp-help otp-timer"
          />
        </div>

        <p className="otp-meta" id="otp-timer" aria-live="polite">
          {dead ? (
            <span className="otp-meta__expired">
              {expired ? 'This OTP has expired.' : 'This OTP can no longer be used.'}
            </span>
          ) : (
            <span>
              Code expires in <strong className="tabular">{formatClock(expiresIn)}</strong>.
              {message?.tone !== 'error' && ` You have ${attemptsLeft} ${attemptsLeft === 1 ? 'attempt' : 'attempts'}.`}
            </span>
          )}
        </p>

        <Button loading={verifying} loadingText="Verifying…" disabled={!canVerify} className="btn--block">
          Verify and create account
        </Button>

        {FEATURES.resendRegistrationOtp ? (
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
        ) : (
          dead && (
            <p className="resend">
              A new OTP can't be sent from the app yet. Contact your branch to finish activating your account.
            </p>
          )
        )}

        {IS_DEV && (
          <p className="dev-note">
            Development: no SMS is sent yet. The OTP is printed in the Spring Boot console (purpose REGISTRATION).
          </p>
        )}
      </form>
    </AuthLayout>
  )
}
