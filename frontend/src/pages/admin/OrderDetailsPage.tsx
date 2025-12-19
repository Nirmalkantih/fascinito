import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Container,
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  CircularProgress,
  Divider,
  alpha,
  useTheme,
  Chip,
  Alert
} from '@mui/material'
import {
  ArrowBack,
  LocalShipping,
  Receipt,
  Payment as PaymentIcon,
  Person,
  LocalAtm
} from '@mui/icons-material'
import { toast } from 'react-toastify'
import api from '../../services/api'
import OrderStepper from '../../components/OrderStepper'
import RefundDialog from '../../components/RefundDialog'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

interface OrderItem {
  id: number
  productName: string
  productImage?: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface StatusHistory {
  id: number
  status: string
  notes?: string
  updatedBy?: string
  createdAtTimestamp: number
}

interface RefundInfo {
  id: number
  refundType: string
  refundAmount: number
  razorpayRefundId?: string
  refundStatus: string
  settlementExpectedDate?: string
  failureReason?: string
  createdAtTimestamp: number
}

interface OrderDetails {
  id: number
  orderNumber: string
  status: string
  subtotal: number
  taxAmount: number
  shippingCost: number
  discount: number
  totalAmount: number
  shippingAddress?: string
  billingAddress?: string
  notes?: string
  items: OrderItem[]
  statusHistory: StatusHistory[]
  createdAtTimestamp: number
  updatedAtTimestamp: number
  userEmail: string
  userFirstName: string
  userLastName: string
  cancellationReason?: string
  cancellationMessage?: string
  cancelledAtTimestamp?: number
  refundStatus?: string
  refundAmount?: number
  payment?: {
    id: number
    paymentMethod: string
    status: string
    amount: number
  }
  refund?: RefundInfo
}

export default function AdminOrderDetailsPage() {
  const { orderId } = useParams<{ orderId: string }>()
  const navigate = useNavigate()
  const theme = useTheme()
  const [order, setOrder] = useState<OrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)

  const getImageUrl = (imagePath: string | undefined) => {
    if (!imagePath) {
      return 'https://via.placeholder.com/50x50?text=No+Image'
    }
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath
    }
    const fullUrl = `${API_BASE_URL}${imagePath}`
    return fullUrl
  }

  useEffect(() => {
    fetchOrderDetails()
  }, [orderId])

  const fetchOrderDetails = async () => {
    try {
      setLoading(true)
      const data = await api.get(`/orders/${orderId}`)
      setOrder(data.data)
    } catch (error) {
      console.error('Error fetching order details:', error)
      toast.error('Failed to load order details')
    } finally {
      setLoading(false)
    }
  }

  const canProcessRefund = () => {
    return order && order.status === 'CANCELLED' && order.payment?.status === 'COMPLETED'
  }

  const getRefundStatusColor = (status?: string) => {
    switch (status?.toUpperCase()) {
      case 'SUCCESS':
        return 'success'
      case 'PROCESSING':
        return 'warning'
      case 'FAILED':
        return 'error'
      case 'PENDING':
        return 'info'
      case 'PENDING_SETTLEMENT':
        return 'info'
      default:
        return 'default'
    }
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Container>
    )
  }

  if (!order) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, py: 8, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary">
          Order not found
        </Typography>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin/orders')}
          sx={{ mt: 2 }}
        >
          Back to Orders
        </Button>
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Refund Dialog */}
      <RefundDialog
        open={refundDialogOpen}
        orderId={parseInt(orderId || '0')}
        paidAmount={order.payment?.amount || 0}
        onClose={() => setRefundDialogOpen(false)}
        onSuccess={() => fetchOrderDetails()}
      />

      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/admin/orders')}
          variant="outlined"
        >
          Back
        </Button>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight="bold">
            Order #{order.orderNumber}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Placed on {new Date(order.createdAtTimestamp).toLocaleString()}
          </Typography>
        </Box>
        {canProcessRefund() && (
          <Button
            startIcon={<LocalAtm />}
            onClick={() => setRefundDialogOpen(true)}
            color="primary"
            variant="contained"
          >
            Process Refund
          </Button>
        )}
      </Box>

      {/* Order Stepper */}
      <OrderStepper status={order.status} statusHistory={order.statusHistory} />

      {/* Cancellation Info */}
      {order.status === 'CANCELLED' && (
        <Alert severity="warning" sx={{ my: 3 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold">
              Order Cancelled
            </Typography>
            <Typography variant="body2">
              Reason: {order.cancellationReason || 'Not specified'}
            </Typography>
            {order.cancellationMessage && (
              <Typography variant="body2">
                Message: {order.cancellationMessage}
              </Typography>
            )}
            <Typography variant="caption" color="text.secondary">
              Cancelled on {order.cancelledAtTimestamp ? new Date(order.cancelledAtTimestamp).toLocaleString() : 'Unknown'}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Refund Status - Settlement Hold */}
      {order.refund?.refundStatus === 'PENDING_SETTLEMENT' && (
        <Alert severity="info" sx={{ my: 3, bgcolor: '#fff3cd', border: '1px solid #ffc107' }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#856404', mb: 1 }}>
              ⏳ Refund Scheduled
            </Typography>
            <Typography variant="body2" sx={{ color: '#856404', mb: 1 }}>
              Your refund will be automatically processed after payment settlement completes.
            </Typography>
            <Typography variant="body2" sx={{ color: '#856404', mb: 1 }}>
              <strong>{order.refund?.failureReason}</strong>
            </Typography>
            <Typography variant="caption" sx={{ color: '#856404' }}>
              You don't need to do anything - we'll handle this automatically.
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Refund Status - Failed */}
      {order.refund?.refundStatus === 'FAILED' && (
        <Alert severity="error" sx={{ my: 3 }}>
          <Box>
            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
              ❌ Refund Failed
            </Typography>
            <Typography variant="body2">
              {order.refund?.failureReason}
            </Typography>
          </Box>
        </Alert>
      )}

      {/* Refund Status - General */}
      {order.refundStatus && order.refundStatus !== 'NOT_REQUIRED' && order.refund?.refundStatus !== 'PENDING_SETTLEMENT' && order.refund?.refundStatus !== 'FAILED' && (
        <Paper elevation={0} sx={{ p: 3, mb: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}`, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <LocalAtm color="primary" />
            <Typography variant="h6" fontWeight="bold">
              Refund Status
            </Typography>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Status
              </Typography>
              <Chip
                label={order.refundStatus}
                color={getRefundStatusColor(order.refundStatus)}
                sx={{ mt: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Refund Amount
              </Typography>
              <Typography variant="h6" fontWeight="bold" color="primary">
                ${order.refundAmount?.toFixed(2)}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Typography variant="body2" color="text.secondary">
                Type
              </Typography>
              <Typography variant="body2" fontWeight="bold">
                {order.refund?.refundType || 'N/A'}
              </Typography>
            </Grid>
          </Grid>
          {order.refund?.razorpayRefundId && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Razorpay Refund ID: {order.refund.razorpayRefundId}
            </Typography>
          )}
        </Paper>
      )}

      {/* Order Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Person color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Customer
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {order.userFirstName} {order.userLastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {order.userEmail}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <LocalShipping color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Shipping Address
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {order.shippingAddress || 'Not provided'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card elevation={0} sx={{ border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <PaymentIcon color="primary" />
                <Typography variant="h6" fontWeight="bold">
                  Payment
                </Typography>
              </Box>
              {order.payment ? (
                <>
                  <Typography variant="body2" color="text.secondary">
                    Method: {order.payment.paymentMethod}
                  </Typography>
                  <Chip
                    label={order.payment.status}
                    size="small"
                    color={order.payment.status === 'COMPLETED' ? 'success' : 'warning'}
                    sx={{ mt: 1 }}
                  />
                </>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No payment information
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Order Items */}
      <Paper elevation={0} sx={{ p: 3, mb: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Receipt color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Order Items
          </Typography>
        </Box>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Product</TableCell>
              <TableCell align="center">Quantity</TableCell>
              <TableCell align="right">Unit Price</TableCell>
              <TableCell align="right">Total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <img
                      src={getImageUrl(item.productImage)}
                      alt={item.productName}
                      style={{
                        width: 50,
                        height: 50,
                        objectFit: 'cover',
                        borderRadius: 8,
                        border: '1px solid #e0e0e0'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.onerror = null
                        target.src = 'https://via.placeholder.com/50x50?text=No+Image'
                      }}
                    />
                    <Typography variant="body2">{item.productName}</Typography>
                  </Box>
                </TableCell>
                <TableCell align="center">{item.quantity}</TableCell>
                <TableCell align="right">${item.unitPrice.toFixed(2)}</TableCell>
                <TableCell align="right">
                  <Typography fontWeight="bold">
                    ${item.totalPrice.toFixed(2)}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Divider sx={{ my: 3 }} />

        {/* Price Breakdown */}
        <Box sx={{ maxWidth: 400, ml: 'auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Subtotal
            </Typography>
            <Typography variant="body2">${order.subtotal.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Tax
            </Typography>
            <Typography variant="body2">${order.taxAmount.toFixed(2)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Shipping
            </Typography>
            <Typography variant="body2">${order.shippingCost.toFixed(2)}</Typography>
          </Box>
          {order.discount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" color="success.main">
                Discount
              </Typography>
              <Typography variant="body2" color="success.main">
                -${order.discount.toFixed(2)}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography variant="h6" fontWeight="bold">
              Total
            </Typography>
            <Typography variant="h6" fontWeight="bold" color="primary.main">
              ${order.totalAmount.toFixed(2)}
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Order Notes */}
      {order.notes && (
        <Paper elevation={0} sx={{ p: 3, border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Order Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {order.notes}
          </Typography>
        </Paper>
      )}
    </Container>
  )
}
