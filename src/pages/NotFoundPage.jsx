import { Link } from 'react-router-dom'
import BrandMark from '../components/BrandMark'
import { useDocumentTitle } from '../utils/hooks'

export default function NotFoundPage() {
  useDocumentTitle('Page not found')
  return (
    <div className="home">
      <header className="home__bar">
        <BrandMark tone="dark" />
      </header>
      <main className="home__main">
        <h1 className="home__title">This page doesn't exist</h1>
        <p className="home__lede">Check the address, or go back to sign in.</p>
        <p>
          <Link to="/login" className="btn btn--primary">
            Go to sign in
          </Link>
        </p>
      </main>
    </div>
  )
}
