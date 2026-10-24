import { useState, useEffect } from 'react'
import { applicationsApi } from '../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState({ total: 0, submitted: 0, under_review: 0, approved: 0 })
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    applicationsApi.list({ limit: 5 })
      .then(res => {
        const apps = res.data.applications || []
        setRecent(apps)
        setStats({
          total: res.data.total || apps.length,
          submitted: apps.filter((a: any) => a.status === 'submitted').length,
          under_review: apps.filter((a: any) => a.status === 'under_review').length,
          approved: apps.filter((a: any) => a.status === 'approved').length,
        })
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant text-xs uppercase tracking-wider mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Statutory Governance Engine</span>
            <span>/</span>
            <span>Real-time Oversight</span>
          </div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Executive Regulatory Oversight</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Submissions', value: stats.total, icon: 'account_balance', color: 'primary' },
          { label: 'Submitted', value: stats.submitted, icon: 'send', color: 'secondary' },
          { label: 'Under Review', value: stats.under_review, icon: 'pending_actions', color: 'primary-container' },
          { label: 'Approved', value: stats.approved, icon: 'task_alt', color: 'secondary' },
        ].map((m, i) => (
          <div key={i} className="bg-surface-container-lowest rounded-xl p-5 shadow-sm border border-outline-variant/20">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-outline">{m.label}</div>
              </div>
              <div className={`w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center text-${m.color}`}>
                <span className="material-symbols-outlined text-[20px]">{m.icon}</span>
              </div>
            </div>
            <div className="mt-4 text-3xl font-headline font-bold text-on-surface">{loading ? '-' : m.value}</div>
          </div>
        ))}
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-6">
        <div className="mb-4">
          <h2 className="text-lg font-headline font-semibold text-on-surface">Recent Applications</h2>
          <p className="text-sm text-on-surface-variant">Latest submissions from your account</p>
        </div>
        {loading ? (
          <div className="text-center py-8 text-on-surface-variant">Loading...</div>
        ) : recent.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 block">inbox</span>
            <p>No applications yet. Create your first application from the Applications page.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map((app) => (
              <div key={app.id} className="flex items-center justify-between p-3 bg-surface-container-low/50 rounded-lg">
                <div>
                  <div className="font-medium text-on-surface">{app.organization_name}</div>
                  <div className="text-sm text-on-surface-variant font-mono">{app.reference_no}</div>
                </div>
                <div className="text-sm text-on-surface-variant capitalize">{app.status.replace('_', ' ')}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
