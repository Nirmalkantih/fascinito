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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  Typography,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  useTheme,
  alpha,
  Pagination
} from '@mui/material'
import { Edit, Delete, Add, Download, Visibility } from '@mui/icons-material'
import { toast } from 'react-toastify'
import invoiceService, { InvoiceTemplate, InvoiceTemplateRequest } from '../../services/invoiceService'

export default function InvoiceTemplates() {
  const theme = useTheme()
  const [templates, setTemplates] = useState<InvoiceTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [page, setPage] = useState(0)
  const [pageSize] = useState(10)
  const [totalPages, setTotalPages] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const [formData, setFormData] = useState<InvoiceTemplateRequest>({
    templateId: '',
    name: '',
    description: '',
    templateType: 'REGULAR',
    subject: '',
    headerColor: '#667eea',
    footerNote: '',
    logoUrl: '',
    bannerUrl: '',
    showFestivalBanner: false,
    active: true
  })

  useEffect(() => {
    fetchTemplates()
  }, [page, searchQuery])

  const fetchTemplates = async () => {
    try {
      setLoading(true)
      const data = searchQuery
        ? await invoiceService.searchTemplates(searchQuery, page, pageSize)
        : await invoiceService.getAllTemplates(page, pageSize)
      setTemplates(data.content || [])
      setTotalPages(data.totalPages || 0)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to fetch templates')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenDialog = (template?: InvoiceTemplate) => {
    if (template) {
      setEditingId(template.id)
      setFormData({
        templateId: template.templateId,
        name: template.name,
        description: template.description,
        templateType: template.templateType,
        subject: template.subject,
        headerColor: template.headerColor,
        footerNote: template.footerNote,
        logoUrl: template.logoUrl,
        bannerUrl: template.bannerUrl,
        showFestivalBanner: template.showFestivalBanner,
        active: template.active
      })
    } else {
      setEditingId(null)
      setFormData({
        templateId: '',
        name: '',
        description: '',
        templateType: 'REGULAR',
        subject: '',
        headerColor: '#667eea',
        footerNote: '',
        logoUrl: '',
        bannerUrl: '',
        showFestivalBanner: false,
        active: true
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingId(null)
  }

  const handleSaveTemplate = async () => {
    if (!formData.templateId || !formData.name || !formData.subject) {
      toast.error('Please fill in all required fields')
      return
    }

    try {
      setLoading(true)
      if (editingId) {
        await invoiceService.updateTemplate(editingId, formData)
        toast.success('Template updated successfully')
      } else {
        await invoiceService.createTemplate(formData)
        toast.success('Template created successfully')
      }
      handleCloseDialog()
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save template')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTemplate = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) return

    try {
      setLoading(true)
      await invoiceService.deleteTemplate(id)
      toast.success('Template deleted successfully')
      fetchTemplates()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete template')
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    const colors: any = {
      REGULAR: 'primary',
      FESTIVAL: 'warning',
      PROMOTIONAL: 'success',
      VIP: 'error'
    }
    return colors[type] || 'default'
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
            Invoice Templates
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage custom invoice templates for different occasions
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          New Template
        </Button>
      </Box>

      {loading && templates.length === 0 ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <Paper sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search templates..."
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
                  <TableCell sx={{ fontWeight: 'bold' }}>Template ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', textAlign: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {templates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                      <Typography color="text.secondary">No templates found</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  templates.map((template) => (
                    <TableRow key={template.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {template.templateId}
                        </Typography>
                      </TableCell>
                      <TableCell>{template.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={template.templateType}
                          color={getTypeColor(template.templateType)}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {template.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={template.active ? 'Active' : 'Inactive'}
                          color={template.active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell sx={{ textAlign: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(template)}
                          title="Edit"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteTemplate(template.id)}
                          color="error"
                          title="Delete"
                        >
                          <Delete fontSize="small" />
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
                onChange={(e, value) => setPage(value - 1)}
              />
            </Box>
          )}
        </>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingId ? 'Edit Invoice Template' : 'Create New Invoice Template'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Template ID (Unique)"
              value={formData.templateId}
              onChange={(e) => setFormData({ ...formData, templateId: e.target.value })}
              placeholder="e.g., FESTIVAL_DIWALI"
              fullWidth
              required
              disabled={editingId !== null}
            />

            <TextField
              label="Template Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              fullWidth
              required
            />

            <TextField
              label="Description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              fullWidth
              multiline
              rows={2}
            />

            <Select
              label="Template Type"
              value={formData.templateType}
              onChange={(e) => setFormData({ ...formData, templateType: e.target.value as any })}
              fullWidth
            >
              <MenuItem value="REGULAR">Regular</MenuItem>
              <MenuItem value="FESTIVAL">Festival</MenuItem>
              <MenuItem value="PROMOTIONAL">Promotional</MenuItem>
              <MenuItem value="VIP">VIP</MenuItem>
            </Select>

            <TextField
              label="Email Subject"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              fullWidth
              required
            />

            <Box>
              <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                Header Color
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.headerColor}
                  onChange={(e) => setFormData({ ...formData, headerColor: e.target.value })}
                  style={{ width: 60, height: 40, cursor: 'pointer', border: 'none', borderRadius: 4 }}
                />
                <TextField
                  value={formData.headerColor}
                  onChange={(e) => setFormData({ ...formData, headerColor: e.target.value })}
                  size="small"
                  sx={{ flex: 1 }}
                />
              </Box>
            </Box>

            <TextField
              label="Footer Note"
              value={formData.footerNote}
              onChange={(e) => setFormData({ ...formData, footerNote: e.target.value })}
              fullWidth
              multiline
              rows={2}
              placeholder="e.g., Happy Diwali from Fascinito!"
            />

            <TextField
              label="Logo URL"
              value={formData.logoUrl}
              onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
              fullWidth
              placeholder="https://example.com/logo.png"
            />

            <TextField
              label="Banner URL"
              value={formData.bannerUrl}
              onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
              fullWidth
              placeholder="https://example.com/banner.png"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.showFestivalBanner}
                  onChange={(e) => setFormData({ ...formData, showFestivalBanner: e.target.checked })}
                />
              }
              label="Show Festival Banner on Invoice"
            />

            <FormControlLabel
              control={
                <Checkbox
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSaveTemplate} variant="contained" disabled={loading}>
            {editingId ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
