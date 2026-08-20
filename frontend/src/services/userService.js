import { api } from './apiClient'

export const userService = {
  list: (params) => api.get('/users', { limit: 100, ...params }),
  get: (id) => api.get(`/users/${id}`),
  create: (payload) => api.post('/users', payload),
  update: (id, payload) => api.put(`/users/${id}`, payload),
  remove: (id) => api.delete(`/users/${id}`),
}
