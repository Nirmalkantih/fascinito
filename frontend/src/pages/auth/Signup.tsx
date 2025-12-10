import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Paper,
  Link,
  Grid,
  InputAdornment,
  IconButton,
  Alert,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material'
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  Phone,
  PersonAdd,
  VerifiedUser,
} from '@mui/icons-material'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { useAuth } from '../../contexts/AuthContext'

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const [activeStep, setActiveStep] = useState(0)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
  })
  const [otp, setOtp] = useState('')
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [detectedCountry, setDetectedCountry] = useState<{ code: string; flag: string; dialCode: string } | null>(null)

  const steps = ['Enter Details', 'Verify Phone']

  // Country detection logic
  const detectCountry = (phone: string): { code: string; flag: string; dialCode: string } | null => {
    // Remove all non-digit characters
    const digits = phone.replace(/\D/g, '')
    
    // If 10 digits, assume India
    if (digits.length === 10) {
      return { code: 'IN', flag: '🇮🇳', dialCode: '+91' }
    }
    
    // If starts with 91 and has 12 digits total (91 + 10 digits), it's India
    if (digits.startsWith('91') && digits.length === 12) {
      return { code: 'IN', flag: '🇮🇳', dialCode: '+91' }
    }
    
    // Add more countries as needed in future
    // Example:
    // if (digits.length === 10 && digits.startsWith('1')) {
    //   return { code: 'US', flag: '🇺🇸', dialCode: '+1' }
    // }
    
    return null
  }

  // Format phone to E.164 based on detected country
  const formatPhoneForFirebase = (phone: string): string => {
    const digits = phone.replace(/\D/g, '')
    
    // If already has + sign, validate and return
    if (phone.includes('+')) {
      const cleaned = phone.replace(/\s/g, '').replace(/[-()]/g, '')
      return cleaned
    }
    
    // Auto-detect country and format
    const country = detectCountry(phone)
    if (country) {
      if (country.code === 'IN') {
        // Remove leading 91 if present
        const numberPart = digits.startsWith('91') ? digits.substring(2) : digits
        return `+91${numberPart}`
      }
    }
    
    // Fallback: if no country detected, assume India for 10 digits
    if (digits.length === 10) {
      return `+91${digits}`
    }
    
    return `+${digits}`
  }

  // Phone validation
  const validatePhone = (phone: string): boolean => {
    const digits = phone.replace(/\D/g, '')
    
    // Valid if exactly 10 digits (Indian number without country code)
    if (digits.length === 10) {
      return true
    }
    
    // Valid if 12 digits starting with 91 (Indian number with country code)
    if (digits.length === 12 && digits.startsWith('91')) {
      return true
    }
    
    // Firebase E.164 format validation
    const phoneRegex = /^\+[1-9]\d{1,14}$/
    return phoneRegex.test(formatPhoneForFirebase(phone))
  }

  // Update country detection when phone changes
  useEffect(() => {
    if (formData.phone) {
      const country = detectCountry(formData.phone)
      setDetectedCountry(country)
    } else {
      setDetectedCountry(null)
    }
  }, [formData.phone])

  // Setup Firebase reCAPTCHA verifier with better error handling
  const setupRecaptcha = () => {
    // Clear any existing verifier first
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear()
        console.log('🧹 Cleared existing reCAPTCHA')
      } catch (e) {
        console.log('Previous reCAPTCHA already cleared')
      }
      ;(window as any).recaptchaVerifier = null
    }

    try {
      console.log('🔧 Setting up Firebase reCAPTCHA...')
      
      window.recaptchaVerifier = new RecaptchaVerifier(
        auth,
        'recaptcha-container',
        {
          size: 'normal', // Changed from 'invisible' to 'normal' for better reliability
          callback: (response: any) => {
            console.log('✅ reCAPTCHA solved, token:', response?.substring(0, 20) + '...')
          },
          'expired-callback': () => {
            console.log('⚠️ reCAPTCHA expired, please try again')
            setError('reCAPTCHA expired. Please try again.')
          },
          'error-callback': () => {
            console.log('❌ reCAPTCHA error occurred')
            setError('reCAPTCHA verification failed. Please refresh and try again.')
          },
        }
      )

      console.log('✅ Firebase reCAPTCHA initialized successfully')
      console.log('📱 Ready to send OTP')
    } catch (error) {
      console.error('❌ reCAPTCHA setup error:', error)
      setError('Failed to initialize reCAPTCHA. Please refresh the page.')
    }
  }

  // Send OTP using Firebase
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.password) {
      setError('Please fill in all required fields')
      return
    }

    // Format phone for Firebase
    const phoneNumber = formatPhoneForFirebase(formData.phone)
    
    // Validate phone number
    if (!validatePhone(phoneNumber)) {
      setError('Please enter a valid 10-digit mobile number')
      return
    }

    // Validate password
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      // IMPORTANT: Setup reCAPTCHA before sending OTP
      console.log('🔧 Setting up reCAPTCHA...')
      setupRecaptcha()
      
      // Wait longer for reCAPTCHA to fully initialize (especially for real numbers)
      console.log('⏳ Waiting for reCAPTCHA to be ready...')
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      const appVerifier = window.recaptchaVerifier
      
      if (!appVerifier) {
        throw new Error('reCAPTCHA verifier not initialized. Please refresh the page and try again.')
      }
      
      console.log('📱 Sending OTP to:', phoneNumber)
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      console.log('✅ OTP sent successfully!')
      
      setConfirmationResult(confirmation)
      setActiveStep(1)
      setCountdown(60)
      
      // Start countdown timer
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      console.error('❌ Send OTP error:', err)
      console.error('Error code:', err.code)
      console.error('Error message:', err.message)
      console.error('Full error object:', JSON.stringify(err, null, 2))
      
      // Clear reCAPTCHA on error to allow retry
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear()
        } catch (clearError) {
          console.error('Error clearing reCAPTCHA:', clearError)
        }
        ;(window as any).recaptchaVerifier = null
      }
      
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid phone number format. Use +[country code][number] (e.g., +919876543210)')
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please try again later.')
      } else if (err.code === 'auth/quota-exceeded') {
        setError('⚠️ Daily SMS quota exceeded. Please try again tomorrow or use test phone numbers for development.')
      } else if (err.code === 'auth/missing-app-credential') {
        setError('⚠️ reCAPTCHA verification failed. Please refresh the page and try again.')
      } else if (err.code === 'auth/invalid-app-credential') {
        setError('⚠️ Firebase Phone Auth verification failed on localhost. This is a known limitation.\n\n✅ SOLUTION: Use test phone number for development:\n• Phone: +911234567899 (or just 1234567899)\n• OTP Code: 123456\n\n💡 Real phone numbers will work in production deployment!')
      } else if (err.code === 'auth/captcha-check-failed') {
        setError('⚠️ reCAPTCHA verification failed. Please try again or use a test phone number.')
      } else {
        setError(`Error (${err.code || 'unknown'}): ${err.message || 'Failed to send OTP. Please try again.'}`)
      }
    } finally {
      setLoading(false)
    }
  }

  // Verify OTP and create account
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP')
      return
    }

    if (!confirmationResult) {
      setError('Please request OTP first')
      return
    }

    setLoading(true)
    try {
      // Verify OTP with Firebase
      await confirmationResult.confirm(otp)
      
      // OTP verified successfully, now create account in your backend
      await signup(formData)
      navigate('/')
    } catch (err: any) {
      console.error('Verify OTP error:', err)
      if (err.code === 'auth/invalid-verification-code') {
        setError('Invalid OTP. Please check and try again.')
      } else if (err.code === 'auth/code-expired') {
        setError('OTP has expired. Please request a new one.')
      } else {
        setError(err.message || 'Failed to verify OTP. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return
    
    setError('')
    setLoading(true)
    try {
      // Setup reCAPTCHA before resending
      console.log('🔧 Setting up reCAPTCHA for resend...')
      setupRecaptcha()
      
      // Wait a bit for reCAPTCHA to fully initialize
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const phoneNumber = formatPhoneForFirebase(formData.phone)
      const appVerifier = window.recaptchaVerifier
      
      if (!appVerifier) {
        throw new Error('reCAPTCHA verifier not initialized')
      }
      
      console.log('📱 Resending OTP to:', phoneNumber)
      const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier)
      console.log('✅ OTP resent successfully!')
      
      setConfirmationResult(confirmation)
      setCountdown(60)
      
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (err: any) {
      console.error('❌ Resend OTP error:', err)
      
      // Clear reCAPTCHA on error to allow retry
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear()
        } catch (clearError) {
          console.error('Error clearing reCAPTCHA:', clearError)
        }
        ;(window as any).recaptchaVerifier = null
      }
      
      setError(err.message || 'Failed to resend OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = activeStep === 0 ? handleSendOtp : handleVerifyOtp

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        py: 4,
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
              {activeStep === 0 ? (
                <PersonAdd sx={{ fontSize: 40, color: 'white' }} />
              ) : (
                <VerifiedUser sx={{ fontSize: 40, color: 'white' }} />
              )}
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
              {activeStep === 0 ? 'Create Account' : 'Verify Phone Number'}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {activeStep === 0 
                ? 'Join us today and start shopping!' 
                : 'Enter the 6-digit code sent to your phone'}
            </Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, whiteSpace: 'pre-line' }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            {activeStep === 0 ? (
              // Step 1: User Details
              <>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      id="firstName"
                      label="First Name"
                      name="firstName"
                      autoComplete="given-name"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      required
                      fullWidth
                      id="lastName"
                      label="Last Name"
                      name="lastName"
                      autoComplete="family-name"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Person color="primary" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Grid>
                </Grid>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="phone"
                  label="Phone Number"
                  name="phone"
                  autoComplete="tel"
                  placeholder="1234567899"
                  value={formData.phone}
                  onChange={(e) => {
                    // Allow only digits
                    const value = e.target.value.replace(/\D/g, '')
                    setFormData({ ...formData, phone: value })
                  }}
                  error={formData.phone !== '' && !validatePhone(formData.phone)}
                  helperText={
                    formData.phone !== '' && !validatePhone(formData.phone)
                      ? 'Please enter a valid 10-digit mobile number'
                      : detectedCountry 
                        ? `${detectedCountry.flag} ${detectedCountry.dialCode} detected - India`
                        : 'Enter your 10-digit mobile number'
                  }
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        {detectedCountry ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography sx={{ fontSize: '1.5rem' }}>{detectedCountry.flag}</Typography>
                            <Typography sx={{ color: 'text.secondary', fontSize: '0.9rem' }}>
                              {detectedCountry.dialCode}
                            </Typography>
                          </Box>
                        ) : (
                          <Phone color="primary" />
                        )}
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mt: 2 }}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  id="email"
                  label="Email Address (Optional)"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="primary" />
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  autoComplete="new-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="primary" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Password must be at least 6 characters"
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
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
              // Step 2: OTP Verification
              <>
                <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                  We've sent a 6-digit verification code to{' '}
                  <strong>
                    {detectedCountry?.flag} {detectedCountry?.dialCode} {formData.phone}
                  </strong>
                </Alert>

                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="otp"
                  label="Enter OTP"
                  name="otp"
                  value={otp}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(value)
                  }}
                  inputProps={{
                    maxLength: 6,
                    style: { fontSize: '24px', textAlign: 'center', letterSpacing: '8px' },
                  }}
                  helperText="Enter the 6-digit code"
                  sx={{ mt: 2 }}
                />

                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading || otp.length !== 6}
                  sx={{
                    mt: 3,
                    mb: 2,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #5568d3 0%, #6a3f8f 100%)',
                    },
                  }}
                >
                  {loading ? 'Verifying...' : 'Verify & Create Account'}
                </Button>

                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Didn't receive the code?{' '}
                    {countdown > 0 ? (
                      <span>Resend in {countdown}s</span>
                    ) : (
                      <Link
                        component="button"
                        type="button"
                        onClick={handleResendOtp}
                        sx={{
                          color: 'primary.main',
                          fontWeight: 600,
                          textDecoration: 'none',
                          cursor: 'pointer',
                          '&:hover': { textDecoration: 'underline' },
                        }}
                      >
                        Resend OTP
                      </Link>
                    )}
                  </Typography>
                  <Button
                    onClick={() => {
                      setActiveStep(0)
                      setOtp('')
                      setConfirmationResult(null)
                      setError('')
                    }}
                    sx={{ mt: 1 }}
                  >
                    Change Phone Number
                  </Button>
                </Box>
              </>
            )}

            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  href="/login"
                  sx={{
                    color: 'primary.main',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Sign In
                </Link>
              </Typography>
            </Box>

            {/* reCAPTCHA container - Centered and visible */}
            <Box 
              id="recaptcha-container"
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                mt: 3,
                mb: 2,
                minHeight: '78px', // Reserve space for reCAPTCHA
                '& > div': {
                  margin: '0 auto',
                  transform: 'scale(0.9)', // Slightly smaller for better fit
                  transformOrigin: 'center',
                }
              }}
            ></Box>
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