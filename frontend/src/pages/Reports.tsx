import { useEffect, useState } from 'react'
import { reportsApi, getApiError, formatDate } from '../lib/api'
import { Card, ErrorBanner, PageHeader, StatCard, StatusBadge } from '../components/ui'

export default function Reports() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await reportsApi.summary()
      setData(res.data)
    } catch (err: any) {
      setError(getApiError(err, 'Failed to generate reports'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const totals = data?.totals || {}
  const byStatus: Record<string, number> = data?.by_status || {}
  const byCategory: Record<string, number> = data?.by_category || {}
  const monthly: Record<string, number> = data?.monthly_volume || {}

  const maxMonthly = Math.max(1, ...Object.values(monthly).map(Number))
  const maxCategory = Math.max(1, ...Object.values(byCategory).map(Number))

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Portfolio-level insight into throughput, compliance and evidence"
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Applications" value={totals.applications ?? 0} icon="folder_open" loading={loading} />
        <StatCard label="Documents" value={totals.documents ?? 0} icon="description" loading={loading} />
        <StatCard
          label="Compliance Findings"
          value={totals.compliance_findings ?? 0}
          icon="gavel"
          loading={loading}
        />
        <StatCard
          label="Approval Rate"
          value={`${totals.approval_rate ?? 0}%`}
          icon="trending_up"
          loading={loading}
          hint={`${byStatus.approved || 0} approved · ${byStatus.rejected || 0} rejected`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Portfolio by Status</h2>
          <p className="text-sm text-on-surface-variant mb-4">Distribution of applications across workflow stages</p>
          {loading ? (
            <div className="py-6 text-center text-sm text-on-surface-variant">Loading...</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(byStatus).map(([key, value]) => {
                const pct = totals.applications ? Math.round((Number(value) / totals.applications) * 100) : 0
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-on-surface">{key.replace(/_/g, ' ')}</span>
                      <span className="text-on-surface-variant">
                        {value as number} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 bg-surface-container rounded mt-1 overflow-hidden">
                      <div className="h-full bg-primary rounded" style={{ width: `${pct}%` }}></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Applications by Category</h2>
          <p className="text-sm text-on-surface-variant mb-4">Where demand is concentrated</p>
          {loading ? (
            <div className="py-6 text-center text-sm text-on-surface-variant">Loading...</div>
          ) : Object.keys(byCategory).length === 0 ? (
            <div className="py-6 text-center text-sm text-on-surface-variant">No applications recorded.</div>
          ) : (
            <div className="space-y-2">
              {Object.entries(byCategory).map(([key, value]) => (
                <div key={key}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-on-surface">{key}</span>
                    <span className="text-on-surface-variant">{value as number}</span>
                  </div>
                  <div className="h-2 bg-surface-container rounded mt-1 overflow-hidden">
                    <div
                      className="h-full bg-secondary rounded"
                      style={{ width: `${(Number(value) / maxCategory) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Submission Volume</h2>
        <p className="text-sm text-on-surface-variant mb-4">Applications created per month</p>
        {loading ? (
          <div className="py-6 text-center text-sm text-on-surface-variant">Loading...</div>
        ) : Object.keys(monthly).length === 0 ? (
          <div className="py-6 text-center text-sm text-on-surface-variant">No volume data yet.</div>
        ) : (
          <div className="flex items-end gap-3 h-40">
            {Object.entries(monthly).map(([month, value]) => (
              <div key={month} className="flex-1 flex flex-col items-center justify-end h-full">
                <div className="text-xs text-on-surface-variant mb-1">{value as number}</div>
                <div
                  className="w-full bg-primary/80 rounded-t"
                  style={{ height: `${(Number(value) / maxMonthly) * 100}%`, minHeight: '4px' }}
                ></div>
                <div className="text-[10px] text-on-surface-variant mt-1">{month}</div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Operational Summary</h2>
        <p className="text-sm text-on-surface-variant mb-4">Key indicators for governance reporting</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Evidence Requests', value: totals.evidence_requests ?? 0 },
            { label: 'Active Rules', value: totals.compliance_rules ?? 0 },
            { label: 'Under Review', value: byStatus.under_review || 0 },
            { label: 'More Info Required', value: byStatus.more_info_required || 0 },
            { label: 'Drafts', value: byStatus.draft || 0 },
            { label: 'Archived', value: byStatus.archived || 0 },
          ].map((m) => (
            <div key={m.label} className="bg-surface-container-low rounded-lg p-3 text-center">
              <div className="text-xl font-bold text-on-surface">{m.value}</div>
              <div className="text-[11px] uppercase tracking-wide text-on-surface-variant mt-1">{m.label}</div>
            </div>
          ))}
        </div>
        {data?.generated_at && (
          <p className="text-xs text-on-surface-variant mt-4">Report generated {formatDate(data.generated_at)}</p>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-headline font-semibold text-on-surface mb-3">Status Reference</h2>
        <div className="flex flex-wrap gap-2">
          {Object.keys(byStatus).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <StatusBadge status={s} />
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}
