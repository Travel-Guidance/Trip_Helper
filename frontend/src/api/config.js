// VITE_API_BASE is optional in local dev. When empty, Vite proxies /api to the backend.
const API_ORIGIN = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export const API_BASE = `${API_ORIGIN}/api`
