import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi, documentsApi, getApiError, formatBytes, formatDate } from '../lib/api'
import { Card, ErrorBanner, Field, PageHeader, PrimaryButton, StatusBadge, EmptyState, inputClass } from '../components/ui'

export default function Upload() {
  const [apps, setApps] = useState<any[]>([])
  const [applicationId, setApplicationId] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<any>(null)
  const [recent, setRecent] = useState<any[]>([])
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const loadApps = async () => {
    try {
      const res = await applicationsApi.list({ limit: 100 })
      const editable = (res.data.applications || []).filter((a: any) =>
        ['draft', 'more_info_required'].includes(a.status)
      )
      setApps(editable)
      if (editable.length > 0 && !applicationId) setApplicationId(editable[0].id)
    } catch (err: any) {
      setError(getApiError(err, 'Could not load applications'))
    }
  }

  const loadRecent = async () => {
    try {
      const res = await documentsApi.list()
      setRecent((res.data.documents || []).slice(0, 8))
    } catch {
      setRecent([])
    }
  }

  useEffect(() => {
    loadApps()
    loadRecent()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUpload = async () => {
    if (!file) {
      setError('Choose a file to upload first.')
      return
    }
    if (!applicationId) {
      setError('Select an application to attach the document to.')
      return
    }
    setUploading(true)
    setError('')
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('application_id', applicationId)
      const res = await documentsApi.upload(fd)
      setResult(res.data)
      setFile(null)
      if (inputRef.current) inputRef.current.value = ''
      await loadRecent()
    } catch (err: any) {
      setError(getApiError(err, 'Upload failed'))
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Document Upload Center"
        subtitle="Submit supporting evidence with SHA-256 fingerprinting and duplicate detection"
      />

      {error && <ErrorBanner message={error} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <Field label="Attach to Application">
            <select
              value={applicationId}
              onChange={(e) => setApplicationId(e.target.value)}
              className={inputClass}
            >
              {apps.length === 0 && <option value="">No draft applications available</option>}
              {apps.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.reference_no} — {a.organization_name}
                </option>
              ))}
            </select>
          </Field>

          {apps.length === 0 && (
            <p className="text-xs text-on-surface-variant mt-2">
              Documents can only be attached to applications in draft or more-information-required status.{' '}
              <Link to="/applications" className="text-primary hover:underline">
                Create an application
              </Link>{' '}
              first.
            </p>
          )}

          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files?.[0]
              if (f) setFile(f)
            }}
            onClick={() => inputRef.current?.click()}
            className={`mt-5 cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${
              dragging ? 'border-primary bg-primary-fixed/20' : 'border-outline-variant bg-surface-container-low/40'
            }`}
          >
            <span className="material-symbols-outlined text-4xl text-primary">cloud_upload</span>
            <p className="mt-2 text-sm font-medium text-on-surface">
              {file ? file.name : 'Drag & drop a file here, or click to browse'}
            </p>
            <p className="text-xs text-on-surface-variant mt-1">PDF, PNG or JPEG · up to 50 MB</p>
            {file && (
              <p className="text-xs text-on-surface-variant mt-2">Selected size: {formatBytes(file.size)}</p>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,image/png,image/jpeg"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <PrimaryButton
              icon="upload"
              onClick={handleUpload}
              disabled={uploading || !file || !applicationId}
            >
              {uploading ? 'Uploading...' : 'Upload Document'}
            </PrimaryButton>
            {file && (
              <button
                onClick={() => {
                  setFile(null)
                  if (inputRef.current) inputRef.current.value = ''
                }}
                className="text-sm text-on-surface-variant hover:text-on-surface"
              >
                Clear
              </button>
            )}
          </div>

          {result && (
            <div className="mt-5 rounded-lg border border-secondary/30 bg-secondary-fixed/30 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-on-secondary-fixed-variant">
                <span className="material-symbols-outlined text-[18px]">verified</span>
                Upload accepted and fingerprinted
              </div>
              <dl className="mt-2 space-y-1 text-xs text-on-secondary-fixed-variant">
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 opacity-70">File</dt>
                  <dd className="break-all">{result.original_filename}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 opacity-70">SHA-256</dt>
                  <dd className="font-mono break-all">{result.sha256_hash}</dd>
                </div>
                <div className="flex gap-2">
                  <dt className="w-24 shrink-0 opacity-70">Size</dt>
                  <dd>{formatBytes(result.file_size_bytes)}</dd>
                </div>
              </dl>
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Recent Uploads</h2>
          <p className="text-sm text-on-surface-variant mb-4">Latest documents across your applications</p>
          {recent.length === 0 ? (
            <EmptyState icon="description" title="No documents yet" />
          ) : (
            <ul className="space-y-3">
              {recent.map((d) => (
                <li key={d.id} className="border border-outline-variant/30 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm text-on-surface truncate">{d.original_filename}</p>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">
                        {formatBytes(d.file_size_bytes)} · {formatDate(d.uploaded_at)}
                      </p>
                    </div>
                    <StatusBadge status={d.status} />
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-outline truncate">{d.sha256_hash}</p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-4">
            <Link to="/document-auth" className="text-primary text-sm hover:underline">
              Verify document integrity →
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
