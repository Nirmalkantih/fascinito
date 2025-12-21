import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Grid,
  Button,
  Divider,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  alpha,
  useTheme
} from '@mui/material'
import {
  CheckCircle,
  ShoppingBag,
  LocalShipping,
  Payment,
  Home
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import { Loader } from '../../components/Loader'
import api from '../../services/api'

interface OrderItem {
  id: number
  productId: number
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
  image?: string
}

interface PaymentInfo {
  method: string
  status: string
  transactionId?: string
}

interface OrderData {
  id: number
  orderNumber: string
  userEmail: string
  userFirstName: string
  userLastName: string
  status: string
  subtotal: number
  taxAmount: number
  shippingCost: number
  discount: number
  totalAmount: number
  shippingAddress: string
  billingAddress: string
  items: OrderItem[]
  payment: PaymentInfo
  createdAtTimestamp: number
}

export default function OrderSuccess() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const theme = useTheme()

  const [order, setOrder] = useState<OrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const fetchOrder = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      const response = await api.get(`/orders/${orderId}`)

      // Handle ApiResponse wrapper: response.data.data or direct response.data
      const data = response.data || response
      const orderData = data.data || data
      
      setOrder(orderData)
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to load order details. Please try again.'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string): 'success' | 'info' | 'warning' | 'error' | 'default' => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'warning'
      case 'CONFIRMED':
        return 'info'
      case 'PROCESSING':
        return 'info'
      case 'SHIPPED':
        return 'info'
      case 'DELIVERED':
        return 'success'
      case 'CANCELLED':
        return 'error'
      case 'REFUNDED':
        return 'error'
      default:
        return 'default'
    }
  }

  const formatDate = (timestamp: number): string => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return <Loader fullScreen text="Loading order confirmation..." />
  }

  if (error || !order) {
    return (
      <Container sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="h5" color="error" gutterBottom>
            {error || 'Order not found'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={() => navigate('/products')}
            sx={{ mt: 2 }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Success Message */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <CheckCircle
          sx={{
            fontSize: 80,
            color: theme.palette.success.main,
            mb: 2
          }}
        />
        <Typography variant="h3" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
          Order Placed Successfully!
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
          Thank you for your order. You will receive an email confirmation shortly.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Order Summary Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Order Number: {order.orderNumber}
                </Typography>
                <Chip
                  label={order.status}
                  color={getStatusColor(order.status)}
                  variant="outlined"
                />
              </Box>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Order Date: {formatDate(order.createdAtTimestamp)}
              </Typography>
              <Divider sx={{ my: 2 }} />

              {/* Order Items */}
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, mt: 2 }}>
                Order Items
              </Typography>
              <Paper variant="outlined" sx={{ mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell>Product</TableCell>
                      <TableCell align="right">Quantity</TableCell>
                      <TableCell align="right">Unit Price</TableCell>
                      <TableCell align="right">Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName}</TableCell>
                        <TableCell align="right">{item.quantity}</TableCell>
                        <TableCell align="right">₹{item.unitPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">₹{item.totalPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Paper>

              {/* Order Totals */}
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 3 }}>
                <Box>
                  <Typography variant="body2" color="textSecondary">Subtotal:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>₹{order.subtotal.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Tax:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>₹{order.taxAmount.toFixed(2)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="textSecondary">Shipping:</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>₹{order.shippingCost.toFixed(2)}</Typography>
                </Box>
                {order.discount > 0 && (
                  <Box>
                    <Typography variant="body2" color="textSecondary">Discount:</Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'bold', color: theme.palette.success.main }}>
                      -₹{order.discount.toFixed(2)}
                    </Typography>
                  </Box>
                )}
              </Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Total Amount:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
                  ₹{order.totalAmount.toFixed(2)}
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalShipping sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Shipping Address
                </Typography>
              </Box>
              <Typography variant="body2">
                {order.userFirstName} {order.userLastName}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                {order.shippingAddress}
              </Typography>
            </CardContent>
          </Card>

          {/* Billing Address */}
          <Card sx={{ mb: 3, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Payment sx={{ mr: 1, color: theme.palette.primary.main }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  Billing Address
                </Typography>
              </Box>
              <Typography variant="body2">
                {order.userFirstName} {order.userLastName}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ whiteSpace: 'pre-wrap', mt: 1 }}>
                {order.billingAddress}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Sidebar - Quick Actions */}
        <Grid item xs={12} md={4}>
          <Card sx={{ position: 'sticky', top: 20, border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
            <CardContent>
              <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 3 }}>
                What's Next?
              </Typography>

              {/* Order Status Info */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: alpha(theme.palette.info.main, 0.05), borderRadius: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <ShoppingBag sx={{ mr: 1, fontSize: 20, color: theme.palette.info.main }} />
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                    Status: {order.status}
                  </Typography>
                </Box>
                <Typography variant="caption" color="textSecondary">
                  We'll notify you when your order ships
                </Typography>
              </Box>

              {/* Confirmation Email */}
              <Box sx={{ mb: 3, p: 2, backgroundColor: alpha(theme.palette.success.main, 0.05), borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Confirmation Email Sent to:
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {order.userEmail}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Action Buttons */}
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => navigate('/orders')}
                sx={{ mb: 2 }}
              >
                View All Orders
              </Button>
              <Button
                fullWidth
                variant="outlined"
                color="primary"
                startIcon={<Home />}
                onClick={() => navigate('/products')}
              >
                Continue Shopping
              </Button>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  )
}
