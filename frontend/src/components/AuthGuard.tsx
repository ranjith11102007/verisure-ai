import { Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { authApi } from '../lib/api'

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [authenticated, setAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (!token) {
      setLoading(false)
      setAuthenticated(false)
      return
    }
    authApi.me()
      .then(() => setAuthenticated(true))
      .catch(() => {
        localStorage.removeItem('token')
        setAuthenticated(false)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-surface">Loading...</div>
  }

  if (!authenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
