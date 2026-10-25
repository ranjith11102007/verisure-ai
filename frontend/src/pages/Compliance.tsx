import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { complianceApi, applicationsApi, getApiError, formatDate } from '../lib/api'
import { Card, EmptyState, ErrorBanner, PageHeader, PrimaryButton, StatusBadge, SecondaryButton, inputClass } from '../components/ui'

export default function Compliance() {
  const [findings, setFindings] = useState<any[]>([])
  const [apps, setApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [selectedApp, setSelectedApp] = useState('')
  const [running, setRunning] = useState(false)
  const [dispositionFilter, setDispositionFilter] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [findingsRes, appsRes] = await Promise.all([
        complianceApi.findings(),
        applicationsApi.list({ limit: 200 }),
      ])
      setFindings(findingsRes.data.findings || [])
      setApps(appsRes.data.applications || [])
    } catch (err: any) {
      setError(getApiError(err, 'Failed to load compliance findings'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleRun = async () => {
    if (!selectedApp) {
      setError('Select an application to evaluate.')
      return
    }
    setRunning(true)
    setError('')
    try {
      const res = await complianceApi.run(selectedApp)
      setInfo(
        `Evaluated ${res.data.rules_evaluated} rules and raised ${res.data.findings_created} finding(s).`
      )
      await load()
    } catch (err: any) {
      setError(getApiError(err, 'Compliance run failed'))
    } finally {
      setRunning(false)
    }
  }

  const handleDisposition = async (id: string, disposition: string) => {
    try {
      await complianceApi.updateFinding(id, disposition)
      await load()
    } catch (err: any) {
      setError(getApiError(err, 'Could not update finding'))
    }
  }

  const filtered = findings.filter((f) => !dispositionFilter || f.disposition === dispositionFilter)

  const counts = {
    pending: findings.filter((f) => f.disposition === 'pending').length,
    resolved: findings.filter((f) => f.disposition === 'resolved').length,
    accepted: findings.filter((f) => f.disposition === 'accepted').length,
    rejected: findings.filter((f) => f.disposition === 'rejected').length,
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Compliance Findings"
        subtitle="Rule-based evaluation of applications against the statutory rule set"
      />

      {error && <ErrorBanner message={error} onRetry={load} />}
      {info && (
        <div className="rounded-lg border border-secondary/30 bg-secondary-fixed/30 px-4 py-3 text-sm text-on-secondary-fixed-variant">
          {info}
        </div>
      )}

      <Card>
        <h2 className="text-sm font-semibold text-on-surface mb-3">Run a compliance evaluation</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[240px]">
            <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)} className={inputClass}>
              <option value="">Select an application</option>
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.reference_no} — {a.organization_name}
                </option>
              ))}
            </select>
          </div>
          <PrimaryButton icon="fact_check" onClick={handleRun} disabled={running || !selectedApp}>
            {running ? 'Evaluating...' : 'Evaluate Rules'}
          </PrimaryButton>
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Pending', value: counts.pending, key: 'pending' },
          { label: 'Resolved', value: counts.resolved, key: 'resolved' },
          { label: 'Accepted', value: counts.accepted, key: 'accepted' },
          { label: 'Rejected', value: counts.rejected, key: 'rejected' },
        ].map((c) => (
          <button
            key={c.key}
            onClick={() => setDispositionFilter(dispositionFilter === c.key ? '' : c.key)}
            className={`text-left rounded-xl p-5 shadow-sm border transition-colors ${
              dispositionFilter === c.key
                ? 'bg-primary-fixed/40 border-primary/40'
                : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container-low/50'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-outline">{c.label}</div>
            <div className="mt-3 text-3xl font-headline font-bold text-on-surface">{c.value}</div>
          </button>
        ))}
      </div>

      <Card padded={false}>
        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">Loading...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="fact_check"
            title="No compliance findings"
            description="Run an evaluation against an application to surface rule deviations."
          />
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {filtered.map((f) => (
              <div key={f.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-semibold text-primary">{f.rule_code}</span>
                      <StatusBadge status={f.severity || 'medium'} />
                      <StatusBadge status={f.disposition} />
                    </div>
                    <p className="text-sm font-medium text-on-surface mt-1">{f.rule_name}</p>
                    <p className="text-sm text-on-surface-variant mt-1">{f.reason}</p>
                    {f.recommended_action && (
                      <p className="text-xs text-on-surface-variant mt-1">
                        <span className="uppercase tracking-wide text-outline">Recommended: </span>
                        {f.recommended_action}
                      </p>
                    )}
                    {f.affected_field && (
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        <span className="uppercase tracking-wide text-outline">Field: </span>
                        {f.affected_field}
                      </p>
                    )}
                    <p className="text-[11px] text-outline mt-1">Raised {formatDate(f.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SecondaryButton onClick={() => handleDisposition(f.id, 'accepted')}>Accept</SecondaryButton>
                    <SecondaryButton onClick={() => handleDisposition(f.id, 'resolved')}>Resolve</SecondaryButton>
                    <SecondaryButton onClick={() => handleDisposition(f.id, 'rejected')}>Reject</SecondaryButton>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <div className="text-sm">
        <Link to="/rules" className="text-primary hover:underline">
          Manage the rules engine →
        </Link>
      </div>
    </div>
  )
}
