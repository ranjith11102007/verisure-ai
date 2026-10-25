import axios from 'axios'

// Use a same-origin relative path by default. The Vercel deployment proxies
// /api/* to the backend (see frontend/vercel.json), so no build-time env var
// is required. VITE_API_BASE_URL can still override it for other hosts.
const RAW_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '')

const api = axios.create({
  baseURL: `${RAW_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url: string = error.config?.url || ''
    const isAuthCall = url.includes('/auth/login') || url.includes('/auth/register')
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export function getApiError(err: any, fallback = 'Something went wrong'): string {
  const detail = err?.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length > 0) {
    return detail.map((d: any) => d?.msg || String(d)).join(', ')
  }
  if (err?.message) return err.message
  return fallback
}

export function formatBytes(bytes: number): string {
  if (!bytes && bytes !== 0) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

export function formatDate(value?: string | null): string {
  if (!value) return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatStatus(status?: string): string {
  if (!status) return '-'
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (email: string, password: string, full_name: string) =>
    api.post('/auth/register', { email, password, full_name }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}

export const usersApi = {
  me: () => api.get('/users/me'),
  update: (full_name: string) => api.patch('/users/me', { full_name }),
}

export const applicationsApi = {
  list: (params?: any) => api.get('/applications/', { params }),
  stats: () => api.get('/applications/stats'),
  create: (data: any) => api.post('/applications/', data),
  get: (id: string) => api.get(`/applications/${id}`),
  submit: (id: string) => api.post(`/applications/${id}/submit`),
  updateStatus: (id: string, status: string, reason?: string) =>
    api.patch(`/applications/${id}/status`, { status, reason }),
  history: (id: string) => api.get(`/applications/${id}/history`),
}

export const documentsApi = {
  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list: (applicationId?: string) =>
    api.get('/documents/', { params: applicationId ? { application_id: applicationId } : {} }),
  get: (id: string) => api.get(`/documents/${id}`),
  verify: (id: string) => api.post(`/documents/${id}/verify`),
  remove: (id: string) => api.delete(`/documents/${id}`),
}

export const complianceApi = {
  rules: () => api.get('/compliance/rules'),
  createRule: (data: any) => api.post('/compliance/rules', data),
  run: (applicationId: string) => api.post(`/compliance/run/${applicationId}`),
  findings: (applicationId?: string) =>
    api.get('/compliance/findings', {
      params: applicationId ? { application_id: applicationId } : {},
    }),
  updateFinding: (id: string, disposition: string, review_notes?: string) =>
    api.patch(`/compliance/findings/${id}`, { disposition, review_notes }),
}

export const evidenceApi = {
  list: (applicationId?: string) =>
    api.get('/evidence/', {
      params: applicationId ? { application_id: applicationId } : {},
    }),
  create: (data: any) => api.post('/evidence/', data),
  respond: (id: string, response_notes: string) =>
    api.post(`/evidence/${id}/respond`, { response_notes }),
}

export const auditApi = {
  list: (params?: any) => api.get('/audit/', { params }),
}

export const reportsApi = {
  summary: () => api.get('/reports/summary'),
}

// /api/health/db lives outside /api/v1, so it needs its own request.
export const systemApi = {
  database: () => axios.get(`${RAW_BASE_URL}/api/health/db`),
}

export default api
