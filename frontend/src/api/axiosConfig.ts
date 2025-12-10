import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Queue for failed requests during token refresh
let isRefreshing = false
let failedQueue: Array<{
  resolve: (token: string) => void
  reject: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error)
    } else {
      promise.resolve(token!)
    }
  })

  failedQueue = []
}

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // REQUIRED for refresh token cookie
  headers: {
    'Content-Type': 'application/json',
  },
})

// ---- REQUEST INTERCEPTOR ----
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get access token from localStorage or memory
    const token = localStorage.getItem('accessToken')
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// ---- RESPONSE INTERCEPTOR ----
api.interceptors.response.use(
  (response) => {
    // Return the data directly for successful responses
    return response.data
  },
  async (error: AxiosError<any>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean }

    // If access token expired (401) and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      
      // If already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`
            }
            return api(originalRequest)
          })
          .catch((err) => {
            return Promise.reject(err)
          })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Call refresh endpoint (refresh token sent via cookie automatically)
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        )

        // Extract new access token
        const newAccessToken = response.data.data.accessToken
        
        // Store new access token
        localStorage.setItem('accessToken', newAccessToken)

        // Process queued requests with new token
        processQueue(null, newAccessToken)

        // Retry original request with new token
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        }
        
        return api(originalRequest)
      } catch (refreshError) {
        // Refresh token also expired - logout user
        processQueue(refreshError, null)
        
        // Clear stored data
        localStorage.removeItem('accessToken')
        localStorage.removeItem('user')
        
        // Redirect to login
        window.location.href = '/login'
        
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // For other errors, reject with error
    return Promise.reject(error)
  }
)

export default api
