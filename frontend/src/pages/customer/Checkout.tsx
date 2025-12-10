import { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Button,
  Box,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Radio,
  RadioGroup,
  FormControlLabel,
  Alert,
  CircularProgress,
  alpha,
  useTheme,
  Paper,
  Chip,
  Fade,
  Slide,
  StepConnector,
  stepConnectorClasses,
  styled
} from '@mui/material'
import { 
  ArrowBack, 
  CheckCircle, 
  LocalShipping, 
  Payment, 
  Receipt, 
  Home,
  Check
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import PaymentModal from '../../components/PaymentModal'
import razorpayService from '../../services/razorpayService'
import { PaymentVerificationResponse } from '../../types/razorpay'
import api from '../../services/api'

interface CartItem {
  id: number
  productId: number
  productName: string
  quantity: number
  productPrice: number
}

interface CartData {
  items: CartItem[]
  subtotal: number
  tax: number
  shipping: number
  discount: number
  totalAmount: number
}

const steps = ['Order Summary', 'Shipping Address', 'Billing Address', 'Payment', 'Review & Place Order']

// Custom styled components for a modern stepper
const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 22,
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(95deg, #667eea 0%, #764ba2 100%)',
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      backgroundImage: 'linear-gradient(95deg, #667eea 0%, #764ba2 100%)',
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : '#eaeaf0',
    borderRadius: 1,
  },
}))

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean }
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  ...(ownerState.active && {
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  }),
}))

function ColorlibStepIcon(props: any) {
  const { active, completed, className } = props

  const icons: { [index: string]: React.ReactElement } = {
    1: <Receipt />,
    2: <LocalShipping />,
    3: <Home />,
    4: <Payment />,
    5: <CheckCircle />,
  }

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check /> : icons[String(props.icon)]}
    </ColorlibStepIconRoot>
  )
}

export default function Checkout() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [cartData, setCartData] = useState<CartData | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })
  const [billingAddress, setBillingAddress] = useState({
    fullName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  })
  const [sameAsBilling, setSameAsBilling] = useState(false)
  const [discount] = useState(0)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [orderCreated, setOrderCreated] = useState<any>(null)

  // Fetch cart on mount
  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    setLoading(true)
    try {
      const data = await api.get('/cart')
      setCartData(data.data)

      // Pre-fill shipping address with user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}')
      setShippingAddress(prev => ({
        ...prev,
        fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        email: userData.email || ''
      }))
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast.error('Failed to load cart')
      navigate('/cart')
    } finally {
      setLoading(false)
    }
  }

  const handleAddressChange = (field: string, value: string, isBilling = false) => {
    if (isBilling) {
      setBillingAddress(prev => ({ ...prev, [field]: value }))
    } else {
      setShippingAddress(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleSameAsShipping = (checked: boolean) => {
    setSameAsBilling(checked)
    if (checked) {
      setBillingAddress(shippingAddress)
    }
  }

  const validateAddresses = () => {
    const required = ['fullName', 'email', 'phone', 'street', 'city', 'state', 'zipCode', 'country']

    for (const field of required) {
      if (!shippingAddress[field as keyof typeof shippingAddress]) {
        toast.error('Please fill in all shipping address fields')
        return false
      }
    }

    if (!sameAsBilling) {
      for (const field of required) {
        if (!billingAddress[field as keyof typeof billingAddress]) {
          toast.error('Please fill in all billing address fields')
          return false
        }
      }
    }

    return true
  }

  const handlePlaceOrder = async () => {
    if (!validateAddresses()) {
      return
    }

    setSubmitting(true)
    try {
      console.log('Creating order...')

      // Map frontend payment methods to backend enum values
      const backendPaymentMethod = paymentMethod === 'CARD' ? 'RAZORPAY' : paymentMethod

      // Create order with PENDING status
      const order = await api.post('/orders/checkout', {
        shippingAddress: `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}, ${shippingAddress.country}`,
        billingAddress: sameAsBilling
          ? `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zipCode}, ${shippingAddress.country}`
          : `${billingAddress.street}, ${billingAddress.city}, ${billingAddress.state} ${billingAddress.zipCode}, ${billingAddress.country}`,
        paymentMethod: backendPaymentMethod,
        discount: discount,
        testMode: true  // Enable test mode for demo checkout
      })

      console.log('Order created successfully:', order)
      const orderData = order.data

      // Store order data
      setOrderCreated(orderData)

      // Handle payment based on selected method
      if (paymentMethod === 'CASH') {
        // Cash on Delivery - show success message and navigate
        toast.success('Order placed successfully! Pay cash on delivery.')
        navigate(`/order-success/${orderData.id}`)
      } else if (paymentMethod === 'UPI' || paymentMethod === 'CARD') {
        // Use Razorpay for UPI and Card payments
        // Pass the preferred method to Razorpay
        await initiateRazorpayPayment(orderData, paymentMethod)
      } else {
        // Fallback to payment modal for other methods
        setPaymentModalOpen(true)
      }

    } catch (error) {
      console.error('Error placing order:', error)
      toast.error('Failed to create order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const initiateRazorpayPayment = async (orderData: any, preferredMethod?: string) => {
    try {
      // Create Razorpay order
      const razorpayOrderData = await razorpayService.createOrder(orderData.id)

      // Display Razorpay checkout with preferred method
      await razorpayService.displayRazorpay(
        razorpayOrderData,
        (response: PaymentVerificationResponse) => {
          // Payment successful
          handleRazorpaySuccess(response)
        },
        (error: any) => {
          // Payment failed
          handleRazorpayFailure(error)
        },
        preferredMethod // Pass UPI or CARD to show that section by default
      )
    } catch (error) {
      console.error('Error initiating Razorpay payment:', error)
      toast.error('Failed to initiate payment. Please try again.')
    }
  }

  const handleRazorpaySuccess = async (response: PaymentVerificationResponse) => {
    try {
      // Clear cart after successful payment
      try {
        await api.delete('/cart')
      } catch (error) {
        console.warn('Failed to clear cart, but order was confirmed:', error)
      }

      // Dispatch event to update cart count in UI
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      toast.success('Payment successful! Order confirmed.')

      // Navigate to order success page
      navigate(`/order-success/${response.orderId}`)
    } catch (error) {
      console.error('Error handling Razorpay success:', error)
      toast.error('Payment succeeded but failed to complete order. Please contact support.')
    }
  }

  const handleRazorpayFailure = async (error: any) => {
    console.error('Razorpay payment failed:', error)
    
    // Notify backend about payment failure
    if (orderCreated) {
      try {
        await razorpayService.handlePaymentFailure(
          orderCreated.id, 
          error?.description || 'Payment failed or cancelled by user'
        )
      } catch (err) {
        console.error('Failed to notify backend about payment failure:', err)
      }
    }
    
    toast.error(error?.description || 'Payment failed. Please try again.')
  }

  const handlePaymentSuccess = async (_paymentData: any) => {
    try {
      if (!orderCreated) {
        throw new Error('Order data not found')
      }

      // Update order status to CONFIRMED after successful payment
      await api.put(`/orders/${orderCreated.id}/status`, {
        status: 'CONFIRMED'
      })

      // Clear cart after successful payment
      try {
        await api.delete('/cart')
      } catch (error) {
        console.warn('Failed to clear cart, but order was confirmed:', error)
      }

      // Dispatch event to update cart count in UI
      window.dispatchEvent(new CustomEvent('cartUpdated'))

      // Close payment modal
      setPaymentModalOpen(false)

      toast.success('Payment successful! Order confirmed.')

      // Navigate to order success page
      navigate(`/order-success/${orderCreated.id}`)
    } catch (error) {
      console.error('Error confirming payment:', error)
      toast.error('Payment succeeded but failed to confirm order. Please contact support.')
    }
  }

  const handlePaymentClose = () => {
    setPaymentModalOpen(false)
    // Keep the order as PENDING if payment modal is closed without completing
  }

  if (loading) {
    return (
      <Container sx={{ py: 4, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '500px' }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!cartData || cartData.items.length === 0) {
    return (
      <Container sx={{ py: 4 }}>
        <Alert severity="error">Your cart is empty. Please add items before checking out.</Alert>
        <Button variant="contained" onClick={() => navigate('/products')} sx={{ mt: 2 }}>
          Continue Shopping
        </Button>
      </Container>
    )
  }

  return (
    <Box sx={{ 
      bgcolor: alpha(theme.palette.primary.main, 0.02), 
      minHeight: '100vh', 
      py: 4,
      background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.05) 0%, rgba(255, 255, 255, 0) 100%)'
    }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Fade in timeout={500}>
          <Box sx={{ mb: 4 }}>
            <Button
              startIcon={<ArrowBack />}
              onClick={() => navigate('/cart')}
              sx={{ 
                textTransform: 'none',
                mb: 2,
                '&:hover': {
                  transform: 'translateX(-5px)',
                  transition: 'transform 0.3s ease'
                }
              }}
            >
              Back to Cart
            </Button>
            <Typography 
              variant="h3" 
              sx={{ 
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1
              }}
            >
              Secure Checkout
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Complete your order in a few simple steps
            </Typography>
          </Box>
        </Fade>

        {/* Modern Stepper */}
        <Slide direction="down" in timeout={700}>
          <Paper 
            elevation={0}
            sx={{ 
              mb: 4, 
              p: 3,
              borderRadius: 3,
              background: 'white',
              boxShadow: '0 4px 20px rgba(0,0,0,0.08)'
            }}
          >
            <Stepper 
              activeStep={activeStep} 
              alternativeLabel
              connector={<ColorlibConnector />}
            >
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={ColorlibStepIcon}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {label}
                    </Typography>
                  </StepLabel>
                </Step>
              ))}
            </Stepper>
          </Paper>
        </Slide>

        <Grid container spacing={3}>
          {/* Left Column - Form */}
          <Grid item xs={12} md={8}>
            {/* Step 0: Order Summary */}
            {activeStep === 0 && (
              <Fade in timeout={500}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Receipt sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Order Summary</Typography>
                      </Box>
                    }
                    sx={{ 
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    {cartData.items.map((item, index) => (
                      <Slide key={item.id} direction="right" in timeout={300 + index * 100}>
                        <Box sx={{ 
                          mb: 2, 
                          pb: 2, 
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            bgcolor: alpha(theme.palette.primary.main, 0.03),
                            borderRadius: 2,
                            px: 2,
                            mx: -2
                          }
                        }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                            <Box>
                              <Typography variant="h6" sx={{ fontWeight: 600 }}>{item.productName}</Typography>
                              <Chip 
                                label={`Qty: ${item.quantity}`}
                                size="small"
                                sx={{ 
                                  mt: 1,
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  fontWeight: 600
                                }}
                              />
                            </Box>
                            <Typography 
                              variant="h6" 
                              sx={{ 
                                fontWeight: 700,
                                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent'
                              }}
                            >
                              ${(item.productPrice * item.quantity).toFixed(2)}
                            </Typography>
                          </Box>
                        </Box>
                      </Slide>
                    ))}

                    <Divider sx={{ my: 3 }} />

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Subtotal:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>${cartData.subtotal.toFixed(2)}</Typography>
                      </Box>
                      {cartData.tax > 0 && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body1">Tax:</Typography>
                          <Typography variant="body1" sx={{ fontWeight: 600 }}>${cartData.tax.toFixed(2)}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Shipping:</Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>${cartData.shipping.toFixed(2)}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body1">Discount:</Typography>
                        <Typography variant="body1" color="error" sx={{ fontWeight: 600 }}>-${discount.toFixed(2)}</Typography>
                      </Box>
                    </Box>

                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      onClick={() => setActiveStep(1)}
                      sx={{ 
                        mt: 4,
                        py: 1.8,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                          transform: 'translateY(-2px)'
                        }
                      }}
                    >
                      Continue to Shipping
                    </Button>
                  </CardContent>
                </Card>
              </Fade>
            )}

            {/* Step 1: Shipping Address */}
            {activeStep === 1 && (
              <Fade in timeout={500}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocalShipping sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Shipping Address</Typography>
                      </Box>
                    }
                    sx={{ 
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Grid container spacing={2.5}>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Full Name"
                          value={shippingAddress.fullName}
                          onChange={(e) => handleAddressChange('fullName', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Email"
                          value={shippingAddress.email}
                          onChange={(e) => handleAddressChange('email', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Phone"
                          value={shippingAddress.phone}
                          onChange={(e) => handleAddressChange('phone', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Street Address"
                          value={shippingAddress.street}
                          onChange={(e) => handleAddressChange('street', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="City"
                          value={shippingAddress.city}
                          onChange={(e) => handleAddressChange('city', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="State"
                          value={shippingAddress.state}
                          onChange={(e) => handleAddressChange('state', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Zip Code"
                          value={shippingAddress.zipCode}
                          onChange={(e) => handleAddressChange('zipCode', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              }
                            }
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Country"
                          value={shippingAddress.country}
                          onChange={(e) => handleAddressChange('country', e.target.value)}
                          variant="outlined"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              '&:hover fieldset': {
                                borderColor: theme.palette.primary.main,
                              }
                            }
                          }}
                        />
                      </Grid>
                    </Grid>

                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => setActiveStep(0)}
                        sx={{ 
                          minWidth: 120,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => setActiveStep(2)}
                        sx={{ 
                          py: 1.8,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        Continue to Billing
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            )}

            {/* Step 2: Billing Address */}
            {activeStep === 2 && (
              <Fade in timeout={500}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Home sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Billing Address</Typography>
                      </Box>
                    }
                    sx={{ 
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        mb: 3,
                        bgcolor: alpha(theme.palette.primary.main, 0.05),
                        borderRadius: 2,
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}
                    >
                      <FormControlLabel
                        control={
                          <Radio
                            checked={sameAsBilling}
                            onChange={(e) => handleSameAsShipping(e.target.checked)}
                            sx={{
                              color: theme.palette.primary.main,
                              '&.Mui-checked': {
                                color: theme.palette.primary.main,
                              }
                            }}
                          />
                        }
                        label={
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            Same as shipping address
                          </Typography>
                        }
                      />
                    </Paper>

                    {!sameAsBilling && (
                      <Grid container spacing={2.5}>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Full Name"
                            value={billingAddress.fullName}
                            onChange={(e) => handleAddressChange('fullName', e.target.value, true)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Email"
                            value={billingAddress.email}
                            onChange={(e) => handleAddressChange('email', e.target.value, true)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Phone"
                            value={billingAddress.phone}
                            onChange={(e) => handleAddressChange('phone', e.target.value, true)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Street Address"
                            value={billingAddress.street}
                            onChange={(e) => handleAddressChange('street', e.target.value, true)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="City"
                            value={billingAddress.city}
                            onChange={(e) => handleAddressChange('city', e.target.value, true)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="State"
                            value={billingAddress.state}
                            onChange={(e) => handleAddressChange('state', e.target.value, true)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Zip Code"
                            value={billingAddress.zipCode}
                            onChange={(e) => handleAddressChange('zipCode', e.target.value, true)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              }
                            }}
                          />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <TextField
                            fullWidth
                            label="Country"
                            value={billingAddress.country}
                            onChange={(e) => handleAddressChange('country', e.target.value, true)}
                            variant="outlined"
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                '&:hover fieldset': {
                                  borderColor: theme.palette.primary.main,
                                }
                              }
                            }}
                          />
                        </Grid>
                      </Grid>
                    )}

                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => setActiveStep(1)}
                        sx={{ 
                          minWidth: 120,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => setActiveStep(3)}
                        sx={{ 
                          py: 1.8,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        Continue to Payment
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            )}

            {/* Step 3: Payment */}
            {activeStep === 3 && (
              <Fade in timeout={500}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Payment sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Payment Method</Typography>
                      </Box>
                    }
                    sx={{ 
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <RadioGroup
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      sx={{ gap: 1.5 }}
                    >
                      {[
                        { 
                          value: 'CASH', 
                          label: 'Cash on Delivery', 
                          icon: '💵',
                          description: 'Pay with cash when your order is delivered'
                        },
                        { 
                          value: 'UPI', 
                          label: 'UPI (Google Pay, PhonePe, Paytm)', 
                          icon: '📱',
                          description: 'Pay using any UPI app'
                        },
                        { 
                          value: 'CARD', 
                          label: 'Debit Card / Credit Card', 
                          icon: '�',
                          description: 'Pay securely with your card'
                        }
                      ].map((option) => (
                        <Paper
                          key={option.value}
                          elevation={0}
                          sx={{
                            p: 2,
                            border: `2px solid ${paymentMethod === option.value ? theme.palette.primary.main : alpha(theme.palette.divider, 0.5)}`,
                            borderRadius: 2,
                            cursor: 'pointer',
                            transition: 'all 0.3s ease',
                            bgcolor: paymentMethod === option.value ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                            '&:hover': {
                              borderColor: theme.palette.primary.main,
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                            }
                          }}
                          onClick={() => setPaymentMethod(option.value)}
                        >
                          <FormControlLabel
                            value={option.value}
                            control={
                              <Radio 
                                sx={{
                                  color: theme.palette.primary.main,
                                  '&.Mui-checked': {
                                    color: theme.palette.primary.main,
                                  }
                                }}
                              />
                            }
                            label={
                              <Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                  <Typography variant="h6">{option.icon}</Typography>
                                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                    {option.label}
                                  </Typography>
                                </Box>
                                <Typography variant="caption" color="text.secondary" sx={{ ml: 4 }}>
                                  {option.description}
                                </Typography>
                              </Box>
                            }
                            sx={{ width: '100%', m: 0, alignItems: 'flex-start' }}
                          />
                        </Paper>
                      ))}
                    </RadioGroup>

                    <Alert 
                      severity="info" 
                      sx={{ 
                        mt: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.info.main, 0.1),
                        '& .MuiAlert-icon': {
                          color: theme.palette.info.main
                        }
                      }}
                    >
                      {paymentMethod === 'CASH' 
                        ? '💰 Pay cash when your order arrives at your doorstep.'
                        : '🔒 Secure payment processing powered by industry-standard encryption.'
                      }
                    </Alert>

                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => setActiveStep(2)}
                        sx={{ 
                          minWidth: 120,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        onClick={() => setActiveStep(4)}
                        sx={{ 
                          py: 1.8,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                            boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                            transform: 'translateY(-2px)'
                          }
                        }}
                      >
                        Review Order
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            )}

            {/* Step 4: Review & Place Order */}
            {activeStep === 4 && (
              <Fade in timeout={500}>
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: 3,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    overflow: 'hidden'
                  }}
                >
                  <CardHeader 
                    title={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CheckCircle sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>Review Your Order</Typography>
                      </Box>
                    }
                    sx={{ 
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}
                  />
                  <CardContent sx={{ p: 3 }}>
                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <LocalShipping sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Shipping Address
                        </Typography>
                      </Box>
                      <Typography variant="body2" paragraph sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                        {shippingAddress.fullName}<br />
                        {shippingAddress.street}<br />
                        {shippingAddress.city}, {shippingAddress.state} {shippingAddress.zipCode}<br />
                        {shippingAddress.country}<br />
                        {shippingAddress.email} | {shippingAddress.phone}
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        mb: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Home sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Billing Address
                        </Typography>
                      </Box>
                      <Typography variant="body2" paragraph sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                        {sameAsBilling ? (
                          'Same as shipping address'
                        ) : (
                          <>
                            {billingAddress.fullName}<br />
                            {billingAddress.street}<br />
                            {billingAddress.city}, {billingAddress.state} {billingAddress.zipCode}<br />
                            {billingAddress.country}<br />
                            {billingAddress.email} | {billingAddress.phone}
                          </>
                        )}
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        bgcolor: alpha(theme.palette.primary.main, 0.03),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Payment sx={{ color: theme.palette.primary.main }} />
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          Payment Method
                        </Typography>
                      </Box>
                      <Chip
                        label={
                          paymentMethod === 'CASH' ? 'Cash on Delivery' :
                          paymentMethod === 'UPI' ? 'UPI Payment' :
                          paymentMethod === 'CARD' ? 'Card Payment' :
                          paymentMethod
                        }
                        sx={{
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          px: 1
                        }}
                      />
                    </Paper>

                    <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => setActiveStep(3)}
                        sx={{ 
                          minWidth: 120,
                          '&:hover': {
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 10px rgba(0,0,0,0.15)'
                          }
                        }}
                      >
                        Back
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        size="large"
                        color="success"
                        onClick={handlePlaceOrder}
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
                        sx={{ 
                          py: 1.8,
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          background: submitting ? undefined : 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                          boxShadow: '0 4px 15px rgba(56, 239, 125, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(135deg, #38ef7d 0%, #11998e 100%)',
                            boxShadow: '0 6px 20px rgba(56, 239, 125, 0.6)',
                            transform: 'translateY(-2px)'
                          },
                          '&:disabled': {
                            background: alpha(theme.palette.action.disabledBackground, 0.5)
                          }
                        }}
                      >
                        {submitting ? 'Creating Order...' : 'Proceed to Payment'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            )}
          </Grid>

          {/* Right Column - Order Summary */}
          <Grid item xs={12} md={4}>
            <Fade in timeout={700}>
              <Paper 
                elevation={0}
                sx={{ 
                  position: 'sticky', 
                  top: 20,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)'
                }}
              >
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    p: 3,
                    color: 'white'
                  }}
                >
                  <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                    Order Summary
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>
                    {cartData.items.length} {cartData.items.length === 1 ? 'item' : 'items'}
                  </Typography>
                </Box>

                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ mb: 3 }}>
                    {cartData.items.map((item) => (
                      <Box 
                        key={item.id} 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between',
                          mb: 2,
                          pb: 2,
                          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                          '&:last-child': {
                            borderBottom: 'none',
                            pb: 0,
                            mb: 0
                          }
                        }}
                      >
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                            {item.productName}
                          </Typography>
                          <Chip 
                            label={`Qty: ${item.quantity}`}
                            size="small"
                            sx={{ 
                              height: 20,
                              fontSize: '0.7rem',
                              bgcolor: alpha(theme.palette.primary.main, 0.1),
                              color: theme.palette.primary.main,
                              fontWeight: 600
                            }}
                          />
                        </Box>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            fontWeight: 700,
                            color: theme.palette.primary.main
                          }}
                        >
                          ${(item.productPrice * item.quantity).toFixed(2)}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Subtotal:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>${cartData.subtotal.toFixed(2)}</Typography>
                    </Box>
                    {cartData.tax > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="body2" color="text.secondary">Tax:</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>${cartData.tax.toFixed(2)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Shipping:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>${cartData.shipping.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="body2" color="text.secondary">Discount:</Typography>
                      <Typography variant="body2" color="error" sx={{ fontWeight: 600 }}>-${discount.toFixed(2)}</Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 3 }} />

                  <Box 
                    sx={{ 
                      p: 2,
                      borderRadius: 2,
                      background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6" sx={{ fontWeight: 700 }}>Total:</Typography>
                      <Typography 
                        variant="h5" 
                        sx={{ 
                          fontWeight: 800,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          WebkitBackgroundClip: 'text',
                          WebkitTextFillColor: 'transparent'
                        }}
                      >
                        ${(cartData.totalAmount - discount).toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Progress indicator */}
                  <Box sx={{ mt: 3, p: 2, bgcolor: alpha(theme.palette.success.main, 0.05), borderRadius: 2 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Checkout Progress
                    </Typography>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: 1
                    }}>
                      <Box 
                        sx={{ 
                          flex: 1, 
                          height: 6, 
                          bgcolor: alpha(theme.palette.divider, 0.3),
                          borderRadius: 3,
                          overflow: 'hidden'
                        }}
                      >
                        <Box 
                          sx={{ 
                            width: `${((activeStep + 1) / steps.length) * 100}%`,
                            height: '100%',
                            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
                            transition: 'width 0.5s ease'
                          }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        {activeStep + 1}/{steps.length}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Paper>
            </Fade>
          </Grid>
        </Grid>

        {/* Payment Modal */}
        {orderCreated && (
          <PaymentModal
            open={paymentModalOpen}
            onClose={handlePaymentClose}
            onPaymentSuccess={handlePaymentSuccess}
            orderData={{
              orderId: orderCreated.id,
              amount: cartData?.totalAmount || 0,
              customerName: `${shippingAddress.fullName}`,
              customerEmail: shippingAddress.email,
              currency: 'INR'
            }}
          />
        )}
      </Container>
    </Box>
  )
}
