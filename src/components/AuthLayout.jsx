import BrandMark from './BrandMark'
import ChitRing from './ChitRing'
import Icon from './Icon'

/** Two-column frame for sign in, registration and OTP. The panel collapses to a header on phones. */
export default function AuthLayout({ headline, children }) {
  return (
    <div className="auth">
      <aside className="auth__panel">
        <BrandMark tone="light" />
        <div className="auth__story">
          <h2 className="auth__headline">{headline}</h2>
          <ChitRing />
        </div>
        <p className="auth__assurance">
          <Icon name="shield" size={18} />
          Passwords are encrypted, and every new account is confirmed with an OTP to the member's mobile.
        </p>
      </aside>
      <main className="auth__main">
        <div className="auth__content">{children}</div>
      </main>
    </div>
  )
}
