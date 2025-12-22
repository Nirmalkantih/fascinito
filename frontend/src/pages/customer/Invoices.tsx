import { useState, useEffect } from 'react'
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  TextField,
  useTheme,
  alpha,
  Pagination,
  Card,
  CardContent,
  Grid
} from '@mui/material'
import { Download, FileText } from '@mui/icons-material'
import { toast } from 'react-toastify'
import invoiceService, { Invoice } from '../../services/invoiceService'

export default function CustomerInvoices() {
  const theme = useTheme()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)

  useEffect(() => {
    fetchInvoices()
  }, [page])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const data = await invoiceService.getMyInvoices(page, pageSize)
      setInvoices(data.content || [])
      setTotalPages(data.totalPages || 0)
    } catch (error: any) {
      console.error('Error fetching invoices:', error)
      toast.error(error.response?.data?.message || 'Failed to fetch invoices')
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      window.open(invoice.fileUrl, '_blank')
      toast.success('Opening invoice PDF')
    } catch (error) {
      toast.error('Failed to download invoice')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: '2-digit'
    })
  }

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02), minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
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
            My Invoices
          </Typography>
          <Typography variant="h6" color="text.secondary">
            View and download all your order invoices
          </Typography>
        </Box>

        {loading && invoices.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : invoices.length === 0 ? (
          <Card sx={{ textAlign: 'center', py: 8 }}>
            <FileText sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Invoices Yet
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your invoices will appear here as soon as you place orders
            </Typography>
          </Card>
        ) : (
          <>
            {/* Grid View - Desktop */}
            <Grid container spacing={3} sx={{ mb: 4, display: { xs: 'none', md: 'grid' } }}>
              {invoices.map((invoice) => (
                <Grid item xs={12} sm={6} md={4} key={invoice.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: theme.shadows[10]
                      }
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FileText sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {invoice.invoiceNumber}
                        </Typography>
                      </Box>

                      <Box sx={{ mb: 2, pb: 2, borderBottom: '1px solid #eee' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          Order: {invoice.orderNumber}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Date: {formatDate(invoice.generatedAt)}
                        </Typography>
                      </Box>

                      {invoice.templateName && (
                        <Typography variant="caption" color="primary" sx={{ display: 'block', mb: 1 }}>
                          Template: {invoice.templateName}
                        </Typography>
                      )}

                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Download />}
                        onClick={() => handleDownloadInvoice(invoice)}
                        sx={{ mt: 2 }}
                      >
                        Download Invoice
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>

            {/* Table View - Mobile */}
            <Box sx={{ display: { xs: 'block', md: 'none' } }}>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Invoice</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Order</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.map((invoice) => (
                      <TableRow key={invoice.id}>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {invoice.invoiceNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>{invoice.orderNumber}</TableCell>
                        <TableCell>{formatDate(invoice.generatedAt)}</TableCell>
                        <TableCell>
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadInvoice(invoice)}
                            color="primary"
                          >
                            <Download fontSize="small" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page + 1}
                  onChange={(e, value) => setPage(value - 1)}
                />
              </Box>
            )}
          </>
        )}
      </Container>
    </Box>
  )
}
