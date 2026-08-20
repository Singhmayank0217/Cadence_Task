import { api, buildExportUrl } from './apiClient'

/**
 * Every list parameter is passed straight through to the API - filtering,
 * searching, sorting and pagination all happen in the database.
 */
export const taskService = {
  list: (params, options) => api.get('/tasks', params, options),
  get: (id) => api.get(`/tasks/${id}`),
  create: (payload) => api.post('/tasks', payload),
  update: (id, payload) => api.put(`/tasks/${id}`, payload),
  changeStatus: (id, status) => api.patch(`/tasks/${id}/status`, { status }),
  remove: (id) => api.delete(`/tasks/${id}`),
  comments: (id) => api.get(`/tasks/${id}/comments`),
  addComment: (id, comment) => api.post(`/tasks/${id}/comments`, { comment }),
  deleteComment: (taskId, commentId) => api.delete(`/tasks/${taskId}/comments/${commentId}`),

  /**
   * The export is a real file download, so it goes through fetch and a blob
   * rather than a plain link - a link cannot carry the bearer token.
   */
  exportCsv: (params) => buildExportUrl('/tasks/export.csv', params),
}
