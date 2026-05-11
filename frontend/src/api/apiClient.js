import { API_BASE } from './config'

const DEFAULT_ERROR_MESSAGE = '요청을 처리하는 중 오류가 발생했습니다.'

function parseJson(text) {
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(DEFAULT_ERROR_MESSAGE)
  }
}

function getAuthHeader() {
  const token = localStorage.getItem('tripHelperToken')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export async function apiRequest(path, options = {}) {
  const {
    body,
    headers,
    errorMessage = DEFAULT_ERROR_MESSAGE,
    ...fetchOptions
  } = options

  const requestOptions = {
    ...fetchOptions,
    headers: {
      ...(body != null ? { 'Content-Type': 'application/json' } : {}),
      ...getAuthHeader(),
      ...headers,
    },
  }

  if (body != null) {
    requestOptions.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE}${path}`, requestOptions)
  const text = await response.text()
  const data = parseJson(text)

  if (!response.ok || data?.error) {
    throw new Error(data?.error || errorMessage)
  }

  return data
}

export function apiGet(path, options) {
  return apiRequest(path, { ...options, method: 'GET' })
}

export function apiPost(path, body, options) {
  return apiRequest(path, { ...options, method: 'POST', body })
}

export function apiDelete(path, options) {
  return apiRequest(path, { ...options, method: 'DELETE' })
}
