import { useEffect, useMemo, useState } from 'react'
import { documentsApi, applicationsApi, getApiError, formatBytes, formatDate } from '../lib/api'
import { Card, EmptyState, ErrorBanner, PageHeader, StatCard, StatusBadge } from '../components/ui'

export default function DocumentIntelligence() {
  const [documents, setDocuments] = useState<any[]>([])
  const [apps, setApps] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<any>(null)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const [docsRes, appsRes] = await Promise.all([documentsApi.list(), applicationsApi.list({ limit: 200 })])
      setDocuments(docsRes.data.documents || [])
      const map: Record<string, any> = {}
      for (const a of appsRes.data.applications || []) map[a.id] = a
      setApps(map)
    } catch (err: any) {
      setError(getApiError(err, 'Failed to load documents'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const filtered = useMemo(
    () =>
      documents.filter(
        (d) =>
          !query.trim() ||
          d.original_filename.toLowerCase().includes(query.toLowerCase()) ||
          d.sha256_hash.toLowerCase().includes(query.toLowerCase())
      ),
    [documents, query]
  )

  const totalBytes = documents.reduce((sum, d) => sum + (d.file_size_bytes || 0), 0)
  const pdfCount = documents.filter((d) => d.mime_type === 'application/pdf').length
  const imageCount = documents.filter((d) => d.mime_type?.startsWith('image/')).length

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Intelligence"
        subtitle="Machine-readable inventory of submitted evidence, fingerprints and processing state"
      />

      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Documents" value={documents.length} icon="description" loading={loading} />
        <StatCard label="PDF Files" value={pdfCount} icon="picture_as_pdf" loading={loading} />
        <StatCard label="Images" value={imageCount} icon="image" loading={loading} />
        <StatCard label="Total Volume" value={formatBytes(totalBytes)} icon="database" loading={loading} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" padded={false}>
          <div className="p-4 border-b border-outline-variant/20">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by filename or SHA-256 fingerprint"
              className="w-full h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {loading ? (
            <div className="text-center py-12 text-on-surface-variant">Loading...</div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon="document_scanner"
              title="No documents indexed"
              description="Upload supporting evidence to populate the document intelligence inventory."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-surface-container-low">
                  <tr>
                    {['File', 'Application', 'Type', 'Size', 'Status', 'Uploaded'].map((h) => (
                      <th
                        key={h}
                        className="text-left px-3 py-2 text-xs font-semibold text-on-surface-variant uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {filtered.map((d) => (
                    <tr
                      key={d.id}
                      onClick={() => setSelected(d)}
                      className="hover:bg-surface-container-low/40 cursor-pointer"
                    >
                      <td className="px-3 py-3 text-sm text-on-surface max-w-[180px] truncate">
                        {d.original_filename}
                      </td>
                      <td className="px-3 py-3 text-xs text-on-surface-variant">
                        {apps[d.application_id]?.reference_no || d.application_id.slice(0, 8)}
                      </td>
                      <td className="px-3 py-3 text-xs text-on-surface-variant">{d.mime_type}</td>
                      <td className="px-3 py-3 text-sm text-on-surface-variant">{formatBytes(d.file_size_bytes)}</td>
                      <td className="px-3 py-3">
                        <StatusBadge status={d.status} />
                      </td>
                      <td className="px-3 py-3 text-xs text-on-surface-variant">{formatDate(d.uploaded_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Document Inspector</h2>
          <p className="text-sm text-on-surface-variant mb-4">
            Select a row to inspect extracted metadata and provenance.
          </p>
          {!selected ? (
            <EmptyState icon="touch_app" title="Nothing selected" description="Choose a document from the inventory." />
          ) : (
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">Filename</dt>
                <dd className="text-on-surface break-all">{selected.original_filename}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">Application</dt>
                <dd className="text-on-surface">
                  {apps[selected.application_id]?.organization_name || selected.application_id}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">SHA-256 Fingerprint</dt>
                <dd className="font-mono text-[11px] text-on-surface break-all">{selected.sha256_hash}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">MIME Type</dt>
                <dd className="text-on-surface">{selected.mime_type}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">Size</dt>
                <dd className="text-on-surface">{formatBytes(selected.file_size_bytes)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">Processing Status</dt>
                <dd>
                  <StatusBadge status={selected.status} />
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">Uploaded</dt>
                <dd className="text-on-surface">{formatDate(selected.uploaded_at)}</dd>
              </div>
            </dl>
          )}
        </Card>
      </div>
    </div>
  )
}
