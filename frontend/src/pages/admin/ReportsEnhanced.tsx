import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  alpha,
  useTheme,
  Divider
} from '@mui/material';
import {
  Download,
  Print,
  TrendingUp,
  TrendingDown,
  CalendarToday,
  AttachMoney,
  Inventory,
  People
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export default function ReportsEnhanced() {
  const theme = useTheme();
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState('last30days');

  // Sample report data
  const salesData = [
    { date: '2025-10-01', sales: 4500, orders: 12 },
    { date: '2025-10-08', sales: 5200, orders: 15 },
    { date: '2025-10-15', sales: 4800, orders: 13 },
    { date: '2025-10-22', sales: 6100, orders: 18 },
    { date: '2025-10-26', sales: 5500, orders: 16 },
  ];

  const topProducts = [
    { name: 'Product A', sold: 145, revenue: 14500, profit: 4350 },
    { name: 'Product B', sold: 128, revenue: 12800, profit: 3840 },
    { name: 'Product C', sold: 102, revenue: 10200, profit: 3060 },
    { name: 'Product D', sold: 95, revenue: 9500, profit: 2850 },
    { name: 'Product E', sold: 87, revenue: 8700, profit: 2610 },
  ];

  const summary = [
    {
      title: 'Total Revenue',
      value: '$52,900',
      change: '+15.3%',
      trend: 'up',
      icon: <AttachMoney />,
      color: '#43e97b'
    },
    {
      title: 'Total Orders',
      value: '74',
      change: '+12.1%',
      trend: 'up',
      icon: <TrendingUp />,
      color: '#667eea'
    },
    {
      title: 'Products Sold',
      value: '557',
      change: '+8.5%',
      trend: 'up',
      icon: <Inventory />,
      color: '#f093fb'
    },
    {
      title: 'New Customers',
      value: '28',
      change: '+22.4%',
      trend: 'up',
      icon: <People />,
      color: '#4facfe'
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
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
            Business Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Generate and analyze comprehensive business reports
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<Print />}
            sx={{ fontWeight: 600 }}
          >
            Print
          </Button>
          <Button 
            variant="contained" 
            startIcon={<Download />}
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              fontWeight: 600
            }}
          >
            Export
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <MenuItem value="sales">Sales Report</MenuItem>
              <MenuItem value="inventory">Inventory Report</MenuItem>
              <MenuItem value="customer">Customer Report</MenuItem>
              <MenuItem value="financial">Financial Report</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              select
              label="Date Range"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              InputProps={{
                startAdornment: <CalendarToday sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="last7days">Last 7 Days</MenuItem>
              <MenuItem value="last30days">Last 30 Days</MenuItem>
              <MenuItem value="last90days">Last 90 Days</MenuItem>
              <MenuItem value="thisyear">This Year</MenuItem>
              <MenuItem value="custom">Custom Range</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={4}>
            <Button 
              fullWidth 
              variant="contained" 
              sx={{ 
                height: '100%',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600
              }}
            >
              Generate Report
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {summary.map((item, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card sx={{
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
                    bgcolor: alpha(item.color, 0.1),
                    color: item.color,
                    display: 'flex'
                  }}>
                    {item.icon}
                  </Box>
                  <Chip
                    icon={item.trend === 'up' ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    label={item.change}
                    color={item.trend === 'up' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {item.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.title}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        {/* Sales Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Sales & Orders Trend
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#667eea" 
                  strokeWidth={3}
                  name="Sales ($)"
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

        {/* Top Products Chart */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Top Products Revenue
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip />
                <Bar dataKey="revenue" fill="#667eea" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Top Products Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Top Performing Products
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <TableContainer>
              <Table>
                <TableHead sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>#</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Product Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Units Sold</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Revenue</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Profit</TableCell>
                    <TableCell sx={{ fontWeight: 700 }} align="right">Margin</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {topProducts.map((product, index) => {
                    const margin = ((product.profit / product.revenue) * 100).toFixed(1);
                    return (
                      <TableRow key={index}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {product.name}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{product.sold}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="primary">
                            ${product.revenue.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" fontWeight={700} color="success.main">
                            ${product.profit.toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip 
                            label={`${margin}%`} 
                            color="success" 
                            size="small"
                            sx={{ fontWeight: 600 }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
