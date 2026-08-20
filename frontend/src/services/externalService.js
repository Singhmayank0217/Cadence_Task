import { api } from './apiClient'

/** Partner directory pulled through our own backend, never called from the browser. */
export const externalService = {
  users: (refresh = false) => api.get('/external/users', { refresh }, { timeout: 25000 }),
  status: () => api.get('/external/status'),
  importUser: (externalId) => api.post('/external/users/import', { external_id: externalId }),
}
