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
  Chip,
  IconButton,
  CircularProgress,
  TextField,
  useTheme,
  alpha,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material'
import { Download, Email, Refresh, Visibility as Eye } from '@mui/icons-material'
// Type cast for icon compatibility
const RefreshCw = Refresh
import { toast } from 'react-toastify'
import invoiceService, { Invoice } from '../../services/invoiceService'

export default function Invoices() {
  const theme = useTheme()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [openPreview, setOpenPreview] = useState(false)

  useEffect(() => {
    fetchInvoices()
  }, [page, searchQuery])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const data = searchQuery
        ? await invoiceService.searchInvoices(searchQuery, page, pageSize)
        : await invoiceService.getAllInvoices(page, pageSize)
      setInvoices(data.content || [])
      setTotalPages(data.totalPages || 0)
    } catch (error: any) {
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

  const handleResendEmail = async (invoiceId: number) => {
    if (!window.confirm('Are you sure you want to resend the invoice email?')) return

    try {
      setLoading(true)
      await invoiceService.resendInvoiceEmail(invoiceId)
      toast.success('Invoice email sent successfully')
      fetchInvoices()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend email')
    } finally {
      setLoading(false)
    }
  }

  const handleRegenerateInvoice = async (invoiceId: number) => {
    if (!window.confirm('Are you sure you want to regenerate this invoice?')) return

    try {
      setLoading(true)
      await invoiceService.regenerateInvoice(invoiceId)
      toast.success('Invoice regenerated successfully')
      fetchInvoices()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to regenerate invoice')
    } finally {
      setLoading(false)
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
          Invoices
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage and track all generated invoices
        </Typography>
      </Box>

      {loading && invoices.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search by invoice number, order number, or customer name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setPage(0)
              }}
              sx={{ p: 2 }}
              variant="outlined"
              size="small"
            />
          </Paper>

          <TableContainer component={Paper}>
            <Table>
              <TableHead sx={{ backgroundColor: alpha(theme.palette.primary.main, 0.1) }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Invoice #</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Order #</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Customer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Template</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Generated Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Email Sent</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No invoices found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((invoice) => (
                    <TableRow key={invoice.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {invoice.invoiceNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{invoice.orderNumber}</TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.customerName}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {invoice.customerEmail}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {invoice.templateName || '-'}
                        </Typography>
                      </TableCell>
                      <TableCell>{formatDate(invoice.generatedAt)}</TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.emailSent ? 'Sent' : 'Not Sent'}
                          color={invoice.emailSent ? 'success' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedInvoice(invoice)
                            setOpenPreview(true)
                          }}
                          title="Preview"
                        >
                          <Eye fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadInvoice(invoice)}
                          title="Download"
                        >
                          <Download fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleResendEmail(invoice.id)}
                          title="Resend Email"
                        >
                          <Email fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleRegenerateInvoice(invoice.id)}
                          title="Regenerate"
                        >
                          <RefreshCw fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
              <Pagination
                count={totalPages}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
              />
            </Box>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Invoice Preview</DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {selectedInvoice && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Invoice Number
                </Typography>
                <Typography variant="h6">{selectedInvoice.invoiceNumber}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Order
                </Typography>
                <Typography variant="body2">{selectedInvoice.orderNumber}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Customer
                </Typography>
                <Typography variant="body2">{selectedInvoice.customerName}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {selectedInvoice.customerEmail}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Template
                </Typography>
                <Typography variant="body2">{selectedInvoice.templateName || '-'}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Generated
                </Typography>
                <Typography variant="body2">
                  {new Date(selectedInvoice.generatedAt).toLocaleString('en-IN')}
                </Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Email Status
                </Typography>
                <Chip
                  label={selectedInvoice.emailSent ? 'Sent' : 'Not Sent'}
                  color={selectedInvoice.emailSent ? 'success' : 'warning'}
                  size="small"
                />
              </Box>

              {selectedInvoice.emailSentAt && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Sent At
                  </Typography>
                  <Typography variant="body2">
                    {new Date(selectedInvoice.emailSentAt).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              )}

              {selectedInvoice.regeneratedCount > 0 && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Regenerated Count
                  </Typography>
                  <Typography variant="body2">{selectedInvoice.regeneratedCount}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Close</Button>
          {selectedInvoice && (
            <Button
              onClick={() => {
                handleDownloadInvoice(selectedInvoice)
                setOpenPreview(false)
              }}
              variant="contained"
              startIcon={<Download />}
            >
              Download
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Container>
  )
}
