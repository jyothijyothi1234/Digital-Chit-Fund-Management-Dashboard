import { useState } from 'react'
import { useFormik } from 'formik'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../components/AuthLayout'
import TextField from '../components/TextField'
import PasswordField from '../components/PasswordField'
import PasswordChecklist from '../components/PasswordChecklist'
import Button from '../components/Button'
import Alert from '../components/Alert'
import StepIndicator from '../components/StepIndicator'
import { registerCustomer } from '../api/authApi'
import { parseApiError } from '../api/client'
import { OTP_DEFAULTS } from '../config'
import { duplicateField } from '../utils/backendErrors'
import { loadRegisterDraft, saveRegisterDraft, savePendingVerification } from '../utils/flowStorage'
import { useDocumentTitle } from '../utils/hooks'
import { fieldError } from '../utils/formErrors'
import { digitsOnly, validateMobile, validateName, validateNewPassword, validateOptionalEmail } from '../utils/validators'


export default function RegisterPage() {
  useDocumentTitle('Create account')
  const navigate = useNavigate()
  const [problem, setProblem] = useState(null)
  const [passwordFocused, setPasswordFocused] = useState(false)

  const draft = loadRegisterDraft()

  const formik = useFormik({
    initialValues: {
      name: draft?.name || '',
      mobile: draft?.mobile || '',
      email: draft?.email || '',
      password: '',
    },
    validate: (values) => {
      const errors = {}
      const checks = {
        name: validateName(values.name),
        mobile: validateMobile(values.mobile),
        email: validateOptionalEmail(values.email),
        password: validateNewPassword(values.password),
      }
      Object.entries(checks).forEach(([k, v]) => v && (errors[k] = v))
      return errors
    },
    onSubmit: async (values, helpers) => {
      setProblem(null)
      try {
        const { data } = await registerCustomer(values)
        saveRegisterDraft(values)
        savePendingVerification({ mobile: values.mobile, otpInfo: data, defaults: OTP_DEFAULTS })
        navigate('/verify-otp')
      } catch (error) {
        const err = parseApiError(error)
        const fieldErrors = { ...err.fieldErrors }
        const field = duplicateField(err)
        if (field) fieldErrors[field] = err.message
        if (Object.keys(fieldErrors).length) {
          helpers.setErrors(fieldErrors)
          helpers.setTouched(Object.fromEntries(Object.keys(fieldErrors).map((k) => [k, true])), false)
        }
        // A field error already explains itself next to the field; the banner covers the rest.
        if (!field) setProblem(err)
        else setProblem({ ...err, quiet: true })
      }
    },
  })

  const showError = (name) => fieldError(formik, name)

  const alreadyRegistered = duplicateField(problem) === 'mobile'

  return (
    <AuthLayout headline="Join a chit group from your phone.">
      <header className="form-head">
        <StepIndicator current={1} steps={['Your details', 'Verify mobile']} />
        <h1 className="form-head__title">Create your account</h1>
        <p className="form-head__lede">We'll send a 6-digit OTP to your mobile number to confirm it's yours.</p>
      </header>

      {problem && !problem.quiet && <Alert tone="error">{problem.message}</Alert>}

      <form className="form" onSubmit={formik.handleSubmit} noValidate>
        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="As on your Aadhaar or PAN"
          value={formik.values.name}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={showError('name')}
          maxLength={100}
          autoFocus
        />

        <TextField
          label="Mobile number"
          name="mobile"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          prefix="+91"
          placeholder="98765 43210"
          value={formik.values.mobile}
          onChange={(e) => formik.setFieldValue('mobile', digitsOnly(e.target.value, 10))}
          onBlur={formik.handleBlur}
          error={showError('mobile')}
          hint="Your OTP and payment reminders go to this number."
          labelAside={
            alreadyRegistered && (
              <Link to="/login" state={{ identifier: formik.values.mobile }} className="field__aside-link">
                Sign in instead
              </Link>
            )
          }
        />

        <TextField
          label="Email"
          optional
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          placeholder="name@example.com"
          value={formik.values.email}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          error={showError('email')}
          hint="For receipts and statements. You can also sign in with it."
        />

        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            value={formik.values.password}
            onChange={formik.handleChange}
            onFocus={() => setPasswordFocused(true)}
            onBlur={(e) => {
              setPasswordFocused(false)
              formik.handleBlur(e)
            }}
            error={passwordFocused ? undefined : showError('password')}
            maxLength={64}
          />
          {(passwordFocused || formik.values.password) && <PasswordChecklist value={formik.values.password} />}
        </div>

        <Button loading={formik.isSubmitting} loadingText="Sending OTP…" className="btn--block">
          Send OTP
        </Button>
      </form>

      <p className="form-foot">
        Already have an account? <Link to="/login">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
