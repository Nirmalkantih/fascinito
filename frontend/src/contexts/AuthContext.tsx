import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authService } from '../services/authService'
import { toast } from 'react-toastify'

interface User {
  id: number
  email: string
  firstName: string
  lastName: string
  roles?: string[]
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (data: SignupData) => Promise<void>
  logout: () => void
  loading: boolean
}

interface SignupData {
  firstName: string
  lastName: string
  email: string
  password: string
  phone?: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('accessToken')
      const userData = localStorage.getItem('user')
      const refreshToken = localStorage.getItem('refreshToken')

      if (token && userData) {
        try {
          setUser(JSON.parse(userData))
        } catch (error) {
          console.error('Error parsing user data:', error)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
        }
      } else if (refreshToken && !token) {
        // Try to refresh the token if refresh token exists but access token is missing
        try {
          const response = await authService.refreshToken(refreshToken)
          localStorage.setItem('accessToken', response.accessToken)
          const userData = JSON.parse(localStorage.getItem('user') || '{}')
          setUser(userData)
        } catch (error) {
          console.error('Error refreshing token:', error)
          localStorage.removeItem('accessToken')
          localStorage.removeItem('refreshToken')
          localStorage.removeItem('user')
        }
      }
      setLoading(false)
    }

    restoreSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password })
      console.log('🔐 Login Response:', response)
      const { accessToken, refreshToken, userId, ...userData } = response
      
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      const user = { id: userId, ...userData }
      console.log('👤 User Object:', user)
      console.log('🎭 User Roles:', user.roles)
      localStorage.setItem('user', JSON.stringify(user))
      
      setUser(user)
      toast.success('Login successful!')
    } catch (error: any) {
      toast.error(error.message || 'Login failed')
      throw error
    }
  }

  const signup = async (data: SignupData) => {
    try {
      const response = await authService.signup(data)
      const { accessToken, refreshToken, userId, ...userData } = response
      
      localStorage.setItem('accessToken', accessToken)
      localStorage.setItem('refreshToken', refreshToken)
      const user = { id: userId, ...userData }
      localStorage.setItem('user', JSON.stringify(user))
      
      setUser(user)
      toast.success('Account created successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Signup failed')
      throw error
    }
  }

  const logout = () => {
    try {
      authService.logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
    toast.info('Logged out successfully')
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
