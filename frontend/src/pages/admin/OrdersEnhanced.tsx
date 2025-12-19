import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  alpha,
  useTheme,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  Search,
  FilterList,
  ShoppingCart,
  CheckCircle,
  Visibility,
  AttachMoney,
  Refresh
} from '@mui/icons-material';
import api from '../../services/api';
import { usePermissions } from '../../hooks/usePermissions';
import OrderStatusDropdown from '../../components/OrderStatusDropdown';

interface Order {
  id: number;
  orderNumber: string;
  userFirstName: string;
  userLastName: string;
  userEmail: string;
  items: any[];
  totalAmount: number;
  status: string;
  createdAtTimestamp: number;
}

export default function OrdersEnhanced() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/orders/admin/all?size=100');
      const fetchedOrders = response.data.content || [];
      setOrders(fetchedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter(order => {
    const customerName = `${order.userFirstName} ${order.userLastName}`;
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const orderStatus = order.status?.toLowerCase();
    const matchesStatus = statusFilter === 'all' || orderStatus === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      title: 'Total Orders',
      value: orders.length,
      icon: <ShoppingCart />,
      color: '#667eea'
    },
    {
      title: 'Pending',
      value: orders.filter(o => o.status?.toLowerCase() === 'pending').length,
      icon: <ShoppingCart />,
      color: '#9e9e9e'
    },
    {
      title: 'Processing',
      value: orders.filter(o => o.status?.toLowerCase() === 'processing').length,
      icon: <ShoppingCart />,
      color: '#ff9800'
    },
    {
      title: 'Delivered',
      value: orders.filter(o => o.status?.toLowerCase() === 'delivered').length,
      icon: <CheckCircle />,
      color: '#43e97b'
    },
    {
      title: 'Total Revenue',
      value: `$${orders.reduce((sum, o) => o.status?.toLowerCase() !== 'cancelled' ? sum + (o.totalAmount || 0) : sum, 0).toFixed(2)}`,
      icon: <AttachMoney />,
      color: '#f093fb',
      adminOnly: true
    },
  ].filter(stat => !stat.adminOnly || isAdmin());

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography 
          variant="h3" 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Orders Management
        </Typography>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
          onClick={fetchOrders}
          disabled={loading}
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            px: 3,
            py: 1.5,
            fontWeight: 600
          }}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </Button>
      </Box>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Track and manage all customer orders
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat, index) => (
          <Grid item xs={12} sm={6} md={2.4} key={index}>
            <Card sx={{
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[10]
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: alpha(stat.color, 0.1),
                    color: stat.color,
                    display: 'flex'
                  }}>
                    {stat.icon}
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={700}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stat.title}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ flex: '1 1 300px', minWidth: '250px' }}>
            <TextField
              fullWidth
              placeholder="Search by order number, customer name, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'nowrap', alignItems: 'center', overflowX: 'auto', minWidth: 0 }}>
            <Button
              variant={statusFilter === 'all' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('all')}
              startIcon={<FilterList />}
              size="small"
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              All
            </Button>
            <Button
              variant={statusFilter === 'pending' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('pending')}
              size="small"
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Pending
            </Button>
            <Button
              variant={statusFilter === 'processing' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('processing')}
              size="small"
              color="warning"
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Processing
            </Button>
            <Button
              variant={statusFilter === 'shipped' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('shipped')}
              size="small"
              color="info"
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Shipped
            </Button>
            <Button
              variant={statusFilter === 'delivered' ? 'contained' : 'outlined'}
              onClick={() => setStatusFilter('delivered')}
              size="small"
              color="success"
              sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}
            >
              Delivered
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Orders Table */}
      <TableContainer component={Paper} sx={{ boxShadow: theme.shadows[5] }}>
        <Table>
          <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Order Number</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Customer</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Items</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                  <Typography variant="h6" color="text.secondary">
                    No orders found
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  sx={{ 
                    '&:hover': { 
                      bgcolor: alpha(theme.palette.primary.main, 0.02) 
                    }
                  }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>
                      {order.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>
                        {order.userFirstName} {order.userLastName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.userEmail}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{order.items?.length || 0}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="primary">
                      ${(order.totalAmount || 0).toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <OrderStatusDropdown
                      orderId={order.id}
                      currentStatus={order.status}
                      onStatusUpdate={() => fetchOrders()}
                    />
                  </TableCell>
                  <TableCell>{new Date(order.createdAtTimestamp).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {filteredOrders.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredOrders.length} of {orders.length} orders
          </Typography>
        </Box>
      )}
    </Box>
  );
}
