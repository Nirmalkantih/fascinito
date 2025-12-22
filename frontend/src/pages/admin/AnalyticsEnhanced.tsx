import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  alpha,
  useTheme
} from '@mui/material';
import { Loader } from '../../components/Loader';
import {
  TrendingUp,
  TrendingDown,
  AttachMoney,
  ShoppingCart,
  Inventory,
  People
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../../services/api';

interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  totalVendors: number;
  totalLocations: number;
  totalOrders: number;
  totalCustomers: number;
  totalRevenue: number;
  totalProfit: number;
  totalSpending: number;
}

export default function AnalyticsEnhanced() {
  const theme = useTheme();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalCategories: 0,
    totalVendors: 0,
    totalLocations: 0,
    totalOrders: 0,
    totalCustomers: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalSpending: 0
  });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/stats');
      setStats(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Sample monthly data (in real app, this would come from backend)
  const monthlyData = [
    { month: 'Jan', revenue: 32000, orders: 45, profit: 8000 },
    { month: 'Feb', revenue: 35000, orders: 52, profit: 9000 },
    { month: 'Mar', revenue: 38000, orders: 61, profit: 10000 },
    { month: 'Apr', revenue: 41000, orders: 58, profit: 11000 },
    { month: 'May', revenue: 44000, orders: 67, profit: 11500 },
    { month: 'Jun', revenue: 48000, orders: 73, profit: 12500 },
  ];

  // Category performance
  const categoryData = [
    { name: 'Electronics', value: 35, sales: 15000 },
    { name: 'Clothing', value: 25, sales: 10500 },
    { name: 'Food', value: 20, sales: 8500 },
    { name: 'Home', value: 12, sales: 5000 },
    { name: 'Others', value: 8, sales: 3500 },
  ];

  // Top products (sample data)
  const topProducts = [
    { name: 'Product A', sales: 120, revenue: 12000 },
    { name: 'Product B', sales: 98, revenue: 9800 },
    { name: 'Product C', sales: 87, revenue: 8700 },
    { name: 'Product D', sales: 76, revenue: 7600 },
    { name: 'Product E', sales: 65, revenue: 6500 },
  ];

  const COLORS = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

  const metricsData = [
    {
      title: 'Revenue Growth',
      value: '+28.5%',
      trend: 'up',
      color: '#43e97b',
      icon: <AttachMoney />
    },
    {
      title: 'Order Volume',
      value: '+18.2%',
      trend: 'up',
      color: '#667eea',
      icon: <ShoppingCart />
    },
    {
      title: 'Customer Growth',
      value: '+24.1%',
      trend: 'up',
      color: '#f093fb',
      icon: <People />
    },
    {
      title: 'Product Performance',
      value: '+12.3%',
      trend: 'up',
      color: '#4facfe',
      icon: <Inventory />
    },
  ];

  if (loading) {
    return (
      <Box sx={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader size="medium" variant="circular" text="Loading analytics..." />
      </Box>
    );
  }

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
        Analytics & Insights
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Comprehensive business performance analytics
      </Typography>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {metricsData.map((metric, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{ 
              height: '100%',
              transition: 'all 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.shadows[10]
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                  <Box sx={{ 
                    p: 1.5, 
                    borderRadius: 2, 
                    bgcolor: alpha(metric.color, 0.1),
                    color: metric.color
                  }}>
                    {metric.icon}
                  </Box>
                  <Chip
                    icon={metric.trend === 'up' ? <TrendingUp /> : <TrendingDown />}
                    label={metric.value}
                    color={metric.trend === 'up' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  {metric.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Revenue Trend */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Revenue & Orders Trend
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  name="Revenue ($)"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="orders" 
                  stroke="#43e97b" 
                  strokeWidth={3}
                  name="Orders"
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Category Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Products */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Top Performing Products
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="sales" fill="#667eea" name="Units Sold" />
                <Bar dataKey="revenue" fill="#43e97b" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Monthly Profit */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Monthly Profit Analysis
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="profit" fill="#f093fb" name="Profit ($)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Current Stats Summary */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Current Business Summary
            </Typography>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {stats.totalProducts}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Products
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {stats.totalCustomers}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Customers
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    {stats.totalOrders}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" fontWeight={700} color="primary">
                    ${stats.totalRevenue.toLocaleString()}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Revenue
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
