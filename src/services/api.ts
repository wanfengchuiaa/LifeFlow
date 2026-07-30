const base = String(import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message) }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  const response = await fetch(`${base}${path}`, { ...options, credentials: 'include', headers })
  if (!response.ok) {
    let message = '请求失败'
    try { const body = await response.json(); message = body.message || body.error || message } catch { /* ignore non-json errors */ }
    throw new ApiError(response.status, message)
  }
  if (response.status === 204) return undefined as T
  return await response.json() as T
}

export const api = {
  request,
  login: (username: string, password: string) => request<{ id: string; username: string; role: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  logout: () => request<{ ok: boolean }>('/auth/logout', { method: 'POST' }),
  me: () => request<{ id: string; username: string; role: string }>('/auth/me'),
  data: () => request<Record<string, unknown[]>>('/data'),
  list: <T>(resource: string) => request<T[]>(`/${resource}`),
  create: <T>(resource: string, value: unknown) => request<T>(`/${resource}`, { method: 'POST', body: JSON.stringify(value) }),
  update: <T>(resource: string, id: string, value: unknown) => request<T>(`/${resource}/${id}`, { method: 'PUT', body: JSON.stringify(value) }),
  updateSettings: (value: unknown) => request<Record<string, unknown>>('/settings', { method: 'PUT', body: JSON.stringify(value) }),
  restore: (value: unknown) => request<{ ok: boolean }>('/data/restore', { method: 'POST', body: JSON.stringify(value) }),
  remove: (resource: string, id: string) => request<{ ok: boolean }>(`/${resource}/${id}`, { method: 'DELETE' }),
  reset: (sample = false) => request<{ ok: boolean }>('/data/reset', { method: 'POST', body: JSON.stringify({ sample }) }),
  members: () => request<Array<{ id: string; username: string; role: string; active?: boolean }>>('/members'),
  createMember: (username: string, password: string) => request<{ id: string; username: string; role: string }>('/members', { method: 'POST', body: JSON.stringify({ username, password }) }),
  updateMember: (id: string, active: boolean) => request<unknown>(`/members/${id}`, { method: 'PATCH', body: JSON.stringify({ active }) })
}
