import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Link,
  InputAdornment,
  Alert,
} from '@mui/material'
import {
  Phone,
  Login as LoginIcon,
} from '@mui/icons-material'
import { auth } from '../../config/firebase'
import { signInWithPhoneNumber, RecaptchaVerifier, ConfirmationResult } from 'firebase/auth'
import api from '../../services/api'

interface CountryInfo {
  code: string
  flag: string
  dialCode: string
}

export default function Login() {
  const location = useLocation()
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpSent, setOtpSent] = useState(false)
  const [error, setError] = useState('')
  const [detectedCountry, setDetectedCountry] = useState<CountryInfo | null>(null)
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [countdown, setCountdown] = useState(0)

  // Auto-detect country based on phone number
  const detectCountry = (phoneNumber: string) => {
    const digits = phoneNumber.replace(/\D/g, '')
    
    // If exactly 10 digits, assume India
    if (digits.length === 10) {
      setDetectedCountry({
        code: 'IN',
        flag: '🇮🇳',
        dialCode: '+91'
      })
    } else if (digits.length === 0) {
      setDetectedCountry(null)
    }
  }

  // Format phone number for Firebase (E.164 format)
  const formatPhoneForFirebase = (phoneNumber: string): string => {
    const digits = phoneNumber.replace(/\D/g, '')
    
    // If 10 digits, assume India
    if (digits.length === 10) {
      return `+91${digits}`
    }
    
    return phoneNumber
  }

  // Validate phone number
  const validatePhone = (phoneNumber: string): boolean => {
    const digits = phoneNumber.replace(/\D/g, '')
    return digits.length === 10
  }

  // Setup reCAPTCHA
  const setupRecaptcha = () => {
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container-login',
        {
          size: 'normal',
          callback: () => {
            console.log('reCAPTCHA solved')
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired')
            setError('reCAPTCHA expired. Please try again.')
          }
        }
      )
    }
    return (window as any).recaptchaVerifier
  }

  // Start countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Send OTP
  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    
    setError('')
    
    // Validate phone
    if (!validatePhone(phone)) {
      setError('Please enter a valid 10-digit phone number')
      return
    }

    setLoading(true)

    try {
      const formattedPhone = formatPhoneForFirebase(phone)
      console.log('Sending OTP to:', formattedPhone)

      const appVerifier = setupRecaptcha()
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier)
      
      setConfirmationResult(confirmation)
      setOtpSent(true)
      setCountdown(60)
      console.log('OTP sent successfully')
    } catch (err: any) {
      console.error('Error sending OTP:', err)
      
      let errorMessage = 'Failed to send OTP. Please try again.'
      
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format'
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.'
      } else if (err.code === 'auth/invalid-app-credential') {
        errorMessage = 'For development: Use test number 1234567899\n\nReal phone numbers require production deployment with authorized domain.'
      }
      
      setError(errorMessage)
      
      // Reset reCAPTCHA
      if ((window as any).recaptchaVerifier) {
        (window as any).recaptchaVerifier.clear()
        ;(window as any).recaptchaVerifier = null
      }
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP and Login
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    if (!confirmationResult) {
      setError('Please request OTP first')
      return
    }

    setLoading(true)
    setError('')

    try {
      // Verify OTP with Firebase
      const result = await confirmationResult.confirm(otp)
      console.log('✅ OTP verified successfully with Firebase')
      console.log('Firebase user:', result.user.uid)
      console.log('Phone number:', result.user.phoneNumber)

      // Get Firebase ID token
      const idToken = await result.user.getIdToken()
      console.log('✅ Got Firebase ID token (length):', idToken.length)
      
      // Login with backend using Firebase token
      console.log('📤 Sending request to /auth/firebase-login...')
      const response: any = await api.post('/auth/firebase-login', { idToken })
      
      console.log('📥 Backend response received:', response)
      
      // Extract auth data from ApiResponse structure
      const authData = response.data
      
      console.log('Auth data:', authData)
      
      if (authData && authData.accessToken) {
        console.log('✅ Access token found, storing in localStorage')
        // Store token and user data
        localStorage.setItem('accessToken', authData.accessToken)
        localStorage.setItem('user', JSON.stringify(authData))

        console.log('Stored token:', localStorage.getItem('accessToken'))
        console.log('User roles:', authData.roles)

        // Check redirect location
        const from = (location.state as any)?.from

        // Check roles and redirect
        if (authData.roles?.includes('ROLE_ADMIN') || authData.roles?.includes('ROLE_STAFF')) {
          console.log('🚀 Redirecting to /admin')
          window.location.href = '/admin'
        } else if (from) {
          console.log('🚀 Redirecting to:', from)
          window.location.href = from
        } else {
          console.log('🚀 Redirecting to /')
          window.location.href = '/'
        }
      } else {
        console.error('❌ No access token in response')
        console.error('Response structure:', JSON.stringify(response, null, 2))
        setError('Login failed. Please try again.')
      }
    } catch (err: any) {
      console.error('Error verifying OTP:', err)
      
      let errorMessage = 'Invalid OTP. Please try again.'
      
      if (err.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP code'
      } else if (err.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new one.'
      } else if (err.response?.data?.message) {
        errorMessage = err.response.data.message
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      
      // Log full error for debugging
      console.error('Full error details:', {
        code: err.code,
        message: err.message,
        response: err.response?.data
      })
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = () => {
    setOtp('')
    setOtpSent(false)
    setConfirmationResult(null)
    
    // Reset reCAPTCHA
    if ((window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier.clear()
      ;(window as any).recaptchaVerifier = null
    }
    
    handleSendOtp()
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 10)
    setPhone(value)
    detectCountry(value)
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'0.05\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
        },
      }}
    >
      <Container component="main" maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            position: 'relative',
            zIndex: 1,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.95)',
          }}
        >
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box
              sx={{
                width: 80,
                height: 80,
                margin: '0 auto 16px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 16px rgba(102, 126, 234, 0.3)',
              }}
            >
              <LoginIcon sx={{ fontSize: 40, color: 'white' }} />
            </Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 800,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Welcome Back
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Sign in to continue to your account
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}>
            {!otpSent ? (
              // Step 1: Enter Phone Number
              <>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  autoComplete="tel"
                  autoFocus
                  value={phone}
                  onChange={handlePhoneChange}
                  placeholder="Enter 10-digit mobile number"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {detectedCountry ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <span style={{ fontSize: '1.2rem' }}>{detectedCountry.flag}</span>
                            <Typography variant="body2" color="text.secondary">
                              {detectedCountry.dialCode}
                            </Typography>
                          </Box>
                        ) : (
                          <Phone color="primary" />
                        )}
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />

                {/* reCAPTCHA Container */}
                <Box 
                  id="recaptcha-container-login" 
                  sx={{ 
                    mb: 3,
                    display: 'flex',
                    justifyContent: 'center',
                    '& > div': {
                      margin: '0 auto'
                    }
                  }} 
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || !phone || phone.length !== 10}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    mb: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    },
                  }}
                >
                  {loading ? 'Sending OTP...' : 'Send OTP'}
                </Button>
              </>
            ) : (
              // Step 2: Enter OTP
              <>
                <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
                  OTP sent to {detectedCountry?.flag} {detectedCountry?.dialCode} {phone}
                </Alert>

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="otp"
                  label="Enter OTP"
                  name="otp"
                  autoComplete="one-time-code"
                  autoFocus
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  inputProps={{
                    maxLength: 6,
                    pattern: '[0-9]*',
                    inputMode: 'numeric',
                  }}
                  sx={{ mb: 3 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || otp.length !== 6}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    mb: 2,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    },
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </Button>

                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  {countdown > 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      Resend OTP in {countdown}s
                    </Typography>
                  ) : (
                    <Button
                      variant="text"
                      onClick={handleResendOtp}
                      disabled={loading}
                      sx={{
                        color: 'primary.main',
                        fontWeight: 600,
                        '&:hover': { textDecoration: 'underline' },
                      }}
                    >
                      Resend OTP
                    </Button>
                  )}
                </Box>
              </>
            )}

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  href="/signup"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign Up
                </Link>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Admin or Staff?{' '}
                <Link
                  href="/admin/login"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Admin Login
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Typography
          variant="body2"
          sx={{
            mt: 3,
            textAlign: 'center',
            color: 'rgba(255, 255, 255, 0.8)',
          }}
        >
          © 2025 POS Application. All rights reserved.
        </Typography>
      </Container>
    </Box>
  )
}
