import { api } from './apiClient'

export const dashboardService = {
  load: () => api.get('/dashboard'),
}
