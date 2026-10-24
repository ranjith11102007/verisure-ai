import { Link } from 'react-router-dom'

export default function Login() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-8">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded bg-primary flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-[24px] text-on-primary">shield</span>
          </div>
          <h1 className="text-xl font-headline font-bold text-on-surface">Sign in to VeriSure AI</h1>
          <p className="text-sm text-on-surface-variant mt-1">Intelligent Application Validation & Regulatory Compliance</p>
        </div>
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
            <input type="email" className="w-full h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Password</label>
            <input type="password" className="w-full h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <button type="submit" className="w-full h-9 rounded bg-primary hover:bg-primary-container text-on-primary text-sm font-medium">Sign In</button>
        </form>
        <p className="text-center text-sm text-on-surface-variant mt-6">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
