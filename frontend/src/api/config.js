// VITE_API_BASE: backend origin, for example https://your-backend.onrender.com
// Leave it empty in local development so Vite proxies /api to the backend.
const API_ORIGIN = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '')

export const API_BASE = `${API_ORIGIN}/api`
