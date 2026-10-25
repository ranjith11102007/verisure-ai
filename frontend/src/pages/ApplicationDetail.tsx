import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  applicationsApi,
  documentsApi,
  complianceApi,
  evidenceApi,
  auditApi,
  usersApi,
  getApiError,
  formatDate,
  formatBytes,
} from '../lib/api'
import {
  Card,
  ErrorBanner,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  EmptyState,
  inputClass,
} from '../components/ui'

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const [app, setApp] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionInfo, setActionInfo] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [auditEvents, setAuditEvents] = useState<any[]>([])
  const [evidenceResponse, setEvidenceResponse] = useState<Record<string, string>>({})
  const [role, setRole] = useState('applicant')
  const [evidenceMessage, setEvidenceMessage] = useState('')

  const load = async () => {
    if (!id) return
    setLoading(true)
    setError('')
    try {
      const res = await applicationsApi.get(id)
      setApp(res.data)
      try {
        const a = await auditApi.list({ entity_type: 'application', entity_id: id })
        setAuditEvents(a.data.events || [])
      } catch {
        setAuditEvents([])
      }
    } catch (err: any) {
      setError(getApiError(err, 'Failed to load application'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    usersApi
      .me()
      .then((res) => setRole(res.data.role || 'applicant'))
      .catch(() => setRole('applicant'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const flash = (msg: string, isError = false) => {
    if (isError) {
      setActionError(msg)
      setActionInfo('')
    } else {
      setActionInfo(msg)
      setActionError('')
    }
    setTimeout(() => {
      setActionError('')
      setActionInfo('')
    }, 6000)
  }

  const handleUpload = async (file: File) => {
    if (!id) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('application_id', id)
      await documentsApi.upload(fd)
      flash('Document uploaded and fingerprinted successfully.')
      await load()
    } catch (err: any) {
      flash(getApiError(err, 'Upload failed'), true)
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSubmit = async () => {
    if (!id) return
    setBusy('submit')
    try {
      await applicationsApi.submit(id)
      flash('Application submitted for review.')
      await load()
    } catch (err: any) {
      flash(getApiError(err, 'Submission failed'), true)
    } finally {
      setBusy(null)
    }
  }

  const handleRunCompliance = async () => {
    if (!id) return
    setBusy('compliance')
    try {
      const res = await complianceApi.run(id)
      flash(
        `Compliance evaluation completed: ${res.data.rules_evaluated} rules evaluated, ${res.data.findings_created} finding(s) raised.`
      )
      await load()
    } catch (err: any) {
      flash(getApiError(err, 'Compliance run failed'), true)
    } finally {
      setBusy(null)
    }
  }

  const handleDeleteDoc = async (docId: string) => {
    if (!window.confirm('Remove this document from the application?')) return
    try {
      await documentsApi.remove(docId)
      flash('Document removed.')
      await load()
    } catch (err: any) {
      flash(getApiError(err, 'Could not remove document'), true)
    }
  }

  const handleRespondEvidence = async (requestId: string) => {
    const notes = evidenceResponse[requestId]
    if (!notes || !notes.trim()) {
      flash('Enter a response before submitting.', true)
      return
    }
    setBusy(requestId)
    try {
      await evidenceApi.respond(requestId, notes.trim())
      flash('Response submitted.')
      await load()
    } catch (err: any) {
      flash(getApiError(err, 'Could not submit response'), true)
    } finally {
      setBusy(null)
    }
  }

  const handleStatusChange = async (status: string) => {
    if (!id) return
    let reason = ''
    if (status === 'approved' || status === 'rejected') {
      reason = window.prompt(`Reason for ${status}:`) || ''
    }
    setBusy(status)
    try {
      await applicationsApi.updateStatus(id, status, reason || undefined)
      flash(`Application moved to ${status.replace(/_/g, ' ')}.`)
      await load()
    } catch (err: any) {
      flash(getApiError(err, 'Could not update status'), true)
    } finally {
      setBusy(null)
    }
  }

  const handleRequestEvidence = async () => {
    if (!id) return
    if (!evidenceMessage.trim()) {
      flash('Describe the evidence required.', true)
      return
    }
    setBusy('evidence-request')
    try {
      await evidenceApi.create({ application_id: id, message: evidenceMessage.trim() })
      setEvidenceMessage('')
      flash('Evidence request sent to the applicant.')
      await load()
    } catch (err: any) {
      flash(getApiError(err, 'Could not raise evidence request'), true)
    } finally {
      setBusy(null)
    }
  }

  if (loading) {
    return <div className="text-center py-16 text-on-surface-variant">Loading application...</div>
  }

  if (error || !app) {
    return (
      <div className="space-y-4">
        <ErrorBanner message={error || 'Application not found'} onRetry={load} />
        <Link to="/applications" className="text-primary text-sm hover:underline">
          ← Back to registry
        </Link>
      </div>
    )
  }

  const canEditDocs = ['draft', 'more_info_required'].includes(app.status)
  const canSubmit = canEditDocs && (app.documents?.length || 0) > 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to="/applications" className="text-xs text-primary hover:underline">
            ← Application Registry
          </Link>
          <h1 className="text-2xl font-headline font-bold text-on-surface mt-1">{app.organization_name}</h1>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-on-surface-variant">
            <span className="font-mono text-primary font-semibold">{app.reference_no}</span>
            <StatusBadge status={app.status} />
            <span>{app.application_category}</span>
            <span>Created {formatDate(app.created_at)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SecondaryButton icon="fact_check" onClick={handleRunCompliance} disabled={busy === 'compliance'}>
            {busy === 'compliance' ? 'Running...' : 'Run Compliance'}
          </SecondaryButton>
          <PrimaryButton icon="send" onClick={handleSubmit} disabled={!canSubmit || busy === 'submit'}>
            {busy === 'submit' ? 'Submitting...' : 'Submit for Review'}
          </PrimaryButton>
        </div>
      </div>

      {actionError && <ErrorBanner message={actionError} />}
      {actionInfo && (
        <div className="rounded-lg border border-secondary/30 bg-secondary-fixed/30 px-4 py-3 text-sm text-on-secondary-fixed-variant">
          {actionInfo}
        </div>
      )}

      {(role === 'admin' || role === 'reviewer') && (
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-on-surface">Reviewer Actions</h2>
              <p className="text-xs text-on-surface-variant">
                Move this application through the regulatory workflow
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SecondaryButton
                onClick={() => handleStatusChange('under_review')}
                disabled={busy === 'under_review'}
              >
                Start Review
              </SecondaryButton>
              <SecondaryButton
                onClick={() => handleStatusChange('more_info_required')}
                disabled={busy === 'more_info_required'}
              >
                Request More Info
              </SecondaryButton>
              <PrimaryButton
                onClick={() => handleStatusChange('approved')}
                disabled={busy === 'approved'}
              >
                Approve
              </PrimaryButton>
              <SecondaryButton
                onClick={() => handleStatusChange('rejected')}
                disabled={busy === 'rejected'}
              >
                Reject
              </SecondaryButton>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <div className="flex-1 min-w-[240px]">
              <label className="block text-xs font-medium text-on-surface mb-1">
                Raise a formal evidence request
              </label>
              <input
                value={evidenceMessage}
                onChange={(e) => setEvidenceMessage(e.target.value)}
                placeholder="e.g. Provide audited financial statements for the last financial year"
                className={inputClass}
              />
            </div>
            <SecondaryButton
              icon="mark_email_unread"
              onClick={handleRequestEvidence}
              disabled={busy === 'evidence-request'}
            >
              {busy === 'evidence-request' ? 'Sending...' : 'Send Request'}
            </SecondaryButton>
          </div>
        </Card>
      )}

      {!canSubmit && canEditDocs && (app.documents?.length || 0) === 0 && (
        <div className="rounded-lg border border-outline-variant/40 bg-surface-container-low px-4 py-3 text-sm text-on-surface-variant">
          Upload at least one supporting document to enable submission.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-headline font-semibold text-on-surface">Supporting Documents</h2>
                <p className="text-sm text-on-surface-variant">
                  Files are fingerprinted with SHA-256 for tamper-evident authentication
                </p>
              </div>
              {canEditDocs && (
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf,image/png,image/jpeg"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) handleUpload(f)
                    }}
                  />
                  <PrimaryButton
                    icon="upload_file"
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? 'Uploading...' : 'Upload'}
                  </PrimaryButton>
                </div>
              )}
            </div>

            {(app.documents?.length || 0) === 0 ? (
              <EmptyState
                icon="description"
                title="No documents uploaded"
                description="Upload PDF, PNG or JPEG evidence to support this application."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-surface-container-low">
                    <tr>
                      {['File', 'Type', 'Size', 'SHA-256', 'Uploaded', ''].map((h) => (
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
                    {app.documents.map((d: any) => (
                      <tr key={d.id}>
                        <td className="px-3 py-3 text-sm text-on-surface max-w-[180px] truncate">{d.original_filename}</td>
                        <td className="px-3 py-3 text-xs text-on-surface-variant">{d.mime_type}</td>
                        <td className="px-3 py-3 text-sm text-on-surface-variant">{formatBytes(d.file_size_bytes)}</td>
                        <td className="px-3 py-3 font-mono text-[11px] text-on-surface-variant">
                          {d.sha256_hash?.slice(0, 16)}...
                        </td>
                        <td className="px-3 py-3 text-xs text-on-surface-variant">{formatDate(d.uploaded_at)}</td>
                        <td className="px-3 py-3 text-right whitespace-nowrap">
                          <Link to="/document-auth" className="text-primary hover:underline text-xs mr-3">
                            Verify
                          </Link>
                          {canEditDocs && (
                            <button
                              onClick={() => handleDeleteDoc(d.id)}
                              className="text-error hover:underline text-xs"
                            >
                              Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Evidence Requests</h2>
            <p className="text-sm text-on-surface-variant mb-4">
              Additional information requested by the reviewing authority
            </p>
            {(app.evidence_requests?.length || 0) === 0 ? (
              <div className="text-sm text-on-surface-variant py-4 text-center">No evidence requests recorded.</div>
            ) : (
              <div className="space-y-3">
                {app.evidence_requests.map((req: any) => (
                  <div key={req.id} className="rounded-lg border border-outline-variant/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-on-surface">{req.message}</p>
                        <p className="text-xs text-on-surface-variant mt-1">
                          Due {formatDate(req.due_at)} · Raised {formatDate(req.created_at)}
                        </p>
                      </div>
                      <StatusBadge status={req.status} />
                    </div>
                    {req.response_notes && (
                      <div className="mt-3 rounded bg-surface-container-low px-3 py-2 text-sm">
                        <span className="text-xs uppercase tracking-wide text-outline">Response</span>
                        <p className="text-on-surface mt-1">{req.response_notes}</p>
                      </div>
                    )}
                    {req.status === 'pending' && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={evidenceResponse[req.id] || ''}
                          onChange={(e) =>
                            setEvidenceResponse({ ...evidenceResponse, [req.id]: e.target.value })
                          }
                          rows={2}
                          placeholder="Describe the evidence you are providing..."
                          className="w-full px-3 py-2 rounded border border-outline-variant bg-surface-container-lowest text-sm text-on-surface focus:outline-none focus:ring-1 focus:ring-primary"
                        />
                        <PrimaryButton
                          onClick={() => handleRespondEvidence(req.id)}
                          disabled={busy === req.id}
                        >
                          {busy === req.id ? 'Submitting...' : 'Submit Response'}
                        </PrimaryButton>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-1">Status History</h2>
            <p className="text-sm text-on-surface-variant mb-4">Immutable audit of workflow transitions</p>
            {(app.history?.length || 0) === 0 ? (
              <div className="text-sm text-on-surface-variant py-4 text-center">No history yet.</div>
            ) : (
              <ol className="relative border-l border-outline-variant/50 ml-2 space-y-4">
                {app.history.map((h: any) => (
                  <li key={h.id} className="ml-4">
                    <span className="absolute -left-[5px] w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <div className="text-sm text-on-surface">
                      {h.from_status ? (
                        <>
                          <span className="capitalize">{h.from_status.replace(/_/g, ' ')}</span>
                          <span className="text-on-surface-variant"> → </span>
                        </>
                      ) : null}
                      <span className="font-medium capitalize">{h.to_status.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5">
                      {h.reason} · {formatDate(h.created_at)}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-4">Applicant Details</h2>
            <dl className="space-y-3 text-sm">
              {Object.keys(app.applicant_details || {}).length === 0 ? (
                <p className="text-on-surface-variant">No additional institutional details recorded.</p>
              ) : (
                Object.entries(app.applicant_details).map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-xs uppercase tracking-wide text-outline">
                      {k.replace(/_/g, ' ')}
                    </dt>
                    <dd className="text-on-surface break-words">{String(v)}</dd>
                  </div>
                ))
              )}
              <div>
                <dt className="text-xs uppercase tracking-wide text-outline">Submitted</dt>
                <dd className="text-on-surface">{formatDate(app.submitted_at)}</dd>
              </div>
              {app.decision_at && (
                <div>
                  <dt className="text-xs uppercase tracking-wide text-outline">Decision</dt>
                  <dd className="text-on-surface">
                    {formatDate(app.decision_at)}
                    {app.decision_reason ? ` — ${app.decision_reason}` : ''}
                  </dd>
                </div>
              )}
            </dl>
          </Card>

          <Card>
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-4">Compliance Runs</h2>
            {(app.compliance_runs?.length || 0) === 0 ? (
              <p className="text-sm text-on-surface-variant">
                No compliance evaluation has been executed yet.
              </p>
            ) : (
              <ul className="space-y-2">
                {app.compliance_runs.map((run: any) => (
                  <li key={run.id} className="rounded border border-outline-variant/30 px-3 py-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="capitalize text-on-surface">{run.status}</span>
                      <span className="text-on-surface-variant">{run.findings} finding(s)</span>
                    </div>
                    <div className="text-xs text-on-surface-variant mt-0.5">{formatDate(run.executed_at)}</div>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-4">
              <Link to="/compliance" className="text-primary text-sm hover:underline">
                View all compliance findings →
              </Link>
            </div>
          </Card>

          <Card>
            <h2 className="text-lg font-headline font-semibold text-on-surface mb-4">Audit Trail</h2>
            {auditEvents.length === 0 ? (
              <p className="text-sm text-on-surface-variant">No audit events recorded for this application.</p>
            ) : (
              <ul className="space-y-2">
                {auditEvents.map((e) => (
                  <li key={e.id} className="text-sm">
                    <div className="text-on-surface">{e.action.replace(/\./g, ' ').replace(/_/g, ' ')}</div>
                    <div className="text-xs text-on-surface-variant">{formatDate(e.created_at)}</div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-headline font-semibold text-on-surface">Reference</h2>
            <p className="text-sm text-on-surface-variant">
              Application ID <span className="font-mono">{app.id}</span>
            </p>
          </div>
          <div className="text-right text-xs text-on-surface-variant">
            <div>Last updated</div>
            <div>{formatDate(app.updated_at)}</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
