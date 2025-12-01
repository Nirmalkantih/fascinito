import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, Avatar, alpha, useTheme, Paper, Button, CircularProgress } from '@mui/material';
import { 
  Inventory, 
  Category, 
  Store, 
  LocationOn,
  ShoppingCart,
  People,
  TrendingUp,
  AttachMoney,
  LocalAtm,
  Refresh
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import api from '../../services/api';

export default function DashboardEnhanced() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
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
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching dashboard data...');
      // Add cache busting parameter
      const statsRes = await api.get(`/dashboard/stats?_t=${Date.now()}`);
      console.log('✅ Dashboard API Response (full):', statsRes);
      console.log('✅ Dashboard API Response.data:', statsRes.data);
      
      // API interceptor returns response.data, so statsRes is already { success, message, data, timestamp }
      const fetchedStats = statsRes.data || {};
      console.log('📊 Stats extracted:', fetchedStats);

      setStats({
        totalProducts: fetchedStats.totalProducts || 0,
        totalCategories: fetchedStats.totalCategories || 0,
        totalVendors: fetchedStats.totalVendors || 0,
        totalLocations: fetchedStats.totalLocations || 0,
        totalOrders: fetchedStats.totalOrders || 0,
        totalCustomers: fetchedStats.totalCustomers || 0,
        totalRevenue: fetchedStats.totalRevenue || 0,
        totalProfit: fetchedStats.totalProfit || 0,
        totalSpending: fetchedStats.totalSpending || 0
      });
      console.log('✅ Stats state updated:', {
        totalProducts: fetchedStats.totalProducts,
        totalCategories: fetchedStats.totalCategories,
        totalVendors: fetchedStats.totalVendors,
        totalLocations: fetchedStats.totalLocations
      });
    } catch (error: any) {
      console.error('❌ Error fetching dashboard data:', error);
      console.error('❌ Error details:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sales by location data
  const locationSalesData = [
    { name: 'Downtown Store', revenue: 45000, profit: 12000, spending: 33000 },
    { name: 'Mall Branch', revenue: 38000, profit: 9500, spending: 28500 },
    { name: 'Airport Shop', revenue: 52000, profit: 14500, spending: 37500 },
    { name: 'Suburban Center', revenue: 32000, profit: 5678, spending: 26322 },
    { name: 'City Square', revenue: 41000, profit: 4000, spending: 37000 },
  ];

  // Monthly trend data
  const monthlyTrendData = [
    { month: 'Jan', revenue: 32000, profit: 8000 },
    { month: 'Feb', revenue: 35000, profit: 9000 },
    { month: 'Mar', revenue: 38000, profit: 10000 },
    { month: 'Apr', revenue: 41000, profit: 11000 },
    { month: 'May', revenue: 44000, profit: 11500 },
    { month: 'Jun', revenue: 18000, profit: -4500 },
  ];

  // Category distribution
  const categoryDistribution = [
    { name: 'Electronics', value: 35 },
    { name: 'Clothing', value: 25 },
    { name: 'Food & Beverage', value: 20 },
    { name: 'Home & Garden', value: 12 },
    { name: 'Others', value: 8 },
  ];

  const COLORS = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a'];

  const statsData = [
    { 
      title: 'Total Products', 
      value: stats.totalProducts, 
      icon: <Inventory sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      change: '+12%'
    },
    { 
      title: 'Categories', 
      value: stats.totalCategories, 
      icon: <Category sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      change: '+5%'
    },
    { 
      title: 'Vendors', 
      value: stats.totalVendors, 
      icon: <Store sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      change: '+3%'
    },
    { 
      title: 'Locations', 
      value: stats.totalLocations, 
      icon: <LocationOn sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      change: '+2%'
    },
    { 
      title: 'Total Orders', 
      value: stats.totalOrders.toLocaleString(), 
      icon: <ShoppingCart sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      change: '+18%'
    },
    { 
      title: 'Customers', 
      value: stats.totalCustomers.toLocaleString(), 
      icon: <People sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
      change: '+24%'
    },
    { 
      title: 'Total Revenue', 
      value: `$${stats.totalRevenue.toLocaleString()}`, 
      icon: <AttachMoney sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
      change: '+32%'
    },
    { 
      title: 'Total Profit', 
      value: `$${stats.totalProfit.toLocaleString()}`, 
      icon: <TrendingUp sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
      change: '+15%'
    },
    { 
      title: 'Total Spending', 
      value: `$${stats.totalSpending.toLocaleString()}`, 
      icon: <LocalAtm sx={{ fontSize: 32 }} />,
      gradient: 'linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)',
      change: '+22%'
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 4 }}>
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
            Dashboard Overview
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome to your POS admin portal - Real-time business analytics
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
          onClick={fetchDashboardData}
          disabled={loading}
          sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            px: 3,
            py: 1.5,
            fontWeight: 600
          }}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Button>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsData.map((stat, index) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
            <Card sx={{ 
              background: stat.gradient,
              color: 'white',
              position: 'relative',
              overflow: 'hidden',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'translateY(-8px)',
                boxShadow: theme.shadows[20]
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -50,
                right: -50,
                width: 150,
                height: 150,
                borderRadius: '50%',
                background: alpha('#ffffff', 0.1)
              }
            }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9, mb: 1 }}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 700, mb: 0.5 }}>
                      {stat.value}
                    </Typography>
                    <Typography variant="caption" sx={{ 
                      bgcolor: alpha('#ffffff', 0.2),
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontWeight: 600
                    }}>
                      {stat.change} this month
                    </Typography>
                  </Box>
                  <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
                    {stat.icon}
                  </Avatar>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Sales by Location */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: theme.shadows[4] }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Revenue, Profit & Spending by Location
            </Typography>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={locationSalesData}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    boxShadow: theme.shadows[4]
                  }}
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="#667eea" radius={[8, 8, 0, 0]} />
                <Bar dataKey="profit" name="Profit" fill="#43e97b" radius={[8, 8, 0, 0]} />
                <Bar dataKey="spending" name="Spending" fill="#f5576c" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Category Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: theme.shadows[4], height: '100%' }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Product Distribution
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Monthly Trend */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: theme.shadows[4] }}>
            <Typography 
              variant="h5" 
              gutterBottom 
              sx={{ 
                fontWeight: 700,
                mb: 3,
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}
            >
              Monthly Revenue & Profit Trend
            </Typography>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.3)} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                />
                <YAxis 
                  tick={{ fill: theme.palette.text.secondary, fontSize: 12 }}
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 8,
                    boxShadow: theme.shadows[4]
                  }}
                  formatter={(value: any) => `$${value.toLocaleString()}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  name="Revenue" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="profit" 
                  name="Profit" 
                  stroke="#43e97b" 
                  strokeWidth={3}
                  dot={{ r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
