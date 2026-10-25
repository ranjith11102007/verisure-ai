import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { evidenceApi, complianceApi, applicationsApi, getApiError, formatDate } from '../lib/api'
import { Card, EmptyState, ErrorBanner, PageHeader, StatusBadge } from '../components/ui'

interface Notification {
  id: string
  kind: 'evidence' | 'finding' | 'decision'
  title: string
  body: string
  at: string
  link: string
  status?: string
}

export default function Notifications() {
  const [items, setItems] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [evidenceRes, findingsRes, appsRes] = await Promise.all([
        evidenceApi.list(),
        complianceApi.findings(),
        applicationsApi.list({ limit: 100 }),
      ])

      const notifications: Notification[] = []

      for (const r of evidenceRes.data.requests || []) {
        notifications.push({
          id: `ev-${r.id}`,
          kind: 'evidence',
          title: r.status === 'pending' ? 'Evidence requested' : 'Evidence request updated',
          body: r.message,
          at: r.created_at,
          link: `/applications/${r.application_id}`,
          status: r.status,
        })
      }

      for (const f of findingsRes.data.findings || []) {
        notifications.push({
          id: `cf-${f.id}`,
          kind: 'finding',
          title: `Compliance finding · ${f.rule_code || 'rule'}`,
          body: f.reason,
          at: f.created_at,
          link: '/compliance',
          status: f.disposition,
        })
      }

      for (const a of appsRes.data.applications || []) {
        if (['approved', 'rejected', 'more_info_required'].includes(a.status)) {
          notifications.push({
            id: `ap-${a.id}`,
            kind: 'decision',
            title: `Application ${a.reference_no} ${a.status.replace(/_/g, ' ')}`,
            body: a.organization_name,
            at: a.updated_at || a.created_at,
            link: `/applications/${a.id}`,
            status: a.status,
          })
        }
      }

      notifications.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      setItems(notifications.slice(0, 50))
    } catch (err: any) {
      setError(getApiError(err, 'Failed to load notifications'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const iconFor = (kind: Notification['kind']) => {
    if (kind === 'evidence') return 'mark_email_unread'
    if (kind === 'finding') return 'gavel'
    return 'task_alt'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        subtitle="Derived from workflow events, compliance findings and decisions"
        actions={
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-surface-container text-on-surface hover:bg-surface-container-high text-sm"
          >
            <span className="material-symbols-outlined text-[18px]">refresh</span>
            Refresh
          </button>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <Card padded={false}>
        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">Loading...</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon="notifications_off"
            title="You're all caught up"
            description="Evidence requests, compliance findings and decisions will appear here."
          />
        ) : (
          <ul className="divide-y divide-outline-variant/20">
            {items.map((n) => (
              <li key={n.id}>
                <Link to={n.link} className="flex items-start gap-3 p-4 hover:bg-surface-container-low/40">
                  <span className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-primary">{iconFor(n.kind)}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-on-surface">{n.title}</span>
                      {n.status && <StatusBadge status={n.status} />}
                    </div>
                    <p className="text-sm text-on-surface-variant mt-0.5">{n.body}</p>
                    <p className="text-xs text-outline mt-1">{formatDate(n.at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
