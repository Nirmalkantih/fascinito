import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  alpha,
  useTheme,
  Avatar,
  Chip,
  Stack,
  TextField,
  MenuItem
} from '@mui/material';
import {
  Assessment,
  Download,
  TrendingUp,
  Inventory,
  ShoppingCart,
  AttachMoney,
  CalendarToday
} from '@mui/icons-material';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function Reports() {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('thisMonth');

  // Mock data for sales reports
  const salesData = [
    { id: 1, date: '2025-10-01', product: 'Laptop Pro', category: 'Electronics', quantity: 5, revenue: 7500, profit: 1500 },
    { id: 2, date: '2025-10-02', product: 'Office Chair', category: 'Furniture', quantity: 10, revenue: 2500, profit: 750 },
    { id: 3, date: '2025-10-03', product: 'Smartphone X', category: 'Electronics', quantity: 15, revenue: 15000, profit: 3000 },
    { id: 4, date: '2025-10-04', product: 'Desk Lamp', category: 'Home', quantity: 20, revenue: 800, profit: 240 },
    { id: 5, date: '2025-10-05', product: 'Keyboard Pro', category: 'Electronics', quantity: 12, revenue: 1800, profit: 540 },
  ];

  // Mock data for inventory reports
  const inventoryData = [
    { id: 1, product: 'Laptop Pro', category: 'Electronics', stock: 45, reorderLevel: 10, value: 67500, status: 'In Stock' },
    { id: 2, product: 'Office Chair', category: 'Furniture', stock: 8, reorderLevel: 15, value: 2000, status: 'Low Stock' },
    { id: 3, product: 'Smartphone X', category: 'Electronics', stock: 125, reorderLevel: 20, value: 125000, status: 'In Stock' },
    { id: 4, product: 'Desk Lamp', category: 'Home', stock: 3, reorderLevel: 10, value: 120, status: 'Critical' },
    { id: 5, product: 'Keyboard Pro', category: 'Electronics', stock: 89, reorderLevel: 15, value: 13350, status: 'In Stock' },
  ];

  // Mock data for profit analysis
  const profitTrendData = [
    { month: 'May', revenue: 44000, profit: 11500, margin: 26.1 },
    { month: 'Jun', revenue: 38000, profit: 9500, margin: 25.0 },
    { month: 'Jul', revenue: 42000, profit: 10500, margin: 25.0 },
    { month: 'Aug', revenue: 48000, profit: 13000, margin: 27.1 },
    { month: 'Sep', revenue: 52000, profit: 14500, margin: 27.9 },
    { month: 'Oct', revenue: 27590, profit: 6230, margin: 22.6 },
  ];

  // Mock data for category performance
  const categoryPerformance = [
    { category: 'Electronics', sales: 85, revenue: 127500, profit: 31875 },
    { category: 'Furniture', sales: 42, revenue: 45200, profit: 9040 },
    { category: 'Home & Garden', sales: 67, revenue: 34800, profit: 8700 },
    { category: 'Clothing', sales: 125, revenue: 28500, profit: 7125 },
    { category: 'Food & Beverage', sales: 234, revenue: 18900, profit: 4725 },
  ];

  const handleExport = (reportType: string) => {
    alert(`Exporting ${reportType} report... (Feature coming soon)`);
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h3" 
          gutterBottom 
          sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}
        >
          Reports & Analytics
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Comprehensive business insights and detailed reports
        </Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Sales</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>$254,700</Typography>
                  <Typography variant="caption">This month</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
                  <ShoppingCart sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Total Profit</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>$61,315</Typography>
                  <Typography variant="caption">24.1% margin</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
                  <TrendingUp sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Items Sold</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>1,247</Typography>
                  <Typography variant="caption">+18% vs last month</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
                  <Inventory sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white'
          }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="body2" sx={{ opacity: 0.9 }}>Avg Order Value</Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>$204</Typography>
                  <Typography variant="caption">+12% improvement</Typography>
                </Box>
                <Avatar sx={{ bgcolor: alpha('#ffffff', 0.2), width: 56, height: 56 }}>
                  <AttachMoney sx={{ fontSize: 28 }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reports Tabs */}
      <Paper sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}>
        <Box sx={{ 
          borderBottom: 1, 
          borderColor: 'divider',
          px: 3,
          pt: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Sales Report" icon={<ShoppingCart />} iconPosition="start" />
            <Tab label="Inventory Report" icon={<Inventory />} iconPosition="start" />
            <Tab label="Profit Analysis" icon={<TrendingUp />} iconPosition="start" />
            <Tab label="Category Performance" icon={<Assessment />} iconPosition="start" />
          </Tabs>

          <Stack direction="row" spacing={2} sx={{ pb: 1 }}>
            <TextField
              select
              size="small"
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              sx={{ minWidth: 150 }}
              InputProps={{
                startAdornment: <CalendarToday sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} />
              }}
            >
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="thisWeek">This Week</MenuItem>
              <MenuItem value="thisMonth">This Month</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="thisYear">This Year</MenuItem>
            </TextField>

            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => handleExport(['Sales', 'Inventory', 'Profit', 'Category'][tabValue])}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                fontWeight: 600
              }}
            >
              Export
            </Button>
          </Stack>
        </Box>

        {/* Sales Report */}
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Quantity</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Revenue</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Profit</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {salesData.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                      <TableCell>{row.product}</TableCell>
                      <TableCell>
                        <Chip label={row.category} size="small" />
                      </TableCell>
                      <TableCell align="right">{row.quantity}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>${row.revenue.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>
                        ${row.profit.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Inventory Report */}
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3 }}>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                    <TableCell sx={{ fontWeight: 700 }}>Product</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Stock</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Reorder Level</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Value</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventoryData.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.product}</TableCell>
                      <TableCell>
                        <Chip label={row.category} size="small" />
                      </TableCell>
                      <TableCell align="right">{row.stock}</TableCell>
                      <TableCell align="right">{row.reorderLevel}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>${row.value.toLocaleString()}</TableCell>
                      <TableCell>
                        <Chip 
                          label={row.status}
                          size="small"
                          color={
                            row.status === 'Critical' ? 'error' :
                            row.status === 'Low Stock' ? 'warning' : 'success'
                          }
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </TabPanel>

        {/* Profit Analysis */}
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Profit Trend (Last 6 Months)
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={profitTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => `$${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#667eea" strokeWidth={3} name="Revenue" />
                    <Line type="monotone" dataKey="profit" stroke="#43e97b" strokeWidth={3} name="Profit" />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Profit Margins
                </Typography>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                        <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Revenue</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Profit</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>Margin %</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {profitTrendData.map((row) => (
                        <TableRow key={row.month} hover>
                          <TableCell sx={{ fontWeight: 600 }}>{row.month}</TableCell>
                          <TableCell align="right">${row.revenue.toLocaleString()}</TableCell>
                          <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>
                            ${row.profit.toLocaleString()}
                          </TableCell>
                          <TableCell align="right">
                            <Chip 
                              label={`${row.margin}%`}
                              size="small"
                              color={row.margin >= 25 ? 'success' : 'warning'}
                              sx={{ fontWeight: 600 }}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>

        {/* Category Performance */}
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ px: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>
                  Revenue & Profit by Category
                </Typography>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={categoryPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
                    <Tooltip 
                      formatter={(value: any) => `$${value.toLocaleString()}`}
                      contentStyle={{
                        backgroundColor: theme.palette.background.paper,
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#667eea" name="Revenue" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="profit" fill="#43e97b" name="Profit" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>

              <Grid item xs={12} lg={4}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  Top Categories
                </Typography>
                <Stack spacing={2}>
                  {categoryPerformance.map((cat, index) => (
                    <Card key={cat.category} sx={{ 
                      bgcolor: alpha(theme.palette.primary.main, 0.02),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                    }}>
                      <CardContent sx={{ py: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            #{index + 1} {cat.category}
                          </Typography>
                          <Chip label={`${cat.sales} sales`} size="small" color="primary" />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Revenue: ${cat.revenue.toLocaleString()}
                        </Typography>
                        <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                          Profit: ${cat.profit.toLocaleString()}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              </Grid>
            </Grid>
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}
