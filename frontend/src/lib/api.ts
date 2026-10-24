import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000/api/v1',
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
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
export const authApi = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (email: string, password: string, full_name: string) => api.post('/auth/register', { email, password, full_name }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
}
export const applicationsApi = {
  list: (params?: any) => api.get('/applications/', { params }),
  create: (data: any) => api.post('/applications/', data),
  get: (id: string) => api.get(`/applications/${id}`),
  update: (id: string, data: any) => api.put(`/applications/${id}`, data),
}
export const documentsApi = {
  upload: (formData: FormData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  list: (applicationId?: string) => api.get('/documents/', { params: { application_id: applicationId } }),
}
