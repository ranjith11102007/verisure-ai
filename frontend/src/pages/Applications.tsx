import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi, getApiError, formatDate } from '../lib/api'
import {
  Card,
  EmptyState,
  ErrorBanner,
  Field,
  PageHeader,
  PrimaryButton,
  SecondaryButton,
  StatusBadge,
  inputClass,
} from '../components/ui'

const CATEGORIES = [
  'New Establishment',
  'Extension of Approval',
  'Renewal',
  'Faculty Expansion',
  'Programme Accreditation',
]

const STATUSES = [
  'draft',
  'submitted',
  'processing',
  'under_review',
  'more_info_required',
  'approved',
  'rejected',
  'archived',
]

export default function Applications() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')
  const [form, setForm] = useState({
    organization_name: '',
    application_category: '',
    contact_email: '',
    registration_number: '',
  })

  const fetchApps = async () => {
    setLoading(true)
    setError('')
    try {
      const params: any = {}
      if (statusFilter) params.status = statusFilter
      if (search.trim()) params.search = search.trim()
      const res = await applicationsApi.list(params)
      setApplications(res.data.applications || [])
    } catch (err: any) {
      setError(getApiError(err, 'Failed to load applications'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')
    setCreating(true)
    try {
      await applicationsApi.create({
        organization_name: form.organization_name,
        application_category: form.application_category,
        applicant_details: {
          contact_email: form.contact_email || undefined,
          registration_number: form.registration_number || undefined,
        },
      })
      setShowCreate(false)
      setForm({ organization_name: '', application_category: '', contact_email: '', registration_number: '' })
      await fetchApps()
    } catch (err: any) {
      setCreateError(getApiError(err, 'Failed to create application'))
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Institutional Applications Registry"
        subtitle="Search, triage, and audit all submitted applications"
        actions={<PrimaryButton icon="add" onClick={() => setShowCreate(true)}>New Institutional Application</PrimaryButton>}
      />

      {error && <ErrorBanner message={error} onRetry={fetchApps} />}

      <Card padded={false}>
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-outline-variant/20">
          <div className="relative flex-1 min-w-[220px]">
            <span className="material-symbols-outlined absolute left-2 top-1/2 -translate-y-1/2 text-[18px] text-outline">
              search
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchApps()}
              placeholder="Search by organization or reference number"
              className={`${inputClass} pl-8`}
            />
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className={`${inputClass} w-48`}>
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          <SecondaryButton icon="search" onClick={fetchApps}>
            Search
          </SecondaryButton>
        </div>

        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">Loading...</div>
        ) : applications.length === 0 ? (
          <EmptyState
            icon="folder_open"
            title="No applications found"
            description="Create your first application or adjust the filters above."
            action={<PrimaryButton icon="add" onClick={() => setShowCreate(true)}>Create Application</PrimaryButton>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  {['Reference No', 'Organization', 'Category', 'Status', 'Created', 'Actions'].map((h) => (
                    <th
                      key={h}
                      className={`px-4 py-2.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider ${
                        h === 'Actions' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {applications.map((app) => (
                  <tr key={app.id} className="hover:bg-surface-container-low/40">
                    <td className="px-4 py-3 font-mono text-sm text-primary font-semibold">{app.reference_no}</td>
                    <td className="px-4 py-3 text-sm text-on-surface">{app.organization_name}</td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">{app.application_category}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={app.status} />
                    </td>
                    <td className="px-4 py-3 text-sm text-on-surface-variant">{formatDate(app.created_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/applications/${app.id}`} className="text-primary hover:underline text-sm">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {showCreate && (
        <div className="fixed inset-0 bg-inverse-surface/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-headline font-semibold text-on-surface">Create Application</h2>
              <button onClick={() => setShowCreate(false)} className="text-outline-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {createError && (
              <div className="mb-4 rounded bg-error-container/40 px-3 py-2 text-sm text-on-error-container">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <Field label="Organization / Institution Name">
                <input
                  type="text"
                  value={form.organization_name}
                  onChange={(e) => setForm({ ...form, organization_name: e.target.value })}
                  required
                  className={inputClass}
                  placeholder="e.g. National Institute of Technology"
                />
              </Field>
              <Field label="Application Category">
                <select
                  value={form.application_category}
                  onChange={(e) => setForm({ ...form, application_category: e.target.value })}
                  required
                  className={inputClass}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Registration Number" hint="Used by compliance checks">
                  <input
                    type="text"
                    value={form.registration_number}
                    onChange={(e) => setForm({ ...form, registration_number: e.target.value })}
                    className={inputClass}
                    placeholder="REG-2026-001"
                  />
                </Field>
                <Field label="Institutional Contact Email">
                  <input
                    type="email"
                    value={form.contact_email}
                    onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                    className={inputClass}
                    placeholder="registrar@institute.edu"
                  />
                </Field>
              </div>
              <div className="flex gap-2 pt-2">
                <SecondaryButton onClick={() => setShowCreate(false)}>Cancel</SecondaryButton>
                <PrimaryButton type="submit" disabled={creating} icon="save">
                  {creating ? 'Creating...' : 'Create Application'}
                </PrimaryButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
