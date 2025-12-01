import { useState } from 'react';
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
  Chip,
  Button,
  TextField,
  InputAdornment,
  Grid,
  Card,
  CardContent,
  alpha,
  useTheme,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Search,
  FilterList,
  ShoppingCart,
  CheckCircle,
  LocalShipping,
  Cancel,
  Visibility,
  AttachMoney
} from '@mui/icons-material';

interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  items: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  date: string;
}

export default function OrdersEnhanced() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Sample orders data (in production, this would come from API)
  const [orders] = useState<Order[]>([
    {
      id: 1,
      orderNumber: 'ORD-2025-001',
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      items: 3,
      total: 299.99,
      status: 'delivered',
      date: '2025-10-20'
    },
    {
      id: 2,
      orderNumber: 'ORD-2025-002',
      customerName: 'Jane Smith',
      customerEmail: 'jane@example.com',
      items: 5,
      total: 549.50,
      status: 'shipped',
      date: '2025-10-22'
    },
    {
      id: 3,
      orderNumber: 'ORD-2025-003',
      customerName: 'Bob Johnson',
      customerEmail: 'bob@example.com',
      items: 2,
      total: 159.99,
      status: 'processing',
      date: '2025-10-24'
    },
    {
      id: 4,
      orderNumber: 'ORD-2025-004',
      customerName: 'Alice Brown',
      customerEmail: 'alice@example.com',
      items: 1,
      total: 89.99,
      status: 'pending',
      date: '2025-10-25'
    },
    {
      id: 5,
      orderNumber: 'ORD-2025-005',
      customerName: 'Charlie Wilson',
      customerEmail: 'charlie@example.com',
      items: 4,
      total: 399.99,
      status: 'cancelled',
      date: '2025-10-23'
    },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'success';
      case 'shipped':
        return 'info';
      case 'processing':
        return 'warning';
      case 'pending':
        return 'default';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle fontSize="small" />;
      case 'shipped':
        return <LocalShipping fontSize="small" />;
      case 'processing':
        return <ShoppingCart fontSize="small" />;
      case 'cancelled':
        return <Cancel fontSize="small" />;
      default:
        return null;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerEmail?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
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
      value: orders.filter(o => o.status === 'pending').length,
      icon: <ShoppingCart />,
      color: '#9e9e9e'
    },
    {
      title: 'Processing',
      value: orders.filter(o => o.status === 'processing').length,
      icon: <ShoppingCart />,
      color: '#ff9800'
    },
    {
      title: 'Delivered',
      value: orders.filter(o => o.status === 'delivered').length,
      icon: <CheckCircle />,
      color: '#43e97b'
    },
    {
      title: 'Total Revenue',
      value: `$${orders.reduce((sum, o) => o.status !== 'cancelled' ? sum + o.total : sum, 0).toFixed(2)}`,
      icon: <AttachMoney />,
      color: '#f093fb'
    },
  ];

  return (
    <Box>
      <Typography 
        variant="h3" 
        gutterBottom 
        sx={{ 
          fontWeight: 700,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 1
        }}
      >
        Orders Management
      </Typography>
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
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
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
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant={statusFilter === 'all' ? 'contained' : 'outlined'}
                onClick={() => setStatusFilter('all')}
                startIcon={<FilterList />}
                size="small"
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'contained' : 'outlined'}
                onClick={() => setStatusFilter('pending')}
                size="small"
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'processing' ? 'contained' : 'outlined'}
                onClick={() => setStatusFilter('processing')}
                size="small"
                color="warning"
              >
                Processing
              </Button>
              <Button
                variant={statusFilter === 'shipped' ? 'contained' : 'outlined'}
                onClick={() => setStatusFilter('shipped')}
                size="small"
                color="info"
              >
                Shipped
              </Button>
              <Button
                variant={statusFilter === 'delivered' ? 'contained' : 'outlined'}
                onClick={() => setStatusFilter('delivered')}
                size="small"
                color="success"
              >
                Delivered
              </Button>
            </Box>
          </Grid>
        </Grid>
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
                        {order.customerName}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {order.customerEmail}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{order.items}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color="primary">
                      ${order.total.toFixed(2)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      {...(getStatusIcon(order.status) && { icon: getStatusIcon(order.status)! })}
                      label={order.status.toUpperCase()}
                      color={getStatusColor(order.status) as any}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <Tooltip title="View Details">
                      <IconButton size="small" color="primary">
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
