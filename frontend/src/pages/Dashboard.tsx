import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi, reportsApi, complianceApi } from '../lib/api'
import { Card, PageHeader, StatCard, StatusBadge, EmptyState, ErrorBanner } from '../components/ui'
import { formatDate, formatStatus } from '../lib/api'

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [findings, setFindings] = useState<any[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsRes, appsRes, findingsRes, summaryRes] = await Promise.all([
        applicationsApi.stats(),
        applicationsApi.list({ limit: 5 }),
        complianceApi.findings(),
        reportsApi.summary(),
      ])
      setStats(statsRes.data)
      setRecent(appsRes.data.applications || [])
      setFindings((findingsRes.data.findings || []).slice(0, 5))
      setSummary(summaryRes.data)
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Unable to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const byStatus = stats?.by_status || {}
  const pendingFindings = findings.filter((f) => f.disposition === 'pending').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Regulatory Oversight"
        subtitle="Real-time oversight of submissions, evidence and statutory compliance"
        eyebrow={
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
            <span>Statutory Governance Engine</span>
            <span>/</span>
            <span>Real-time Oversight</span>
          </>
        }
        actions={
          <Link
            to="/applications"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded bg-primary text-on-primary hover:bg-primary-container text-sm shadow-sm"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Application
          </Link>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Submissions"
          value={stats?.total ?? 0}
          icon="account_balance"
          loading={loading}
          hint={`${byStatus.draft || 0} in draft`}
        />
        <StatCard
          label="Submitted"
          value={byStatus.submitted || 0}
          icon="send"
          loading={loading}
          hint={`${byStatus.under_review || 0} under review`}
        />
        <StatCard
          label="Approved"
          value={byStatus.approved || 0}
          icon="task_alt"
          loading={loading}
          hint={`${summary?.totals?.approval_rate ?? 0}% approval rate`}
        />
        <StatCard
          label="Open Compliance Findings"
          value={pendingFindings}
          icon="gavel"
          loading={loading}
          hint={`${stats?.documents ?? 0} documents on file`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-6 pb-4">
            <h2 className="text-lg font-headline font-semibold text-on-surface">Recent Applications</h2>
            <p className="text-sm text-on-surface-variant">Latest submissions from your account</p>
          </div>
          {loading ? (
            <div className="text-center py-8 text-on-surface-variant">Loading...</div>
          ) : recent.length === 0 ? (
            <EmptyState
              icon="inbox"
              title="No applications yet"
              description="Create your first institutional application to begin the compliance workflow."
              action={
                <Link to="/applications" className="text-primary text-sm hover:underline">
                  Go to Application Registry
                </Link>
              }
            />
          ) : (
            <div className="divide-y divide-outline-variant/20">
              {recent.map((app) => (
                <Link
                  key={app.id}
                  to={`/applications/${app.id}`}
                  className="flex items-center justify-between px-6 py-3 hover:bg-surface-container-low/50"
                >
                  <div>
                    <div className="font-medium text-on-surface">{app.organization_name}</div>
                    <div className="text-xs text-on-surface-variant font-mono">{app.reference_no}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={app.status} />
                    <span className="text-xs text-on-surface-variant">{formatDate(app.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-headline font-semibold text-on-surface">Compliance Snapshot</h2>
          <p className="text-sm text-on-surface-variant mb-4">Latest findings across your portfolio</p>
          {loading ? (
            <div className="text-center py-6 text-on-surface-variant text-sm">Loading...</div>
          ) : findings.length === 0 ? (
            <div className="text-sm text-on-surface-variant py-6 text-center">
              No compliance findings recorded yet.
              <div className="mt-2">
                <Link to="/compliance" className="text-primary hover:underline text-sm">
                  Run a compliance check
                </Link>
              </div>
            </div>
          ) : (
            <ul className="space-y-3">
              {findings.map((f) => (
                <li key={f.id} className="border border-outline-variant/30 rounded-lg p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono text-primary">{f.rule_code}</span>
                    <StatusBadge status={f.severity || 'medium'} />
                  </div>
                  <p className="text-sm text-on-surface mt-1 line-clamp-2">{f.reason}</p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-headline font-semibold text-on-surface mb-4">Portfolio by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {Object.entries(byStatus).map(([key, value]) => (
            <div key={key} className="bg-surface-container-low rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-on-surface">{value as number}</div>
              <div className="text-[11px] uppercase tracking-wide text-on-surface-variant mt-1">
                {formatStatus(key)}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
