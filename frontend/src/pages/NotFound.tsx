import { Link, useNavigate } from 'react-router-dom'

export default function NotFound() {
  const navigate = useNavigate()
  const signedIn = typeof window !== 'undefined' && Boolean(localStorage.getItem('token'))

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-6">
      <div className="w-full max-w-lg text-center">
        <div className="w-14 h-14 rounded-xl bg-surface-container flex items-center justify-center mx-auto">
          <span className="material-symbols-outlined text-[28px] text-primary">explore_off</span>
        </div>
        <p className="mt-6 font-mono text-sm text-primary">404</p>
        <h1 className="mt-2 text-2xl font-headline font-bold text-on-surface">Page not found</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          The page you are looking for does not exist or may have been moved.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            to={signedIn ? '/dashboard' : '/'}
            className="px-5 py-2.5 rounded bg-primary text-on-primary text-sm font-medium hover:bg-primary-container"
          >
            {signedIn ? 'Back to dashboard' : 'Back to home'}
          </Link>
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded bg-surface-container text-on-surface text-sm font-medium hover:bg-surface-container-high"
          >
            Go back
          </button>
        </div>
      </div>
    </div>
  )
}
