import { useState } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  CircularProgress,
  alpha,
  useTheme,
  Card,
  CardContent,
  Grid
} from '@mui/material'
import {
  Payment as PaymentIcon,
  CreditCard,
  PhoneAndroid
} from '@mui/icons-material'
import { toast } from 'react-toastify'

interface PaymentModalProps {
  open: boolean
  onClose: () => void
  orderData: {
    orderId: number
    amount: number
    currency: string
    customerEmail: string
    customerName: string
  }
  onPaymentSuccess: (paymentDetails: any) => void
}

export default function PaymentModal({
  open,
  onClose,
  orderData,
  onPaymentSuccess
}: PaymentModalProps) {
  const theme = useTheme()
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card')
  const [loading, setLoading] = useState(false)

  const handlePayment = async () => {
    try {
      setLoading(true)

      // Initialize Razorpay payment
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1234567890abcd',
        amount: Math.round(orderData.amount * 100), // Amount in paise
        currency: orderData.currency || 'INR',
        name: 'Fascinito',
        description: `Payment for Order #${orderData.orderId}`,
        order_id: orderData.orderId.toString(),
        prefill: {
          name: orderData.customerName,
          email: orderData.customerEmail,
          contact: '9999999999' // You should get this from user
        },
        notes: {
          orderId: orderData.orderId,
          paymentMethod: paymentMethod
        },
        theme: {
          color: theme.palette.primary.main
        },
        handler: async function (response: any) {
          // Payment successful
          console.log('Payment successful:', response)
          toast.success('Payment successful!')
          onPaymentSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
            paymentMethod: paymentMethod,
            amount: orderData.amount
          })
          onClose()
        },
        modal: {
          ondismiss: function () {
            toast.info('Payment cancelled')
            setLoading(false)
          }
        },
        method: paymentMethod === 'upi' ? { upi: true } : { card: true }
      }

      // Load Razorpay script if not already loaded
      if (!(window as any).Razorpay) {
        const script = document.createElement('script')
        script.src = 'https://checkout.razorpay.com/v1/checkout.js'
        script.async = true
        script.onload = () => {
          const razorpay = new (window as any).Razorpay(options)
          razorpay.open()
        }
        document.body.appendChild(script)
      } else {
        const razorpay = new (window as any).Razorpay(options)
        razorpay.open()
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Failed to initiate payment')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 1 }}>
        <PaymentIcon color="primary" />
        Choose Payment Method
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 3 }}>
          <Alert severity="info" sx={{ mb: 3 }}>
            Amount to pay: <strong>₹{orderData.amount.toFixed(2)}</strong>
          </Alert>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Select Payment Option:
          </Typography>

          <RadioGroup value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value as 'card' | 'upi')}>
            <Grid container spacing={2}>
              {/* Card Payment Option */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: paymentMethod === 'card' ? `2px solid ${theme.palette.primary.main}` : '1px solid #ddd',
                    backgroundColor: paymentMethod === 'card' ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      borderColor: theme.palette.primary.main
                    }
                  }}
                  onClick={() => setPaymentMethod('card')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FormControlLabel
                        value="card"
                        control={<Radio checked={paymentMethod === 'card'} />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <CreditCard color={paymentMethod === 'card' ? 'primary' : 'inherit'} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                Credit/Debit Card
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Visa, MasterCard, American Express
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* UPI/Google Pay Option */}
              <Grid item xs={12}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    border: paymentMethod === 'upi' ? `2px solid ${theme.palette.primary.main}` : '1px solid #ddd',
                    backgroundColor: paymentMethod === 'upi' ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: theme.shadows[4],
                      borderColor: theme.palette.primary.main
                    }
                  }}
                  onClick={() => setPaymentMethod('upi')}
                >
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <FormControlLabel
                        value="upi"
                        control={<Radio checked={paymentMethod === 'upi'} />}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <PhoneAndroid color={paymentMethod === 'upi' ? 'primary' : 'inherit'} />
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                UPI / Google Pay
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Google Pay, PhonePe, BHIM, PayTM
                              </Typography>
                            </Box>
                          </Box>
                        }
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </RadioGroup>

          <Alert severity="warning" sx={{ mt: 3 }}>
            <Typography variant="caption">
              ℹ️ Your payment information is encrypted and secure. Razorpay is PCI DSS compliant.
            </Typography>
          </Alert>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          onClick={handlePayment}
          variant="contained"
          color="primary"
          disabled={loading}
          sx={{ minWidth: 150 }}
        >
          {loading ? <CircularProgress size={24} /> : `Pay ₹${orderData.amount.toFixed(2)}`}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
