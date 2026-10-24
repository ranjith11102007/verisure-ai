import { useState, useEffect } from 'react'
import { applicationsApi, documentsApi } from '../lib/api'

export default function Upload() {
  const [applications, setApplications] = useState<any[]>([])
  const [selectedApp, setSelectedApp] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    applicationsApi.list().then(res => setApplications(res.data.applications || [])).catch(console.error)
  }, [])

  useEffect(() => {
    if (selectedApp) {
      documentsApi.list(selectedApp).then(res => setDocuments(res.data.documents || [])).catch(console.error)
    }
  }, [selectedApp])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !selectedApp) {
      setMessage({ type: 'error', text: 'Please select an application and file' })
      return
    }
    setUploading(true)
    setMessage({ type: '', text: '' })
    const formData = new FormData()
    formData.append('file', file)
    formData.append('application_id', selectedApp)
    try {
      const res = await documentsApi.upload(formData)
      setMessage({ type: 'success', text: `Uploaded ${res.data.original_filename} successfully (SHA-256: ${res.data.sha256_hash.substring(0, 16)}...)` })
      setFile(null)
      documentsApi.list(selectedApp).then(res => setDocuments(res.data.documents || []))
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.detail || 'Upload failed' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-headline font-bold text-on-surface">Document Upload Center</h1>
        <p className="text-sm text-on-surface-variant mt-1">Secure upload with validation, hashing, and processing</p>
      </div>

      <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 p-6">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Select Application</label>
            <select value={selectedApp} onChange={(e) => setSelectedApp(e.target.value)} required className="w-full max-w-md h-9 px-3 rounded border border-outline-variant bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-1 focus:ring-primary">
              <option value="">Choose an application</option>
              {applications.map(app => (
                <option key={app.id} value={app.id}>{app.reference_no} - {app.organization_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-on-surface mb-1">Document File (PDF, PNG, JPEG)</label>
            <input type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={(e) => setFile(e.target.files?.[0] || null)} required className="block w-full text-sm text-on-surface file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-surface-container file:text-on-surface hover:file:bg-surface-container-high" />
            <p className="text-xs text-on-surface-variant mt-1">Max size: 50MB. Files are hashed with SHA-256.</p>
          </div>
          {message.text && (
            <div className={`text-sm p-3 rounded ${message.type === 'success' ? 'bg-secondary-container/30 text-on-secondary-container' : 'bg-error-container/30 text-on-error-container'}`}>
              {message.text}
            </div>
          )}
          <button type="submit" disabled={uploading} className="px-4 py-2 rounded bg-primary text-on-primary hover:bg-primary-container disabled:opacity-50 text-sm">
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </form>
      </div>

      {selectedApp && (
        <div className="bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/20 overflow-hidden">
          <div className="p-4 border-b border-outline-variant/20">
            <h2 className="font-headline font-semibold text-on-surface">Uploaded Documents</h2>
          </div>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant">No documents uploaded yet</div>
          ) : (
            <table className="w-full">
              <thead className="bg-surface-container-low">
                <tr>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase">Filename</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase">Type</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase">Size</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase">SHA-256</th>
                  <th className="text-left px-4 py-2 text-xs font-semibold text-on-surface-variant uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {documents.map(doc => (
                  <tr key={doc.id}>
                    <td className="px-4 py-2 text-sm text-on-surface">{doc.original_filename}</td>
                    <td className="px-4 py-2 text-sm text-on-surface-variant">{doc.mime_type}</td>
                    <td className="px-4 py-2 text-sm text-on-surface-variant">{(doc.file_size_bytes / 1024).toFixed(1)} KB</td>
                    <td className="px-4 py-2 text-xs font-mono text-on-surface-variant">{doc.sha256_hash.substring(0, 16)}...</td>
                    <td className="px-4 py-2 text-sm text-on-surface-variant capitalize">{doc.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
