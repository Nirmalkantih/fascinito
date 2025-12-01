import api from './api'

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  userId: number
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

export const authService = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<any, any>('/auth/login', data)
    return response.data
  },

  signup: async (data: SignupRequest): Promise<AuthResponse> => {
    const response = await api.post<any, any>('/auth/signup', data)
    return response.data
  },

  sendOtp: async (phone: string): Promise<void> => {
    await api.post('/auth/send-otp', { phone })
  },

  verifyOtp: async (phone: string, otp: string): Promise<void> => {
    await api.post('/auth/verify-otp', { phone, otp })
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    }
  },

  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    const response = await api.post<any, any>('/auth/refresh', { refreshToken })
    return response.data
  },
}
