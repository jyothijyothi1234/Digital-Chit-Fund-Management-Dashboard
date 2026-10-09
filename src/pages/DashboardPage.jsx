import { useNavigate } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import Icon from '../components/Icon'
import { useAuth } from '../auth/useAuth'
import { useDocumentTitle } from '../utils/hooks'
import { formatMobile } from '../utils/validators'

const ROLE_LABELS = {
  AGENT: 'Agent',
  MANAGER: 'Branch manager',
  ADMIN: 'Admin',
  SUPER_ADMIN: 'Super admin',
}

// Placeholder home after sign in. Replace with the customer dashboard and staff portal.
export default function DashboardPage() {
  useDocumentTitle('Home')
  const { user, signOut } = useAuth()
  const navigate = useNavigate()

  const firstName = user?.name?.split(' ')[0]
  const accountType = user?.role ? ROLE_LABELS[user.role] || user.role : user?.userType === 'STAFF' ? 'Staff' : 'Customer'

  const handleSignOut = () => {
    signOut()
    navigate('/login', { replace: true, state: { flash: 'You have signed out.' } })
  }

  return (
    <div className="home">
      <header className="home__bar">
        <BrandMark tone="dark" />
        <button type="button" className="btn btn--ghost" onClick={handleSignOut}>
          <Icon name="logout" size={18} />
          <span>Sign out</span>
        </button>
      </header>
      <main className="home__main">
        <h1 className="home__title">{firstName ? `Welcome, ${firstName}` : 'Welcome'}</h1>
        <p className="home__lede">You're signed in. Your chits, dues and auctions will appear here.</p>
        <dl className="details">
          {user?.name && (
            <div>
              <dt>Name</dt>
              <dd>{user.name}</dd>
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
        </dl>
      </main>
    </div>
  )
}
