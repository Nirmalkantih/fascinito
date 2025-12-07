import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Button, TextField,
  MenuItem, Table, TableBody, TableCell, TableContainer, TableHead,
  TableRow, Chip, alpha, useTheme, CircularProgress, Tabs, Tab
} from '@mui/material';
import {
  Download, Print, TrendingUp, CalendarToday, AttachMoney, Inventory, Refresh
} from '@mui/icons-material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../../services/api';

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

export default function ReportsEnhanced() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [dateRange, setDateRange] = useState('last30days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [summary, setSummary] = useState({
    totalRevenue: 0, totalProfit: 0, totalOrders: 0,
    itemsSold: 0, avgOrderValue: 0, profitMargin: 0
  });
  
  const [salesData, setSalesData] = useState<any[]>([]);
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [categoryPerformance, setCategoryPerformance] = useState<any[]>([]);

  useEffect(() => { initializeDates(); }, [dateRange]);
  useEffect(() => { if (startDate && endDate) { fetchReportData(); } }, [startDate, endDate]);

  const initializeDates = () => {
    let end = new Date();
    let start = new Date();
    
    if (dateRange === 'today') start = new Date();
    else if (dateRange === 'yesterday') {
      start = new Date(end); start.setDate(start.getDate() - 1);
      end = new Date(); end.setDate(end.getDate() - 1);
    } else if (dateRange === 'last7days') start.setDate(start.getDate() - 7);
    else if (dateRange === 'last30days') start.setDate(start.getDate() - 30);
    else if (dateRange === 'thisMonth') start = new Date(end.getFullYear(), end.getMonth(), 1);
    else if (dateRange === 'lastMonth') {
      start = new Date(end.getFullYear(), end.getMonth() - 1, 1);
      end = new Date(end.getFullYear(), end.getMonth(), 0);
    } else if (dateRange === 'last3months') start.setMonth(start.getMonth() - 3);
    else if (dateRange === 'last6months') start.setMonth(start.getMonth() - 6);
    else if (dateRange === 'thisYear') start = new Date(end.getFullYear(), 0, 1);
    
    setStartDate(start.toISOString());
    setEndDate(end.toISOString());
  };

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const [summaryRes, salesRes, inventoryRes, categoryRes] = await Promise.all([
        api.get('/reports/summary?startDate=' + startDate + '&endDate=' + endDate),
        api.get('/reports/sales?startDate=' + startDate + '&endDate=' + endDate),
        api.get('/reports/inventory'),
        api.get('/reports/category-performance?startDate=' + startDate + '&endDate=' + endDate)
      ]);
      
      setSummary(summaryRes.data || {});
      setSalesData(salesRes.data || []);
      setInventoryData(inventoryRes.data || []);
      setCategoryPerformance(categoryRes.data || []);
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => { window.print(); };

  const handleExport = (type: string) => {
    let data: any[] = [];
    let filename = '';
    
    if (type === 'sales') { data = salesData; filename = 'sales-report.csv'; }
    else if (type === 'inventory') { data = inventoryData; filename = 'inventory-report.csv'; }
    else if (type === 'category') { data = categoryPerformance; filename = 'category-performance.csv'; }
    
    if (data.length === 0) { alert('No data to export'); return; }
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => Object.values(row).join(',')).join('\n');
    const csv = headers + '\n' + rows;
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
          <Typography variant="h3" gutterBottom sx={{ fontWeight: 700, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', mb: 1 }}>
            Business Reports
          </Typography>
          <Typography variant="body1" color="text.secondary">Generate and analyze comprehensive business reports</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={loading ? <CircularProgress size={20} /> : <Refresh />} onClick={fetchReportData} disabled={loading} sx={{ fontWeight: 600 }}>Refresh</Button>
          <Button variant="outlined" startIcon={<Print />} onClick={handlePrint} sx={{ fontWeight: 600 }}>Print</Button>
          <Button variant="contained" startIcon={<Download />} onClick={() => handleExport(['sales', 'inventory', 'category'][tabValue])} sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', fontWeight: 600 }}>Export CSV</Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField fullWidth select label="Date Range" value={dateRange} onChange={(e) => setDateRange(e.target.value)} InputProps={{ startAdornment: <CalendarToday sx={{ fontSize: 18, mr: 1, color: 'text.secondary' }} /> }}>
              <MenuItem value="today">Today</MenuItem>
              <MenuItem value="yesterday">Yesterday</MenuItem>
              <MenuItem value="last7days">Last 7 Days</MenuItem>
              <MenuItem value="last30days">Last 30 Days</MenuItem>
              <MenuItem value="thisMonth">This Month</MenuItem>
              <MenuItem value="lastMonth">Last Month</MenuItem>
              <MenuItem value="last3months">Last 3 Months</MenuItem>
              <MenuItem value="last6months">Last 6 Months</MenuItem>
              <MenuItem value="thisYear">This Year</MenuItem>
            </TextField>
          </Grid>
          <Grid item xs={12} md={8}>
            <Typography variant="body2" color="text.secondary">
              Showing data from {new Date(startDate).toLocaleDateString()} to {new Date(endDate).toLocaleDateString()}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { title: 'Total Revenue', value: summary.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sub: summary.totalOrders + ' orders', color: '#667eea', icon: AttachMoney },
          { title: 'Total Profit', value: summary.totalProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), sub: summary.profitMargin.toFixed(1) + '% margin', color: '#43e97b', icon: TrendingUp },
          { title: 'Items Sold', value: summary.itemsSold.toLocaleString(), sub: 'Avg: $' + summary.avgOrderValue.toFixed(2) + '/order', color: '#f093fb', icon: Inventory }
        ].map((card, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{ background: 'linear-gradient(135deg, ' + card.color + ' 0%, #764ba2 100%)', color: 'white' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" sx={{ opacity: 0.9 }}>{card.title}</Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, my: 1 }}>${card.value}</Typography>
                    <Typography variant="caption">{card.sub}</Typography>
                  </Box>
                  <card.icon sx={{ fontSize: 48, opacity: 0.8 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ borderRadius: 3, boxShadow: theme.shadows[4] }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Sales Report" />
            <Tab label="Inventory Report" />
            <Tab label="Category Performance" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3 }}>
            {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> :
            salesData.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      {['Date', 'Order #', 'Product', 'Category', 'Qty', 'Revenue', 'Profit'].map(h => <TableCell key={h} align={['Qty', 'Revenue', 'Profit'].includes(h) ? 'right' : 'left'} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {salesData.slice(0, 50).map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell>{new Date(row.date).toLocaleDateString()}</TableCell>
                        <TableCell><Chip label={row.orderNumber} size="small" /></TableCell>
                        <TableCell>{row.productName}</TableCell>
                        <TableCell><Chip label={row.categoryName} size="small" color="primary" variant="outlined" /></TableCell>
                        <TableCell align="right">{row.quantity}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>${row.revenue.toFixed(2)}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600, color: 'success.main' }}>${row.profit.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No sales data available.</Typography>}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3 }}>
            {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> :
            inventoryData.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                      {['Product', 'Category', 'Stock', 'Min Level', 'Value', 'Status'].map(h => <TableCell key={h} align={['Stock', 'Min Level', 'Value'].includes(h) ? 'right' : 'left'} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inventoryData.map((row, i) => (
                      <TableRow key={i} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{row.productName}</TableCell>
                        <TableCell><Chip label={row.categoryName} size="small" /></TableCell>
                        <TableCell align="right">{row.stockQuantity}</TableCell>
                        <TableCell align="right">{row.minStockLevel}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>${row.productValue.toFixed(2)}</TableCell>
                        <TableCell><Chip label={row.status} size="small" color={row.status === 'Critical' || row.status === 'Out of Stock' ? 'error' : row.status === 'Low Stock' ? 'warning' : 'success'} sx={{ fontWeight: 600 }} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No inventory data available.</Typography>}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Box sx={{ px: 3 }}>
            {loading ? <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box> :
            categoryPerformance.length > 0 ? (
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 3 }}>Revenue & Profit by Category</Typography>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={categoryPerformance}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="categoryName" />
                      <YAxis tickFormatter={(v) => '$' + (v / 1000).toFixed(0) + 'k'} />
                      <Tooltip formatter={(v: any) => '$' + v.toFixed(2)} />
                      <Legend />
                      <Bar dataKey="revenue" fill="#667eea" name="Revenue" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="profit" fill="#43e97b" name="Profit" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Grid>
                <Grid item xs={12}>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.05) }}>
                          {['Category', 'Sales Count', 'Revenue', 'Profit', 'Margin %'].map(h => <TableCell key={h} align={h === 'Category' ? 'left' : 'right'} sx={{ fontWeight: 700 }}>{h}</TableCell>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {categoryPerformance.map((row, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{row.categoryName}</TableCell>
                            <TableCell align="right">{row.salesCount}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>${row.revenue.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ color: 'success.main', fontWeight: 600 }}>${row.profit.toFixed(2)}</TableCell>
                            <TableCell align="right"><Chip label={row.profitMargin.toFixed(1) + '%'} size="small" color={row.profitMargin >= 25 ? 'success' : 'warning'} sx={{ fontWeight: 600 }} /></TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              </Grid>
            ) : <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No category performance data available.</Typography>}
          </Box>
        </TabPanel>
      </Paper>
    </Box>
  );
}
