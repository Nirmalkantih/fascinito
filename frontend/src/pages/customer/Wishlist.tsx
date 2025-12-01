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
  Alert,
  alpha,
  useTheme,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material'
import { Delete as DeleteIcon, ShoppingCart, ArrowBack } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import LazyImage from '../../components/LazyImage'
import { useWishlist } from '../../contexts/WishlistContext'

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

interface WishlistItem {
  id: number
  productId: number
  productSlug: string
  productName: string
  productImage?: string
  productCategory?: string
  productPrice: number
  inStock: boolean
  addedAt: string
}

export default function Wishlist() {
  const navigate = useNavigate()
  const theme = useTheme()
  const { removeFromWishlist } = useWishlist()
  const [loading, setLoading] = useState(true)
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<number | null>(null)

  // Fetch wishlist on mount
  useEffect(() => {
    fetchWishlist()
  }, [])

  const fetchWishlist = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')

      const response = await fetch('/api/wishlist', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch wishlist')
      }

      const data = await response.json()
      setWishlistItems(data.data?.items || [])
    } catch (error) {
      console.error('Error fetching wishlist:', error)
      toast.error('Failed to load wishlist')
      setWishlistItems([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      const response = await fetch(`/api/wishlist/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to remove from wishlist')
      }

      // Update local state
      setWishlistItems(items => items.filter(item => item.productId !== productId))

      // Update WishlistContext to sync wishlist count in navbar
      removeFromWishlist(productId)

      toast.success('Removed from wishlist')
      setDeleteDialogOpen(false)
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast.error('Failed to remove from wishlist')
    }
  }

  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      }
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/cart/items', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          productId: item.productId,
          quantity: 1
        })
      })

      // Handle 401 - token expired or invalid
      if (response.status === 401 && token) {
        // Clear invalid tokens
        localStorage.removeItem('accessToken')
        localStorage.removeItem('token')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        
        // Retry without token (guest mode)
        const retryResponse = await fetch('/api/cart/items', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId: item.productId,
            quantity: 1
          })
        })

        if (retryResponse.ok) {
          toast.success(`${item.productName} moved to cart`)
          handleRemoveFromWishlist(item.productId)
          toast.info('Your session expired. Continue browsing as guest or login again.')
          // Navigate to cart page
          navigate('/cart')
        } else {
          toast.error('Please login to add items to cart')
        }
        return
      }

      if (!response.ok) {
        throw new Error('Failed to add to cart')
      }

      toast.success(`${item.productName} moved to cart`)
      handleRemoveFromWishlist(item.productId)
      // Navigate to cart page
      navigate('/cart')
    } catch (error) {
      console.error('Error adding to cart:', error)
      toast.error('Failed to add to cart')
    }
  }

  const openDeleteDialog = (productId: number) => {
    setItemToDelete(productId)
    setDeleteDialogOpen(true)
  }

  const closeDeleteDialog = () => {
    setDeleteDialogOpen(false)
    setItemToDelete(null)
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02), minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate(-1)}
            sx={{
              bgcolor: alpha(theme.palette.primary.main, 0.1),
              '&:hover': {
                bgcolor: alpha(theme.palette.primary.main, 0.2)
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            My Wishlist
          </Typography>
        </Box>

        {loading ? (
          <Typography>Loading wishlist...</Typography>
        ) : wishlistItems.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 10 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Your wishlist is empty
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Add products to your wishlist to save them for later.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/products')}
              sx={{ mt: 2 }}
            >
              Continue Shopping
            </Button>
          </Box>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              You have {wishlistItems.length} item{wishlistItems.length !== 1 ? 's' : ''} in your wishlist
            </Alert>

            <Grid container spacing={3}>
              {wishlistItems.map((item) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={item.id}>
                  <Card
                    sx={{
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      transition: 'all 0.3s ease-in-out',
                      '&:hover': {
                        transform: 'translateY(-8px)',
                        boxShadow: theme.shadows[20],
                        '& .product-image': {
                          transform: 'scale(1.05)'
                        }
                      }
                    }}
                  >
                    {/* Product Image */}
                    <Box
                      sx={{
                        overflow: 'hidden',
                        height: 200,
                        cursor: 'pointer',
                        position: 'relative'
                      }}
                      onClick={() => navigate(`/products/${item.productSlug || item.productId}`)}
                    >
                      <LazyImage
                        src={getImageUrl(item.productImage || '')}
                        alt={item.productName}
                        height={200}
                        objectFit="cover"
                        className="product-image"
                        style={{ transition: 'transform 0.3s ease-in-out' }}
                      />

                      {/* Delete Button */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          bgcolor: 'white',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: theme.shadows[5],
                          zIndex: 1
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation()
                            openDeleteDialog(item.productId)
                          }}
                          sx={{
                            color: theme.palette.error.main,
                            '&:hover': {
                              bgcolor: alpha(theme.palette.error.main, 0.1)
                            }
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Product Info */}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 600,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {item.productName}
                      </Typography>

                      {item.productCategory && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                          {item.productCategory}
                        </Typography>
                      )}

                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          color: theme.palette.primary.main,
                          fontSize: '1.3rem',
                          mt: 2
                        }}
                      >
                        ${item.productPrice.toFixed(2)}
                      </Typography>

                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                        Added {formatDate(item.addedAt)}
                      </Typography>

                      {!item.inStock && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.error.main,
                            fontWeight: 600,
                            mt: 1
                          }}
                        >
                          Out of Stock
                        </Typography>
                      )}
                    </CardContent>

                    {/* Actions */}
                    <CardActions sx={{ p: 2, pt: 0, gap: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<ShoppingCart />}
                        disabled={!item.inStock}
                        onClick={() => handleMoveToCart(item)}
                        size="small"
                      >
                        Move to Cart
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </>
        )}
      </Container>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={closeDeleteDialog}
      >
        <DialogTitle>Remove from Wishlist?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this product from your wishlist?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDeleteDialog}>Cancel</Button>
          <Button
            onClick={() => {
              if (itemToDelete) {
                handleRemoveFromWishlist(itemToDelete)
              }
            }}
            color="error"
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
