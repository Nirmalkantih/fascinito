import { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  TextField,
  InputAdornment,
  Chip,
  Skeleton,
  Pagination,
  alpha,
  useTheme
} from '@mui/material'
import { Search, ShoppingCart, Favorite, FavoriteBorder } from '@mui/icons-material'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import LazyImage from '../../components/LazyImage'
import { useWishlist } from '../../contexts/WishlistContext'
import api from '../../services/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Helper function to construct proper image URL
const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return 'https://via.placeholder.com/400x300?text=No+Image'

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
  slug: string
  title?: string
  name?: string
  description: string
  price?: number
  regularPrice?: number
  salePrice?: number
  imageUrl?: string
  images?: any[]
  categoryName?: string
  category?: string
  stockQuantity?: number
  inStock?: boolean
  active?: boolean
  visibleToCustomers?: boolean
}

export default function Products() {
  const navigate = useNavigate()
  const theme = useTheme()
  const [searchParams] = useSearchParams()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [categoryFilter] = useState(searchParams.get('category') || '')
  const [page, setPage] = useState(1)
  const [allProducts, setAllProducts] = useState<Product[]>([])

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        // Fetch only active and visible products
        const response = await api.get('/products?page=0&size=1000&active=true&visibleToCustomers=true')
        // Handle both ApiResponse wrapper and direct PageResponse
        const data = response.data || response
        const products = data.data?.content || data.content || []

        // Ensure imageUrl is set from images array if not directly present
        const productsWithImages = products.map((product: Product) => {
          let imageUrl = product.imageUrl

          // If no imageUrl, try to get from images array
          if (!imageUrl && product.images && product.images.length > 0) {
            const firstImage = product.images[0]
            // Handle both object with url property and string
            imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url
          }

          return {
            ...product,
            imageUrl
          }
        })

        setAllProducts(productsWithImages)
      } catch (error) {
        console.error('Error fetching products:', error)
        setAllProducts([])
      } finally {
        setLoading(false)
      }
    }
    fetchProducts()
  }, [])

  // Filter products based on search query and category
  const filteredProducts = allProducts.filter(product => {
    // Check category filter
    const productCategory = (product.categoryName || product.category || '').toLowerCase()
    if (categoryFilter && productCategory !== categoryFilter.toLowerCase()) {
      return false
    }

    // Check search query
    if (searchQuery) {
      const productName = (product.title || product.name || '').toLowerCase()
      const productDesc = (product.description || '').toLowerCase()
      return (
        productName.includes(searchQuery.toLowerCase()) ||
        productCategory.includes(searchQuery.toLowerCase()) ||
        productDesc.includes(searchQuery.toLowerCase())
      )
    }

    return true
  })

  // Paginate filtered products
  const paginatedProducts = filteredProducts.slice((page - 1) * 12, page * 12)
  const totalFilteredPages = Math.ceil(filteredProducts.length / 12)


  // Reset to page 1 when search changes
  useEffect(() => {
    setPage(1)
  }, [searchQuery])

  const toggleFavorite = async (productId: number) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to add to wishlist')
        return
      }

      const isFavorited = isInWishlist(productId)
      const url = `/wishlist/${productId}`

      if (isFavorited) {
        await api.delete(url)
        removeFromWishlist(productId)
      } else {
        await api.post(url)
        addToWishlist(productId)
      }

      toast.success(isFavorited ? 'Removed from wishlist' : 'Added to wishlist')
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || 'Failed to update wishlist'
      console.error('Error updating wishlist:', error)
      toast.error(errorMessage)
    }
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
            Discover Products
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Browse our collection of amazing products
          </Typography>
        </Box>

        {/* Search Bar */}
        <Box sx={{ mb: 4 }}>
          <TextField
            fullWidth
            placeholder="Search products..."
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
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: theme.palette.primary.main
                }
              }
            }}
          />
        </Box>

        {/* Products Grid */}
        <Grid container spacing={3}>
          {loading
            ? Array.from({ length: 12 }).map((_, index) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                  <Card>
                    <Skeleton variant="rectangular" height={200} />
                    <CardContent>
                      <Skeleton variant="text" height={32} />
                      <Skeleton variant="text" />
                      <Skeleton variant="text" width="60%" />
                    </CardContent>
                  </Card>
                </Grid>
              ))
            : paginatedProducts.map((product) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease-in-out',
                      cursor: 'pointer',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[20],
                        '& .product-image': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                  >
                    {/* Favorite Button */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        bgcolor: 'white',
                        borderRadius: '50%',
                        width: 40,
                        height: 40,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: theme.shadows[5],
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          transform: 'scale(1.1)',
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(product.id)
                      }}
                    >
                      {isInWishlist(product.id) ? (
                        <Favorite sx={{ color: theme.palette.error.main }} />
                      ) : (
                        <FavoriteBorder />
                      )}
                    </Box>

                    {/* Product Image */}
                    <Box
                      sx={{ overflow: 'hidden', height: 200, cursor: 'pointer' }}
                      onClick={() => navigate(`/products/${product.slug}`)}
                    >
                      <LazyImage
                        src={getImageUrl(product.imageUrl || '')}
                        alt={product.title || product.name || 'Product'}
                        height={200}
                        objectFit="cover"
                        className="product-image"
                        style={{ transition: 'transform 0.3s ease-in-out' }}
                      />
                    </Box>

                    {/* Product Info */}
                    <CardContent
                      sx={{ flexGrow: 1, pb: 1, cursor: 'pointer' }}
                      onClick={() => navigate(`/products/${product.slug}`)}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography
                          variant="h6"
                          sx={{
                            fontWeight: 600,
                            fontSize: '1.1rem',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            flex: 1
                          }}
                        >
                          {product.title || product.name || 'Product'}
                        </Typography>
                      </Box>

                      {(product.categoryName || product.category) && (
                        <Chip
                          label={(product.categoryName || product.category) as string}
                          size="small"
                          sx={{
                            mb: 1,
                            height: 24,
                            fontSize: '0.75rem',
                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                            color: theme.palette.primary.main
                          }}
                        />
                      )}

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          mb: 2,
                          minHeight: 40
                        }}
                      >
                        {product.description}
                      </Typography>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {product.regularPrice && product.salePrice && product.regularPrice > product.salePrice ? (
                          <>
                            <Typography
                              variant="h6"
                              sx={{
                                fontWeight: 700,
                                color: theme.palette.primary.main,
                                fontSize: '1.3rem'
                              }}
                            >
                              ₹{product.salePrice.toFixed(2)}
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{
                                textDecoration: 'line-through',
                                color: 'text.secondary',
                                fontSize: '0.9rem'
                              }}
                            >
                              ₹{product.regularPrice.toFixed(2)}
                            </Typography>
                          </>
                        ) : (
                          <Typography
                            variant="h6"
                            sx={{
                              fontWeight: 700,
                              color: theme.palette.primary.main,
                              fontSize: '1.3rem'
                            }}
                          >
                            ₹{(product.salePrice || product.regularPrice || product.price || 0).toFixed(2)}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>

                    {/* Actions */}
                    <CardActions sx={{ p: 2, pt: 0 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ShoppingCart />}
                        disabled={!product.inStock}
                        onClick={async () => {
                          const productName = product.title || product.name || 'Product'

                          if (product.inStock || product.stockQuantity! > 0) {
                            try {
                              await api.post('/cart/items', {
                                productId: product.id,
                                quantity: 1
                              })

                              toast.success(`${productName} added to cart!`)
                              navigate('/cart')
                              // Trigger cart count update by dispatching a custom event
                              window.dispatchEvent(new CustomEvent('cartUpdated'))
                            } catch (error) {
                              console.error('Error adding to cart:', error)
                              toast.error('Error adding item to cart')
                            }
                          }
                        }}
                        sx={{
                          py: 1,
                          fontWeight: 600,
                          boxShadow: theme.shadows[4],
                          '&:hover': {
                            boxShadow: theme.shadows[8]
                          }
                        }}
                      >
                        {product.inStock ? 'Add to Cart' : 'Out of Stock'}
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
        </Grid>

        {/* No Results Message */}
        {!loading && filteredProducts.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              No products found
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Try adjusting your search or filters to find what you're looking for.
            </Typography>
            <Button
              variant="contained"
              onClick={() => setSearchQuery('')}
              sx={{ mt: 2 }}
            >
              Clear Search
            </Button>
          </Box>
        )}

        {/* Pagination */}
        {!loading && filteredProducts.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
            <Pagination
              count={totalFilteredPages}
              page={page}
              onChange={(_, value) => setPage(value)}
              color="primary"
              size="large"
              sx={{
                '& .MuiPaginationItem-root': {
                  fontSize: '1rem',
                  fontWeight: 600
                }
              }}
            />
          </Box>
        )}
      </Container>
    </Box>
  )
}
