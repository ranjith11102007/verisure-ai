import { useEffect, useMemo, useState } from 'react'
import { auditApi, getApiError, formatDate } from '../lib/api'
import { Card, EmptyState, ErrorBanner, PageHeader } from '../components/ui'

const ENTITY_TYPES = ['application', 'document', 'compliance_run', 'evidence_request', 'user']

export default function Audit() {
  const [events, setEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [entityType, setEntityType] = useState('')
  const [query, setQuery] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await auditApi.list(entityType ? { entity_type: entityType } : undefined)
      setEvents(res.data.events || [])
    } catch (err: any) {
      setError(getApiError(err, 'Failed to load audit trail'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType])

  const filtered = useMemo(
    () =>
      events.filter(
        (e) =>
          !query.trim() ||
          e.action.toLowerCase().includes(query.toLowerCase()) ||
          (e.entity_id || '').toLowerCase().includes(query.toLowerCase())
      ),
    [events, query]
  )

  const actionIcon = (action: string) => {
    if (action.includes('upload')) return 'upload_file'
    if (action.includes('submit')) return 'send'
    if (action.includes('status')) return 'swap_horiz'
    if (action.includes('verif')) return 'verified_user'
    if (action.includes('compliance')) return 'fact_check'
    if (action.includes('evidence')) return 'mark_email_unread'
    if (action.includes('profile')) return 'person'
    return 'history'
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit History"
        subtitle="Immutable, chronological record of every significant action"
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-outline-variant/20">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by action or entity id"
            className="flex-1 min-w-[220px] h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">All entity types</option>
            {ENTITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">Loading...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="history_toggle_off"
            title="No audit events"
            description="Actions such as uploads, submissions and status changes are recorded here automatically."
          />
        ) : (
          <ol className="relative border-l border-outline-variant/50 ml-8 my-6 space-y-5 pr-6">
            {filtered.map((e) => (
              <li key={e.id} className="ml-6">
                <span className="absolute -left-[13px] w-6 h-6 rounded-full bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-primary">
                    {actionIcon(e.action)}
                  </span>
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-on-surface capitalize">
                    {e.action.replace(/\./g, ' ').replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">
                    {e.entity_type.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant mt-0.5">{formatDate(e.created_at)}</p>
                {e.entity_id && (
                  <p className="font-mono text-[10px] text-outline mt-0.5 break-all">{e.entity_id}</p>
                )}
                {e.details && Object.keys(e.details).length > 0 && (
                  <pre className="mt-1 text-[10px] text-on-surface-variant bg-surface-container-low rounded px-2 py-1 overflow-x-auto">
                    {JSON.stringify(e.details)}
                  </pre>
                )}
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  )
}
