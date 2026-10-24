import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../../lib/api'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await authApi.login(email, password)
      localStorage.setItem('token', res.data.access_token)
      navigate('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

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
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="w-full h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          {error && <div className="text-sm text-error">{error}</div>}
          <button type="submit" disabled={loading} className="w-full h-9 rounded bg-primary hover:bg-primary-container disabled:opacity-50 text-on-primary text-sm font-medium">{loading ? 'Signing in...' : 'Sign In'}</button>
        </form>
        <p className="text-center text-sm text-on-surface-variant mt-6">
          Don't have an account? <Link to="/register" className="text-primary hover:underline">Register</Link>
        </p>
      </div>
    </div>
  )
}
