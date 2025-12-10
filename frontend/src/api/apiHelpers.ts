/**
 * API Helper Utilities
 * 
 * This file provides helper functions to make HTTP requests using the
 * authenticated axios instance with automatic token refresh.
 * 
 * All functions automatically:
 * - Add authentication headers
 * - Handle token refresh on 401 errors
 * - Queue requests during token refresh
 * - Auto-logout on refresh token expiry
 */

import api from '../api/axiosConfig'

/**
 * Helper to build full API URL
 */
const buildUrl = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * GET request with authentication
 */
export const apiGet = async <T = any>(url: string): Promise<T> => {
  const response = await api.get(buildUrl(url))
  return response.data || response
}

/**
 * POST request with authentication
 */
export const apiPost = async <T = any>(url: string, data?: any): Promise<T> => {
  const response = await api.post(buildUrl(url), data)
  return response.data || response
}

/**
 * PUT request with authentication
 */
export const apiPut = async <T = any>(url: string, data?: any): Promise<T> => {
  const response = await api.put(buildUrl(url), data)
  return response.data || response
}

/**
 * PATCH request with authentication
 */
export const apiPatch = async <T = any>(url: string, data?: any): Promise<T> => {
  const response = await api.patch(buildUrl(url), data)
  return response.data || response
}

/**
 * DELETE request with authentication
 */
export const apiDelete = async <T = any>(url: string): Promise<T> => {
  const response = await api.delete(buildUrl(url))
  return response.data || response
}

/**
 * Legacy fetch() replacement
 * Use this to replace existing fetch() calls in the codebase
 * 
 * Example:
 * Before: const response = await fetch('/api/products')
 * After:  const response = await apiFetch('/api/products')
 */
export const apiFetch = async (url: string, options?: RequestInit): Promise<Response> => {
  const method = options?.method?.toUpperCase() || 'GET'
  const body = options?.body ? JSON.parse(options.body as string) : undefined

  let axiosResponse

  switch (method) {
    case 'POST':
      axiosResponse = await api.post(buildUrl(url), body)
      break
    case 'PUT':
      axiosResponse = await api.put(buildUrl(url), body)
      break
    case 'PATCH':
      axiosResponse = await api.patch(buildUrl(url), body)
      break
    case 'DELETE':
      axiosResponse = await api.delete(buildUrl(url))
      break
    default:
      axiosResponse = await api.get(buildUrl(url))
  }

  // Convert axios response to fetch-like Response
  return {
    ok: axiosResponse.status >= 200 && axiosResponse.status < 300,
    status: axiosResponse.status,
    statusText: axiosResponse.statusText,
    json: async () => axiosResponse.data,
    text: async () => JSON.stringify(axiosResponse.data),
  } as Response
}

export default api
