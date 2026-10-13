import { useEffect, useState } from 'react'
import { useFormik } from 'formik'
import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import Icon from '../components/Icon'
import Alert from '../components/Alert'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { useAuth } from '../auth/useAuth'
import { updateMyProfile } from '../api/customerApi'
import { parseApiError } from '../api/client'
import { useDocumentTitle } from '../utils/hooks'
import { fieldError } from '../utils/formErrors'
import { formatMobile, validateName } from '../utils/validators'

const ROLE_LABELS = {
  AGENT: 'Agent',
  MANAGER: 'Branch manager',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super admin',
}

const STATUS_LABELS = { ACTIVE: 'Active', PENDING: 'Waiting for OTP', INACTIVE: 'Inactive', BLOCKED: 'Blocked' }

function formatDate(value) {
  if (!value) return null
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Signed-in home. Customers: GET/PUT /api/customers/me. Staff: GET /api/auth/me.
export default function DashboardPage() {
  useDocumentTitle('Home')
  const { user, signOut, refreshProfile, updateUser } = useAuth()
  const navigate = useNavigate()
  const [loadError, setLoadError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [saved, setSaved] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  const isCustomer = user?.userType === 'CUSTOMER'

  // Fresh details from the server each time the page opens.
  useEffect(() => {
    let active = true
    refreshProfile().catch((error) => {
      const err = parseApiError(error)
      if (active && err.status !== 401) setLoadError(err.message)
    })
    return () => {
      active = false
    }
  }, [refreshProfile])

  const nameForm = useFormik({
    enableReinitialize: true,
    initialValues: { name: user?.name || '' },
    validate: (v) => {
      const e = validateName(v.name)
      return e ? { name: e } : {}
    },
    onSubmit: async (values, helpers) => {
      setSaved(null)
      try {
        const { data } = await updateMyProfile({ name: values.name })
        updateUser({ name: data?.name ?? values.name.trim() })
        setEditing(false)
        setSaved({ tone: 'success', text: 'Your name has been updated.' })
      } catch (error) {
        helpers.setFieldError('name', parseApiError(error).message)
      }
    },
  })

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut() // POST /api/auth/logout, then clear the session
    navigate('/login', { replace: true })
  }

  const firstName = user?.name?.split(' ')[0]
  const accountType = isCustomer ? 'Customer' : ROLE_LABELS[user?.role] || user?.role || 'Staff'
  const memberSince = formatDate(user?.createdAt)

  return (
    <div className="home">
      <header className="home__bar">
        <BrandMark tone="dark" />
        <button type="button" className="btn btn--ghost" onClick={handleSignOut} disabled={signingOut}>
          <Icon name="logout" size={18} />
          <span>{signingOut ? 'Signing out…' : 'Sign out'}</span>
        </button>
      </header>
      <main className="home__main">
        <h1 className="home__title">{firstName ? `Welcome, ${firstName}` : 'Welcome'}</h1>
        <p className="home__lede">
          {isCustomer
            ? "You're signed in. Your chits, dues and auctions will appear here."
            : 'You are signed in to the staff account. The staff portal comes next.'}
        </p>

        {loadError && <Alert tone="error">Couldn't refresh your details: {loadError}</Alert>}
        {saved && <Alert tone={saved.tone}>{saved.text}</Alert>}

        <dl className="details">
          {isCustomer && (
            <div className="details__row--edit">
              <dt>Name</dt>
              <dd>
                {editing ? (
                  <form className="inline-edit" onSubmit={nameForm.handleSubmit} noValidate>
                    <TextField
                      label="Full name"
                      name="name"
                      autoComplete="name"
                      value={nameForm.values.name}
                      onChange={nameForm.handleChange}
                      onBlur={nameForm.handleBlur}
                      error={fieldError(nameForm, 'name')}
                      maxLength={100}
                      autoFocus
                    />
                    <div className="inline-edit__actions">
                      <Button loading={nameForm.isSubmitting} loadingText="Saving…">
                        Save name
                      </Button>
                      <button
                        type="button"
                        className="btn btn--ghost"
                        onClick={() => {
                          nameForm.resetForm()
                          setEditing(false)
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <span className="details__value-row">
                    <span>{user?.name || 'Not set'}</span>
                    <button
                      type="button"
                      className="link-btn"
                      onClick={() => {
                        setSaved(null)
                        setEditing(true)
                      }}
                    >
                      Edit
                    </button>
                  </span>
                )}
              </dd>
            </div>
          )}
          {user?.mobile && (
            <div>
              <dt>Mobile</dt>
              <dd className="tabular">{formatMobile(user.mobile)}</dd>
            </div>
          )}
          {user?.email && (
            <div>
              <dt>Email</dt>
              <dd>{user.email}</dd>
            </div>
          )}
          <div>
            <dt>Account type</dt>
            <dd>{accountType}</dd>
          </div>
          {user?.status && (
            <div>
              <dt>Status</dt>
              <dd>{STATUS_LABELS[user.status] || user.status}</dd>
            </div>
          )}
          {memberSince && (
            <div>
              <dt>Member since</dt>
              <dd>{memberSince}</dd>
            </div>
          )}
        </dl>
      </main>
    </div>
  )
}
