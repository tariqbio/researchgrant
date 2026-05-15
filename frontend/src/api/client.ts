import axios from 'axios'

// In development: Vite proxies /api → http://localhost:8000
// In production:  FastAPI serves both /api/* and the React SPA from the same origin
// So we always use a relative base URL — no hardcoded host needed.
export const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// Attach JWT token from localStorage to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401: clear token and redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
