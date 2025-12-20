import { useState, useEffect } from 'react'
import {
  Typography,
  Button,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  TextField,
  InputAdornment,
  alpha,
  useTheme,
  Avatar
} from '@mui/material'
import PaginationComponent from '../../components/PaginationComponent'
import {
  Add,
  Edit,
  Delete,
  Search,
  Visibility
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useToast } from '../../contexts/ToastContext'
import api from '../../services/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Helper function to construct proper image URL
const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return 'https://via.placeholder.com/60'

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

interface Product {
  id: number
  title: string
  categoryId: number
  regularPrice: number
  salePrice?: number
  stockQuantity: number
  trackInventory?: boolean
  inStock?: boolean
  active: boolean
  variations?: Array<{
    id: number
    type: string
    options: Array<{
      id: number
      name: string
      stockQuantity: number
    }>
  }>
  imageUrls?: string[]
  images?: Array<{ url: string; altText?: string }>
}

export default function AdminProducts() {
  const navigate = useNavigate()
  const theme = useTheme()
  const { showSuccess, showError } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [products, setProducts] = useState<Product[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [page, rowsPerPage, searchQuery])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data: any = await api.get('/products', {
        params: {
          page,
          size: rowsPerPage,
          search: searchQuery || undefined,
        },
      })
      setProducts(data.content || [])
      setTotalElements(data.totalElements || 0)
    } catch (error: any) {
      showError(error.response?.data?.message || 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await api.delete(`/products/${id}`)
        showSuccess('Product deleted successfully')
        fetchProducts()
      } catch (error: any) {
        showError(error.response?.data?.message || 'Failed to delete product')
      }
    }
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Box>
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
            Products Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Manage your product catalog
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          startIcon={<Add />}
          onClick={() => navigate('/admin/products/new')}
          sx={{
            px: 3,
            py: 1.5,
            fontSize: '1rem',
            fontWeight: 600,
            boxShadow: theme.shadows[10],
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[20]
            }
          }}
        >
          Add New Product
        </Button>
      </Box>

      {/* Search Bar */}
      <Box sx={{ mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search products by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{
            bgcolor: 'white',
            borderRadius: 2,
            maxWidth: 600
          }}
        />
      </Box>

      {/* Products Table */}
      <TableContainer
        component={Paper}
        sx={{
          boxShadow: theme.shadows[10],
          borderRadius: 3,
          overflow: 'hidden'
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}
            >
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                Product
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                Category
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                Price
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                Stock
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>
                Status
              </TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 700, fontSize: '1rem' }} align="center">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center">Loading...</TableCell>
              </TableRow>
            ) : products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center">No products found</TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow
                  key={product.id}
                  sx={{
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.05)
                    },
                    '&:nth-of-type(odd)': {
                      bgcolor: alpha(theme.palette.primary.main, 0.02)
                    }
                  }}
                >
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      {(() => {
                        // Extract first image from either imageUrls or images array
                        let firstImageUrl = ''
                        if (product.imageUrls && product.imageUrls.length > 0) {
                          firstImageUrl = product.imageUrls[0]
                        } else if (product.images && product.images.length > 0) {
                          firstImageUrl = product.images[0].url
                        }
                        return (
                          <Avatar
                            src={getImageUrl(firstImageUrl)}
                            alt={product.title}
                            variant="rounded"
                            sx={{ width: 60, height: 60 }}
                          />
                        )
                      })()}
                      <Typography sx={{ fontWeight: 600 }}>{product.title}</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={product.categoryId || 'Uncategorized'}
                      size="small"
                      sx={{
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        color: theme.palette.primary.main,
                        fontWeight: 600
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography sx={{ fontWeight: 700, color: theme.palette.primary.main }}>
                        ₹{product.regularPrice?.toFixed(2)}
                      </Typography>
                      {product.salePrice && product.salePrice < product.regularPrice && (
                        <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                          ₹{product.salePrice.toFixed(2)}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {/* Show inventory tracking status */}
                      {product.trackInventory ? (
                        <Box>
                          <Chip
                            label={`${product.stockQuantity || 0} units`}
                            size="small"
                            color={
                              !product.inStock
                                ? 'error'
                                : product.stockQuantity > 20
                                ? 'success'
                                : product.stockQuantity > 5
                                ? 'warning'
                                : 'warning'
                            }
                            sx={{ fontWeight: 600, mb: 0.5 }}
                          />
                          {/* Show variation info if exists */}
                          {product.variations && product.variations.length > 0 && (
                            <Box sx={{ mt: 1 }}>
                              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', fontWeight: 600 }}>
                                Variations: {product.variations.length}
                              </Typography>
                              {product.variations.map((variation) => {
                                const totalVariationStock = variation.options.reduce(
                                  (sum, opt) => sum + (opt.stockQuantity || 0),
                                  0
                                );
                                return (
                                  <Typography key={variation.id} variant="caption" sx={{ color: 'text.secondary', display: 'block', fontSize: '0.7rem' }}>
                                    {variation.type}: {totalVariationStock} total
                                  </Typography>
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      ) : (
                        <Chip
                          label="Inventory Tracking Disabled"
                          size="small"
                          variant="outlined"
                          sx={{ fontWeight: 600, color: 'text.secondary' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={product.active ? 'ACTIVE' : 'INACTIVE'}
                      size="small"
                      color={product.active ? 'success' : 'default'}
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <IconButton
                        size="small"
                        sx={{
                          color: theme.palette.info.main,
                          '&:hover': { bgcolor: alpha(theme.palette.info.main, 0.1) }
                        }}
                      >
                        <Visibility fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => navigate(`/admin/products/edit/${product.id}`)}
                        sx={{
                          color: theme.palette.primary.main,
                          '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                        }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(product.id)}
                        sx={{
                          color: theme.palette.error.main,
                          '&:hover': { bgcolor: alpha(theme.palette.error.main, 0.1) }
                        }}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Box sx={{ mt: 3 }}>
        <PaginationComponent
          page={page}
          rowsPerPage={rowsPerPage}
          totalElements={totalElements}
          onPageChange={(newPage) => setPage(newPage)}
          onRowsPerPageChange={(newSize) => {
            setRowsPerPage(newSize);
            setPage(0);
          }}
        />
      </Box>
    </Box>
  )
}
