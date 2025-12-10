import api from '../api/axiosConfig'

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
  refreshToken?: string // Optional now, as it's sent via cookie
  userId: number
  email: string
  firstName: string
  lastName: string
  roles: string[]
}

class AuthService {
  private accessToken: string | null = null

  /**
   * Set access token in memory and localStorage
   */
  setAccessToken(token: string) {
    this.accessToken = token
    localStorage.setItem('accessToken', token)
  }

  /**
   * Get access token from memory or localStorage
   */
  getAccessToken(): string | null {
    return this.accessToken || localStorage.getItem('accessToken')
  }

  /**
   * Login user with email and password
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await api.post<any, any>('/auth/login', data)
    return response.data
  }

  /**
   * Signup new user
   */
  async signup(data: SignupRequest): Promise<AuthResponse> {
    const response = await api.post<any, any>('/auth/signup', data)
    return response.data
  }

  /**
   * Send OTP to phone number
   */
  async sendOtp(phone: string): Promise<void> {
    await api.post('/auth/send-otp', { phone })
  }

  /**
   * Verify OTP
   */
  async verifyOtp(phone: string, otp: string): Promise<void> {
    await api.post('/auth/verify-otp', { phone, otp })
  }

  /**
   * Logout user (clears access token and refresh token cookie)
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout')
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      // Clear local storage regardless of API call success
      this.clearAuth()
    }
  }

  /**
   * Refresh access token (refresh token sent automatically via cookie)
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await api.post<any, any>('/auth/refresh')
      const newAccessToken = response.data.accessToken

      this.setAccessToken(newAccessToken)
      return newAccessToken
    } catch (err) {
      console.error('Refresh token expired. Logging out...')
      this.clearAuth()
      throw err
    }
  }

  /**
   * Clear authentication data and redirect to login
   */
  clearAuth() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('user')
    this.accessToken = null
    window.location.href = '/login'
  }
}

export const authService = new AuthService()

