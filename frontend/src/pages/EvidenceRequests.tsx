import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { evidenceApi, getApiError, formatDate } from '../lib/api'
import { Card, EmptyState, ErrorBanner, PageHeader, PrimaryButton, StatusBadge } from '../components/ui'

export default function EvidenceRequests() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await evidenceApi.list()
      setRequests(res.data.requests || [])
    } catch (err: any) {
      setError(getApiError(err, 'Failed to load evidence requests'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const respond = async (id: string) => {
    const notes = responses[id]
    if (!notes || !notes.trim()) {
      setError('Enter a response before submitting.')
      return
    }
    setBusy(id)
    setError('')
    try {
      await evidenceApi.respond(id, notes.trim())
      setResponses((prev) => ({ ...prev, [id]: '' }))
      await load()
    } catch (err: any) {
      setError(getApiError(err, 'Could not submit response'))
    } finally {
      setBusy(null)
    }
  }

  const filtered = requests.filter((r) => !filter || r.status === filter)
  const pending = requests.filter((r) => r.status === 'pending').length
  const responded = requests.filter((r) => r.status === 'responded').length

  const overdue = (due?: string) => due && new Date(due).getTime() < Date.now()

  return (
    <div className="space-y-6">
      <PageHeader
        title="Evidence Requests"
        subtitle="Outstanding information requests raised by the reviewing authority"
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'All Requests', value: requests.length, key: '' },
          { label: 'Pending', value: pending, key: 'pending' },
          { label: 'Responded', value: responded, key: 'responded' },
          { label: 'Completed', value: requests.filter((r) => r.status === 'completed').length, key: 'completed' },
        ].map((c) => (
          <button
            key={c.label}
            onClick={() => setFilter(filter === c.key ? '' : c.key)}
            className={`text-left rounded-xl p-5 shadow-sm border transition-colors ${
              filter === c.key
                ? 'bg-primary-fixed/40 border-primary/40'
                : 'bg-surface-container-lowest border-outline-variant/20 hover:bg-surface-container-low/50'
            }`}
          >
            <div className="text-xs uppercase tracking-wider text-outline">{c.label}</div>
            <div className="mt-3 text-3xl font-headline font-bold text-on-surface">{c.value}</div>
          </button>
        ))}
      </div>

      {loading ? (
        <Card>
          <div className="text-center py-12 text-on-surface-variant">Loading...</div>
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon="mark_email_read"
            title="No evidence requests"
            description="When a reviewer needs additional information, requests will appear here."
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {r.reference_no && (
                      <Link
                        to={`/applications/${r.application_id}`}
                        className="font-mono text-xs font-semibold text-primary hover:underline"
                      >
                        {r.reference_no}
                      </Link>
                    )}
                    <StatusBadge status={r.status} />
                    {r.status === 'pending' && overdue(r.due_at) && (
                      <span className="text-[11px] px-2 py-0.5 rounded bg-error-container text-on-error-container font-medium">
                        Overdue
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-on-surface mt-2">{r.message}</p>
                  <p className="text-xs text-on-surface-variant mt-1">
                    Due {formatDate(r.due_at)} · Raised {formatDate(r.created_at)}
                  </p>
                  {Array.isArray(r.items) && r.items.length > 0 && (
                    <ul className="mt-2 text-xs text-on-surface-variant list-disc pl-5">
                      {r.items.map((item: any, i: number) => (
                        <li key={i}>{typeof item === 'string' ? item : item.description || JSON.stringify(item)}</li>
                      ))}
                    </ul>
                  )}
                  {r.response_notes && (
                    <div className="mt-3 rounded bg-surface-container-low px-3 py-2 text-sm">
                      <span className="text-xs uppercase tracking-wide text-outline">Your response</span>
                      <p className="text-on-surface mt-1">{r.response_notes}</p>
                      {r.responded_at && (
                        <p className="text-[11px] text-outline mt-1">Submitted {formatDate(r.responded_at)}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {r.status === 'pending' && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={responses[r.id] || ''}
                    onChange={(e) => setResponses({ ...responses, [r.id]: e.target.value })}
                    rows={2}
                    placeholder="Describe the evidence you are providing..."
                    className="w-full px-3 py-2 rounded border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <PrimaryButton onClick={() => respond(r.id)} disabled={busy === r.id} icon="send">
                    {busy === r.id ? 'Submitting...' : 'Submit Response'}
                  </PrimaryButton>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
