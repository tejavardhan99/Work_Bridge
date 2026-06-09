import { apiClient } from './api'

export const recommendationAPI = {
  getRecommendedJobs: () => apiClient.get('/jobs/recommended/'),
}

export default recommendationAPI
