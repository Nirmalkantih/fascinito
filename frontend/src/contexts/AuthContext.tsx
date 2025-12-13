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
  login: (phoneOrEmail: string, password: string) => Promise<void>
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

      if (token && userData) {
        try {
          // Parse and set user data
          const parsedUser = JSON.parse(userData)
          setUser(parsedUser)
          authService.setAccessToken(token)
        } catch (error) {
          console.error('Error parsing user data:', error)
          // Clear invalid data
          localStorage.removeItem('accessToken')
          localStorage.removeItem('user')
        }
      } else if (token && !userData) {
        // Token exists but no user data - clear token
        localStorage.removeItem('accessToken')
      }
      
      setLoading(false)
    }

    restoreSession()
  }, [])

  const login = async (phoneOrEmail: string, password: string) => {
    try {
      const response = await authService.login({ email: phoneOrEmail, password })
      console.log('🔐 Login Response:', response)
      
      const { accessToken, userId, ...userData } = response
      
      // Store access token (refresh token is in httpOnly cookie)
      authService.setAccessToken(accessToken)
      
      // Create user object
      const user = { id: userId, ...userData }
      console.log('👤 User Object:', user)
      console.log('🎭 User Roles:', user.roles)
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(user))
      
      setUser(user)
      toast.success('Login successful!')
      
      // Redirect based on role
      if (user.roles?.includes('ROLE_ADMIN') || user.roles?.includes('ROLE_STAFF')) {
        window.location.href = '/admin'
      } else {
        window.location.href = '/'
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed'
      toast.error(errorMessage)
      throw error
    }
  }

  const signup = async (data: SignupData) => {
    try {
      const response = await authService.signup(data)
      const { accessToken, userId, ...userData } = response
      
      // Store access token (refresh token is in httpOnly cookie)
      authService.setAccessToken(accessToken)
      
      // Create user object
      const user = { id: userId, ...userData }
      localStorage.setItem('user', JSON.stringify(user))
      
      setUser(user)
      toast.success('Account created successfully!')
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Signup failed'
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = () => {
    try {
      // Call logout API (clears refresh token cookie on server)
      authService.logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
    
    // Clear local state
    localStorage.removeItem('accessToken')
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
