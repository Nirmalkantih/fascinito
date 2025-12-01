import { useState, useEffect } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  InputAdornment,
  Grid,
  Avatar,
  alpha,
  Slide,
  useTheme,
} from '@mui/material'
import { TransitionProps } from '@mui/material/transitions'
import {
  Add,
  Edit,
  Delete,
  Search,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material'
import { useToast } from '../../contexts/ToastContext'
import api from '../../services/api'
import React from 'react'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Helper function to construct proper image URL
const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return ''

  // If it's an external URL (starts with http/https), use as-is
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl
  }

  // If it's a relative path (starts with /), prepend API base URL
  if (imageUrl.startsWith('/')) {
    return `${API_BASE_URL}${imageUrl}`
  }

  // Otherwise assume it's an API path
  return `${API_BASE_URL}/${imageUrl}`
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />
})

interface Banner {
  id: number
  title: string
  subtitle: string
  imageUrl: string
  backgroundColor: string
  textColor: string
  ctaUrl: string
  displayOrder: number
  active: boolean
  createdAt: string
  updatedAt: string
}

interface BannerForm {
  title: string
  subtitle: string
  imageUrl: string
  backgroundColor: string
  textColor: string
  ctaUrl: string
  displayOrder: number
  active: boolean
}

export default function Banners() {
  const theme = useTheme()
  const { showSuccess, showError } = useToast()
  const [banners, setBanners] = useState<Banner[]>([])
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [totalElements, setTotalElements] = useState(0)
  const [search, setSearch] = useState('')
  const [openDialog, setOpenDialog] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [formData, setFormData] = useState<BannerForm>({
    title: '',
    subtitle: '',
    imageUrl: '',
    backgroundColor: '#667eea',
    textColor: '#ffffff',
    ctaUrl: '',
    displayOrder: 0,
    active: true,
  })

  // Fetch banners
  const fetchBanners = async () => {
    try {
      const response: any = await api.get(
        `/banners?page=${page}&size=${rowsPerPage}&sortBy=displayOrder&sortDir=asc`
      )
      // Note: api.ts response interceptor returns response.data directly
      setBanners(response.content || [])
      setTotalElements(response.totalElements || 0)
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch banners')
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [page, rowsPerPage])

  const handlePageChange = (_event: unknown, newPage: number) => {
    setPage(newPage)
  }

  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleOpenDialog = (banner?: Banner) => {
    if (banner) {
      setEditingBanner(banner)
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle,
        imageUrl: banner.imageUrl,
        backgroundColor: banner.backgroundColor,
        textColor: banner.textColor,
        ctaUrl: banner.ctaUrl,
        displayOrder: banner.displayOrder,
        active: banner.active,
      })
    } else {
      setEditingBanner(null)
      setFormData({
        title: '',
        subtitle: '',
        imageUrl: '',
        backgroundColor: '#667eea',
        textColor: '#ffffff',
        ctaUrl: '',
        displayOrder: banners.length,
        active: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingBanner(null)
  }

  const handleSubmit = async () => {
    if (!formData.title) {
      showError('Banner title is required')
      return
    }
    if (!formData.imageUrl) {
      showError('Banner image is required')
      return
    }

    try {
      if (editingBanner) {
        await api.put(`/banners/${editingBanner.id}`, formData)
        showSuccess('Banner updated successfully')
      } else {
        await api.post('/banners', formData)
        showSuccess('Banner created successfully')
      }
      handleCloseDialog()
      fetchBanners()
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to save banner')
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this banner?')) {
      try {
        await api.delete(`/banners/${id}`)
        showSuccess('Banner deleted successfully')
        fetchBanners()
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to delete banner')
      }
    }
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      showError('File must be an image')
      return
    }

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      showError('File size must not exceed 5MB')
      return
    }

    // Validate image dimensions
    const img = new Image()
    img.onload = async () => {
      const width = img.naturalWidth
      const height = img.naturalHeight
      const minWidth = 800
      const minHeight = 300

      // Check minimum dimensions - REQUIRED
      if (width < minWidth || height < minHeight) {
        showError(
          `Image dimensions are too small. Current: ${width}x${height}px. ` +
          `Minimum required: ${minWidth}x${minHeight}px. ` +
          `Recommended: 1200x500px for best appearance.`
        )
        event.target.value = ''
        return
      }

      // Proceed with upload
      try {
        setUploadingImage(true)
        const formDataWithFile = new FormData()
        formDataWithFile.append('file', file)

        const response = await api.post('/products/upload-image', formDataWithFile, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        })

        const uploadResponse = response as any
        const imageUrl = uploadResponse.data?.url || uploadResponse?.url
        setFormData((prev) => ({ ...prev, imageUrl }))
        showSuccess(`Image uploaded successfully (${width}x${height}px)`)
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || error.message || 'Unknown error'
        showError(`Failed to upload image: ${errorMessage}`)
      } finally {
        setUploadingImage(false)
        event.target.value = ''
      }
    }

    img.onerror = () => {
      showError('Failed to load image. Please check the file.')
      event.target.value = ''
    }

    img.src = URL.createObjectURL(file)
  }

  const handleFormChange = (field: keyof BannerForm, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleMoveUp = async (banner: Banner) => {
    if (banner.displayOrder === 0) return

    try {
      const newOrder = banner.displayOrder - 1
      await api.patch(`/banners/${banner.id}/order?displayOrder=${newOrder}`)
      showSuccess('Banner order updated')
      fetchBanners()
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update order')
    }
  }

  const handleMoveDown = async (banner: Banner) => {
    try {
      const newOrder = banner.displayOrder + 1
      await api.patch(`/banners/${banner.id}/order?displayOrder=${newOrder}`)
      showSuccess('Banner order updated')
      fetchBanners()
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to update order')
    }
  }

  const totalBanners = totalElements
  const activeBanners = banners.filter((b) => b.active).length

  return (
    <Box>
      {/* Header with Stats */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box>
            <Typography
              variant="h4"
              gutterBottom
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Banner Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage carousel banners for the homepage
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{ boxShadow: theme.shadows[8] }}
          >
            Add Banner
          </Button>
        </Box>

        {/* Stats Cards */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Total Banners
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                {totalBanners}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Active
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.success.main }}>
                {activeBanners}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Inactive
              </Typography>
              <Typography variant="h4" sx={{ fontWeight: 700, color: theme.palette.warning.main }}>
                {totalBanners - activeBanners}
              </Typography>
            </Paper>
          </Grid>
        </Grid>
      </Box>

      {/* Search Bar */}
      <Paper sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search banners..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'text.secondary' }} />
              </InputAdornment>
            ),
          }}
          sx={{ p: 1 }}
        />
      </Paper>

      {/* Banners Table */}
      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ bgcolor: alpha(theme.palette.primary.main, 0.08) }}>
              <TableCell sx={{ fontWeight: 700 }}>Order</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Image</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'center' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {banners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ textAlign: 'center', py: 3 }}>
                  <Typography color="text.secondary">No banners found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              banners.map((banner) => (
                <TableRow key={banner.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 600 }}>{banner.displayOrder + 1}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <IconButton
                          size="small"
                          onClick={() => handleMoveUp(banner)}
                          disabled={banner.displayOrder === 0}
                        >
                          <ArrowUpward fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleMoveDown(banner)}>
                          <ArrowDownward fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Avatar
                      src={getImageUrl(banner.imageUrl)}
                      alt={banner.title}
                      variant="rounded"
                      sx={{ width: 60, height: 60 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>{banner.title}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {banner.subtitle}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={banner.active ? 'Active' : 'Inactive'}
                      color={banner.active ? 'success' : 'warning'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleOpenDialog(banner)}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDelete(banner.id)}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalElements}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handlePageChange}
          onRowsPerPageChange={handleRowsPerPageChange}
        />
      </TableContainer>

      {/* Dialog for Create/Edit Banner */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        TransitionComponent={Transition}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editingBanner ? 'Edit Banner' : 'Create New Banner'}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Box sx={{ display: 'grid', gap: 3 }}>
            {/* Image Upload Section */}
            <Box sx={{ border: `2px dashed ${theme.palette.primary.main}`, borderRadius: 2, p: 2, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                📸 Banner Image
              </Typography>

              {/* Image Size Requirements */}
              <Box sx={{ mb: 2, p: 2, bgcolor: 'white', borderRadius: 1, border: `1px solid ${alpha(theme.palette.info.main, 0.3)}` }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1, color: theme.palette.info.main }}>
                  ✓ Image Size Requirements:
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, fontWeight: 600, color: theme.palette.success.main }}>
                  ✓ <strong>Minimum Required:</strong> 800 × 300px (Absolute minimum)
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  • <strong>Recommended:</strong> 1200 × 500px (Best quality and appearance)
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  • <strong>Ideal Aspect Ratio:</strong> 2.4:1 (e.g., 1200×500px)
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
                  • <strong>File Size:</strong> Maximum 5MB (PNG or JPG format)
                </Typography>
                <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', fontStyle: 'italic', mt: 1 }}>
                  💡 Larger images display better in the carousel! Minimum 800px width will be accepted.
                </Typography>
              </Box>

              {/* Preview */}
              {formData.imageUrl && (
                <Box sx={{ mb: 2, textAlign: 'center' }}>
                  <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                    Preview:
                  </Typography>
                  <img
                    src={getImageUrl(formData.imageUrl)}
                    alt="Banner preview"
                    style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: '8px', objectFit: 'cover', border: `2px solid ${theme.palette.primary.main}` }}
                  />
                </Box>
              )}

              <Button variant="outlined" component="label" fullWidth sx={{ fontWeight: 600 }}>
                {uploadingImage ? 'Uploading...' : '📤 Click to Upload Image'}
                <input hidden accept="image/*" type="file" onChange={handleImageUpload} />
              </Button>
            </Box>

            {/* Title and Subtitle */}
            <TextField
              label="Banner Title"
              fullWidth
              value={formData.title}
              onChange={(e) => handleFormChange('title', e.target.value)}
              placeholder="e.g., Summer Collection 2025"
            />

            <TextField
              label="Banner Subtitle"
              fullWidth
              multiline
              rows={2}
              value={formData.subtitle}
              onChange={(e) => handleFormChange('subtitle', e.target.value)}
              placeholder="e.g., Up to 50% OFF on Selected Items"
            />

            {/* Colors */}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Background Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 1,
                      bgcolor: formData.backgroundColor,
                      border: `2px solid ${theme.palette.divider}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'color'
                      input.value = formData.backgroundColor
                      input.onchange = (e: any) => {
                        handleFormChange('backgroundColor', e.target.value)
                      }
                      input.click()
                    }}
                  />
                  <TextField
                    size="small"
                    value={formData.backgroundColor}
                    onChange={(e) => handleFormChange('backgroundColor', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  Text Color
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: 1,
                      bgcolor: formData.textColor,
                      border: `2px solid ${theme.palette.divider}`,
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      const input = document.createElement('input')
                      input.type = 'color'
                      input.value = formData.textColor
                      input.onchange = (e: any) => {
                        handleFormChange('textColor', e.target.value)
                      }
                      input.click()
                    }}
                  />
                  <TextField
                    size="small"
                    value={formData.textColor}
                    onChange={(e) => handleFormChange('textColor', e.target.value)}
                    sx={{ flex: 1 }}
                  />
                </Box>
              </Box>
            </Box>

            {/* CTA URL */}
            <TextField
              label="Call-to-Action URL (Optional)"
              fullWidth
              value={formData.ctaUrl}
              onChange={(e) => handleFormChange('ctaUrl', e.target.value)}
              placeholder="e.g., /products or https://example.com"
            />

            {/* Status */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontWeight: 600 }}>Status:</Typography>
              <Chip
                label={formData.active ? 'Active' : 'Inactive'}
                color={formData.active ? 'success' : 'warning'}
                onClick={() => handleFormChange('active', !formData.active)}
                variant="outlined"
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {editingBanner ? 'Update' : 'Create'} Banner
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
