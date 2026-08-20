/**
 * One HTTP client for the whole app.
 *
 * Responsibilities kept in this file (and nowhere else):
 *  - base URL + query-string building
 *  - attaching the bearer token
 *  - unwrapping the API's `{error: {code, message}}` envelope into a real Error
 *  - turning a 401 into a single "session expired" event the app can react to
 *  - request timeouts via AbortController
 */

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api').replace(/\/$/, '')
const TOKEN_KEY = 'cadence.token'
const DEFAULT_TIMEOUT = 15000

export const SESSION_EXPIRED_EVENT = 'cadence:session-expired'

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

function buildUrl(path, params) {
  const url = new URL(`${BASE_URL}${path}`, window.location.origin)
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      if (value.length) url.searchParams.set(key, value.join(','))
    } else {
      url.searchParams.set(key, value)
    }
  })
  return url.toString()
}

async function request(path, { method = 'GET', body, params, timeout = DEFAULT_TIMEOUT, signal } = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeout)
  if (signal) signal.addEventListener('abort', () => controller.abort())

  const token = tokenStore.get()
  let response
  try {
    response = await fetch(buildUrl(path, params), {
      method,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch (error) {
    clearTimeout(timer)
    if (error.name === 'AbortError') {
      throw new ApiError('The request took too long. Check your connection and try again.', {
        code: 'timeout',
      })
    }
    throw new ApiError(
      "Can't reach the API. Make sure the backend is running on " + BASE_URL.replace('/api', '') + '.',
      { code: 'network_error' },
    )
  }
  clearTimeout(timer)

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    const envelope = payload?.error ?? {}
    if (response.status === 401) {
      tokenStore.clear()
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT))
    }
    throw new ApiError(envelope.message ?? `Request failed (${response.status}).`, {
      status: response.status,
      code: envelope.code,
      details: envelope.details,
    })
  }

  return payload
}

export const api = {
  get: (path, params, options) => request(path, { ...options, params }),
  post: (path, body, options) => request(path, { ...options, method: 'POST', body }),
  put: (path, body, options) => request(path, { ...options, method: 'PUT', body }),
  patch: (path, body, options) => request(path, { ...options, method: 'PATCH', body }),
  delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
}

/**
 * Downloads a file from an authenticated endpoint.
 *
 * A plain <a href> cannot carry the bearer token, so the response is fetched,
 * turned into a blob and handed to a throwaway link. The object URL is revoked
 * afterwards so the blob is not held in memory.
 */
export async function buildExportUrl(path, params) {
  const token = tokenStore.get()
  const response = await fetch(buildUrl(path, params), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok) {
    throw new ApiError('The export could not be generated. Try again in a moment.', {
      status: response.status,
    })
  }

  const blob = await response.blob()
  const filename =
    response.headers.get('Content-Disposition')?.match(/filename="?([^"]+)"?/)?.[1] ??
    'cadence-tasks.csv'

  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = objectUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
  return filename
}

export { BASE_URL }
