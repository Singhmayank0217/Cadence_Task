import { api, tokenStore } from './apiClient'

export const authService = {
  async login({ email, password }) {
    const data = await api.post('/auth/login', { email, password })
    tokenStore.set(data.access_token)
    return data.user
  },
  me: () => api.get('/auth/me'),
  logout: () => tokenStore.clear(),
  hasToken: () => Boolean(tokenStore.get()),
}
