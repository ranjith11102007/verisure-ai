import { useEffect, useState } from 'react'
import { documentsApi, getApiError, formatBytes, formatDate } from '../lib/api'
import { Card, EmptyState, ErrorBanner, PageHeader, PrimaryButton, StatusBadge } from '../components/ui'

export default function DocumentAuth() {
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState<string | null>(null)
  const [results, setResults] = useState<Record<string, any>>({})
  const [filter, setFilter] = useState<'all' | 'verified' | 'flagged' | 'unavailable'>('all')

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await documentsApi.list()
      setDocuments(res.data.documents || [])
    } catch (err: any) {
      setError(getApiError(err, 'Failed to load documents'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const verify = async (id: string) => {
    setVerifying(id)
    try {
      const res = await documentsApi.verify(id)
      setResults((prev) => ({ ...prev, [id]: res.data }))
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [id]: { error: getApiError(err, 'Verification failed') },
      }))
    } finally {
      setVerifying(null)
    }
  }

  const verifyAll = async () => {
    for (const d of documents) {
      // sequential to keep the UI readable and avoid hammering the API
      // eslint-disable-next-line no-await-in-loop
      await verify(d.id)
    }
  }

  const classify = (id: string) => {
    const r = results[id]
    if (!r) return 'unverified'
    if (r.error) return 'flagged'
    if (!r.file_available) return 'unavailable'
    return r.integrity_verified ? 'verified' : 'flagged'
  }

  const filtered = documents.filter((d) => filter === 'all' || classify(d.id) === filter)

  const verifiedCount = documents.filter((d) => classify(d.id) === 'verified').length
  const flaggedCount = documents.filter((d) => classify(d.id) === 'flagged').length
  const unavailableCount = documents.filter((d) => classify(d.id) === 'unavailable').length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Authentication"
        subtitle="Verify tamper-evidence by recomputing SHA-256 fingerprints against the recorded ledger"
        actions={
          <PrimaryButton icon="shield" onClick={verifyAll} disabled={verifying !== null || documents.length === 0}>
            {verifying ? 'Verifying...' : 'Verify All'}
          </PrimaryButton>
        }
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { key: 'all', label: 'All Documents', value: documents.length },
          { key: 'verified', label: 'Verified', value: verifiedCount },
          { key: 'flagged', label: 'Flagged', value: flaggedCount },
          { key: 'unavailable', label: 'File Unavailable', value: unavailableCount },
        ].map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key as any)}
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

      <Card padded={false}>
        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">Loading...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon="verified_user"
            title="No documents to authenticate"
            description="Upload documents from the Upload Center to run integrity verification."
          />
        ) : (
          <div className="divide-y divide-outline-variant/20">
            {filtered.map((d) => {
              const r = results[d.id]
              const state = classify(d.id)
              return (
                <div key={d.id} className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-on-surface-variant">
                          {d.mime_type === 'application/pdf' ? 'picture_as_pdf' : 'image'}
                        </span>
                        <p className="text-sm font-medium text-on-surface truncate">{d.original_filename}</p>
                        <StatusBadge status={d.status} />
                        {state !== 'unverified' && (
                          <span
                            className={`text-[11px] px-2 py-0.5 rounded font-medium ${
                              state === 'verified'
                                ? 'bg-secondary-fixed/60 text-on-secondary-fixed-variant'
                                : state === 'unavailable'
                                ? 'bg-surface-container-high text-on-surface'
                                : 'bg-error-container text-on-error-container'
                            }`}
                          >
                            {state === 'verified'
                              ? 'Integrity verified'
                              : state === 'unavailable'
                              ? 'File unavailable'
                              : 'Flagged'}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-on-surface-variant">
                        {formatBytes(d.file_size_bytes)} · Uploaded {formatDate(d.uploaded_at)}
                      </p>
                      <p className="mt-1 font-mono text-[10px] text-outline break-all">
                        Recorded: {d.sha256_hash}
                      </p>
                      {r && !r.error && r.computed_hash && (
                        <p className="mt-0.5 font-mono text-[10px] break-all text-on-surface-variant">
                          Computed: {r.computed_hash}
                        </p>
                      )}
                      {r?.error && <p className="mt-1 text-xs text-error">{r.error}</p>}
                      {r?.message && <p className="mt-1 text-xs text-on-surface-variant">{r.message}</p>}
                    </div>
                    <PrimaryButton icon="fingerprint" onClick={() => verify(d.id)} disabled={verifying === d.id}>
                      {verifying === d.id ? 'Verifying...' : 'Verify'}
                    </PrimaryButton>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      <Card>
        <h2 className="text-sm font-semibold text-on-surface mb-2">How authentication works</h2>
        <ul className="text-sm text-on-surface-variant space-y-1 list-disc pl-5">
          <li>Every uploaded file is hashed with SHA-256 at ingest and the fingerprint is stored immutably.</li>
          <li>Verification recomputes the hash from the stored file and compares it to the recorded value.</li>
          <li>A mismatch indicates the file changed after upload (possible tampering).</li>
          <li>
            On free hosting the filesystem is ephemeral, so a file may be unavailable after a restart — the
            recorded fingerprint is still preserved in the database.
          </li>
        </ul>
      </Card>
    </div>
  )
}
