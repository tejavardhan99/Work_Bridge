import axios from 'axios'
import { useAuthStore } from '../context/store'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add JWT token (supports localStorage and zustand store)
apiClient.interceptors.request.use(
  (config) => {
    // prefer explicit localStorage key
    let token = localStorage.getItem('access_token')
    // fallback to zustand persisted store if available
    try {
      const storeState = useAuthStore.getState()
      if (!token && storeState && storeState.accessToken) token = storeState.accessToken
    } catch (e) {
      // ignore
    }

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `Bearer ${token}`
      // debug log
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('API: Sending token in header, first 8 chars:', token.slice(0, 8))
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle token refresh and unwrap backend response wrapper
apiClient.interceptors.response.use(
  (response) => {
    if (response.config && response.config.returnRawResponse) {
      return response
    }
    return response.data && response.data.data !== undefined ? response.data.data : response.data
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refresh_token')
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          })

          const { access } = response.data.data.tokens
          localStorage.setItem('access_token', access)
          // update zustand store if available
          try {
            useAuthStore.getState().updateAccessToken?.(access)
          } catch (e) {}

          originalRequest.headers.Authorization = `Bearer ${access}`
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth API calls
export const authAPI = {
  workerRegister: (data) => apiClient.post('/auth/worker-register/', data),
  employerRegister: (data) => apiClient.post('/auth/employer-register/', data),
  adminLogin: (data) => apiClient.post('/auth/admin-login/', data),
  workerLogin: (data) => apiClient.post('/auth/worker-login/', data),
  employerLogin: (data) => apiClient.post('/auth/employer-login/', data),
  refreshToken: (refreshToken) =>
    apiClient.post('/auth/refresh/', { refresh: refreshToken }),
}

// Worker API calls
export const workerAPI = {
  getProfile: () => apiClient.get('/workers/profile/'),
  updateProfile: (data) => apiClient.put('/workers/profile/', data),
  getJobs: (params) => apiClient.get('/jobs/', { params }),
  getRecommendedJobs: () => apiClient.get('/recommendations/jobs/'),
  applyJob: (jobId) => apiClient.post('/applications/apply/', { job_id: jobId }),
  getApplications: (params) => apiClient.get('/workers/applications/', { params }),
  getNearbyJobs: (params) => apiClient.get('/jobs/nearby/', { params }),
  getNotifications: () => apiClient.get('/notifications/'),
  getReviews: () => apiClient.get('/workers/reviews/'),
}

// Employer API calls
export const employerAPI = {
  getProfile: () => apiClient.get('/employers/profile/'),
  updateProfile: (data) => apiClient.put('/employers/profile/', data),
  postJob: (data) => apiClient.post('/employers/jobs/', data),
  getJobs: (params) => apiClient.get('/employers/jobs/', { params }),
  updateJob: (jobId, data) => apiClient.patch(`/employers/jobs/${jobId}/`, data),
  deleteJob: (jobId) => apiClient.delete(`/employers/jobs/${jobId}/`),
  getApplications: (jobId) => apiClient.get(`/employers/jobs/${jobId}/applications/`),
  getAllApplications: (params) => apiClient.get('/employers/applications/', { params }),
  acceptApplication: (applicationId) =>
    apiClient.post(`/employers/applications/${applicationId}/decision/`, { status: 'accepted' }),
  rejectApplication: (applicationId) =>
    apiClient.post(`/employers/applications/${applicationId}/decision/`, { status: 'rejected' }),
  startWork: (applicationId) =>
    apiClient.post(`/employers/applications/${applicationId}/start/`, {}),
  completeWork: (applicationId) =>
    apiClient.post(`/employers/applications/${applicationId}/complete/`, {}),
  giveReview: (applicationId, data) =>
    apiClient.post(`/employers/applications/${applicationId}/review/`, data),
  getNearbyWorkers: (params) => apiClient.get('/employers/nearby-workers/', { params }),
}

export const jobsAPI = {
  getJobs: (params) => apiClient.get('/jobs/', { params }),
  getMyJobs: (params) => apiClient.get('/jobs/my-jobs/', { params }),
  getNearbyJobs: (params) => apiClient.get('/jobs/nearby/', { params }),
  getJobDetails: (jobId) => apiClient.get(`/jobs/${jobId}/`),
}

export const normalizeResponseList = (data) => {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') {
    return Object.entries(data).map(([id, item]) => ({ id, ...item }))
  }
  return []
}

// Admin API calls
export const adminAPI = {
  getStats: () => apiClient.get('/admin/stats/'),
  getDashboardAnalytics: () => apiClient.get('/admin/dashboard/'),
  getDashboardAnalyticsRaw: () => apiClient.get('/admin/dashboard/', { returnRawResponse: true }),
  getUsers: (params) => apiClient.get('/admin/users/', { params }),
  getJobs: (params) => apiClient.get('/admin/jobs/', { params }),
  blockUser: (userId) => apiClient.post(`/admin/users/${userId}/block/`, {}),
  unblockUser: (userId) => apiClient.post(`/admin/users/${userId}/unblock/`, {}),
  getComplaints: (params) => apiClient.get('/admin/complaints/', { params }),
  updateComplaint: (complaintId, data) =>
    apiClient.patch(`/admin/complaints/${complaintId}/`, data),
}

export { apiClient }
export default apiClient
