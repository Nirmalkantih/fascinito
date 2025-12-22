import { useState, useEffect } from 'react'
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Chip,
  Paper,
  Button,
  alpha,
  useTheme
} from '@mui/material'
import { Visibility as ViewIcon } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { Loader } from '../../components/Loader'
import api from '../../services/api'
import PaginationComponent from '../../components/PaginationComponent'

interface OrderItem {
  id: number
  productName: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Order {
  id: number
  orderNumber: string
  status: string
  subtotal: number
  taxAmount: number
  shippingCost: number
  discount: number
  totalAmount: number
  createdAtTimestamp: number
  items: OrderItem[]
}

export default function Orders() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalElements, setTotalElements] = useState(0)

  useEffect(() => {
    fetchOrders()
  }, [page, rowsPerPage])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')

      if (!token) {
        navigate('/login')
        return
      }

      const data = await api.get(`/orders?page=${page}&size=${rowsPerPage}`)
      const ordersData = data.data?.content || []
      const total = data.data?.totalElements || 0
      // Backend now sorts by date descending, no need to sort on client
      setOrders(ordersData)
      setTotalElements(total)
    } catch (error) {
      console.error('Error fetching orders:', error)
      toast.error('Failed to load orders')
      setOrders([])
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
      month: 'short',
      day: 'numeric'
    })
  }

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="medium" variant="circular" text="Loading your orders..." />
      </Container>
    )
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold' }}>
          My Orders
        </Typography>
        <Typography variant="body1" color="textSecondary">
          View and manage your orders
        </Typography>
      </Box>

      {orders.length === 0 ? (
        <Card sx={{ border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}` }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography variant="h6" color="textSecondary" gutterBottom>
              No Orders Yet
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
              You haven't placed any orders yet. Start shopping now!
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Paper variant="outlined">
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 600 }}>Order #</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Items</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Total</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {orders.map((order) => (
                  <TableRow
                    key={order.id}
                    hover
                    sx={{
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.02)
                      }
                    }}
                  >
                    <TableCell sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
                      {order.orderNumber}
                    </TableCell>
                    <TableCell>{formatDate(order.createdAtTimestamp)}</TableCell>
                    <TableCell>{order.items.length} item(s)</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      ₹{order.totalAmount.toFixed(2)}
                    </TableCell>
                    <TableCell align="center">
                      <Chip
                        label={order.status}
                        color={getStatusColor(order.status)}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<ViewIcon />}
                        onClick={() => navigate(`/order-details/${order.id}`)}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Box sx={{ mt: 3 }}>
              <PaginationComponent
                page={page}
                rowsPerPage={rowsPerPage}
                totalElements={totalElements}
                onPageChange={(newPage) => handleChangePage(null, newPage)}
                onRowsPerPageChange={(newSize) => handleChangeRowsPerPage({ target: { value: newSize.toString() } } as any)}
                rowsPerPageOptions={[5, 10, 25]}
              />
            </Box>
          </Paper>
        </>
      )}
    </Container>
  )
}
