import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applicationsApi } from '../lib/api'

export default function Applications() {
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ organization_name: '', application_category: '' })
  const [creating, setCreating] = useState(false)

  const fetchApps = async () => {
    try {
      const res = await applicationsApi.list()
      setApplications(res.data.applications || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchApps()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      await applicationsApi.create(form)
      setShowCreate(false)
      setForm({ organization_name: '', application_category: '' })
      fetchApps()
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to create application')
    } finally {
      setCreating(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: any = {
      draft: 'bg-surface-container text-on-surface-variant',
      submitted: 'bg-primary-fixed text-on-primary-fixed-variant',
      processing: 'bg-surface-container-high text-on-surface',
      under_review: 'bg-secondary-container/30 text-on-secondary-container',
      more_info_required: 'bg-error-container/30 text-on-error-container',
      approved: 'bg-secondary-fixed/40 text-on-secondary-fixed-variant',
      rejected: 'bg-error-container text-on-error-container',
      archived: 'bg-surface-container text-outline',
    }
    return styles[status] || styles.draft
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-headline font-bold text-on-surface">Institutional Applications Registry</h1>
          <p className="text-sm text-on-surface-variant mt-1">Search, triage, and audit all submitted applications</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-4 py-2 rounded bg-primary-container text-on-primary hover:bg-primary text-sm shadow-sm">
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Institutional Application</span>
        </button>
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-inverse-surface/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-headline font-semibold text-on-surface">Create Application</h2>
              <button onClick={() => setShowCreate(false)} className="text-outline-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Organization/Institution Name</label>
                <input type="text" value={form.organization_name} onChange={(e) => setForm({...form, organization_name: e.target.value})} required className="w-full h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium text-on-surface mb-1">Application Category</label>
                <select value={form.application_category} onChange={(e) => setForm({...form, application_category: e.target.value})} required className="w-full h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="">Select category</option>
                  <option value="New Establishment">New Establishment</option>
                  <option value="Extension of Approval">Extension of Approval</option>
                  <option value="Renewal">Renewal</option>
                  <option value="Faculty Expansion">Faculty Expansion</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setShowCreate(false)} className="flex-1 h-9 rounded bg-surface-container text-on-surface hover:bg-surface-container-high text-sm">Cancel</button>
                <button type="submit" disabled={creating} className="flex-1 h-9 rounded bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 text-sm">{creating ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-on-surface-variant">Loading...</div>
        ) : applications.length === 0 ? (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl mb-2 block">folder_open</span>
            <p>No applications found. Create your first application.</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-surface-container-low">
              <tr>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Reference No</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Organization</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Category</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Created</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-surface-container-low/40">
                  <td className="px-4 py-3 font-mono text-sm text-primary font-semibold">{app.reference_no}</td>
                  <td className="px-4 py-3 text-sm text-on-surface">{app.organization_name}</td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{app.application_category}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${getStatusBadge(app.status)}`}>
                      {app.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-on-surface-variant">{new Date(app.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/applications/${app.id}`} className="text-primary hover:underline text-sm">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
