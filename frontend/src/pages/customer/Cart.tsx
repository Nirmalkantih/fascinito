import { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Box,
  Card,
  CardMedia,
  CardContent,
  IconButton,
  Button,
  Divider,
  Grid,
  alpha,
  useTheme,
  Paper,
  CircularProgress
} from '@mui/material'
import {
  Add,
  Remove,
  Delete,
  ShoppingCart,
  ArrowForward
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Helper function to construct proper image URL
const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return 'https://via.placeholder.com/120x120?text=No+Image'

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

interface CartItem {
  id: number
  productId: number
  name: string
  price: number
  quantity: number
  imageUrl: string
  variant?: string
}

export default function Cart() {
  const navigate = useNavigate()
  const theme = useTheme()

  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch cart items from backend API
  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')

      // Build headers with optional authorization
      const headers: any = {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch('/api/cart', {
        headers
      })

      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }

      const data = await response.json()
      const items = data.data?.items || []

      // Map API response to CartItem interface
      const mappedItems = items.map((item: any) => ({
        id: item.id,
        productId: item.productId,
        name: item.productName,
        price: parseFloat(item.productPrice) || 0,
        quantity: item.quantity,
        imageUrl: item.productImage || ''
      }))

      setCartItems(mappedItems)
    } catch (error) {
      console.error('Error fetching cart:', error)
      // Don't show error for guest users - they'll see empty cart
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (token) {
        toast.error('Failed to load cart')
      }
      setCartItems([])
    } finally {
      setLoading(false)
    }
  }

  const updateQuantity = async (cartItemId: number, delta: number) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      const currentItem = cartItems.find(item => item.id === cartItemId)

      if (!currentItem) return

      const newQuantity = Math.max(1, currentItem.quantity + delta)

      // Build headers with optional authorization
      const headers: any = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/cart/items/${cartItemId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ quantity: newQuantity })
      })

      if (!response.ok) {
        // Only show error if user is authenticated
        if (token) {
          throw new Error('Failed to update quantity')
        }
        return
      }

      // Update local state after successful API call
      setCartItems(items =>
        items.map(item =>
          item.id === cartItemId
            ? { ...item, quantity: newQuantity }
            : item
        )
      )
    } catch (error) {
      console.error('Error updating quantity:', error)
      toast.error('Failed to update quantity')
    }
  }

  const removeItem = async (cartItemId: number) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')

      // Build headers with optional authorization
      const headers: any = {
        'Content-Type': 'application/json'
      }

      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await fetch(`/api/cart/items/${cartItemId}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        // Only show error if user is authenticated
        if (token) {
          throw new Error('Failed to remove item')
        }
        return
      }

      // Update local state after successful API call
      setCartItems(items => items.filter(item => item.id !== cartItemId))
      toast.success('Item removed from cart')
      // Dispatch event to update cart count in navbar
      window.dispatchEvent(new CustomEvent('cartUpdated'))
    } catch (error) {
      console.error('Error removing item:', error)
      toast.error('Failed to remove item')
    }
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.1
  const shipping = cartItems.length > 0 ? 15 : 0
  const total = subtotal + tax + shipping

  if (loading) {
    return (
      <Container maxWidth="md">
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CircularProgress />
          <Typography variant="h6" sx={{ mt: 2 }}>
            Loading cart...
          </Typography>
        </Box>
      </Container>
    )
  }

  if (cartItems.length === 0) {
    return (
      <Container maxWidth="md">
        <Box
          sx={{
            textAlign: 'center',
            py: 10
          }}
        >
          <ShoppingCart
            sx={{
              fontSize: 120,
              color: alpha(theme.palette.primary.main, 0.3),
              mb: 3
            }}
          />
          <Typography
            variant="h4"
            gutterBottom
            sx={{ fontWeight: 600, mb: 2 }}
          >
            Your cart is empty
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            paragraph
            sx={{ mb: 4 }}
          >
            Looks like you haven't added anything to your cart yet
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/products')}
            sx={{ px: 4 }}
          >
            Continue Shopping
          </Button>
        </Box>
      </Container>
    )
  }

  return (
    <Box sx={{ 
      bgcolor: alpha(theme.palette.primary.main, 0.02), 
      minHeight: '100vh', 
      py: 4,
      background: 'linear-gradient(180deg, rgba(102, 126, 234, 0.05) 0%, rgba(255, 255, 255, 0) 100%)'
    }}>
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
              WebkitTextFillColor: 'transparent',
              mb: 1
            }}
          >
            Shopping Cart
          </Typography>
          <Typography variant="h6" color="text.secondary">
            {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'} in your cart
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {/* Cart Items */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {cartItems.map((item) => (
                <Card
                  key={item.id}
                  elevation={0}
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease-in-out',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
                    '&:hover': {
                      boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                      transform: 'translateY(-4px)'
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', p: 2 }}>
                    {/* Product Image */}
                    <Box
                      sx={{
                        position: 'relative',
                        borderRadius: 2,
                        overflow: 'hidden',
                        flexShrink: 0
                      }}
                    >
                      <CardMedia
                        component="img"
                        sx={{
                          width: 120,
                          height: 120,
                          objectFit: 'cover'
                        }}
                        image={getImageUrl(item.imageUrl)}
                        alt={item.name}
                        onError={(e: any) => {
                          e.target.src = 'https://via.placeholder.com/120x120?text=No+Image'
                        }}
                      />
                    </Box>

                    {/* Product Details */}
                    <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pl: 3 }}>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
                          {item.name}
                        </Typography>
                        {item.variant && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            Variant: {item.variant}
                          </Typography>
                        )}
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                        {/* Quantity Controls */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            bgcolor: alpha(theme.palette.primary.main, 0.05),
                            borderRadius: 2,
                            p: 0.5,
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, -1)}
                            sx={{
                              bgcolor: 'white',
                              width: 32,
                              height: 32,
                              '&:hover': { 
                                bgcolor: theme.palette.primary.main,
                                color: 'white',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Remove fontSize="small" />
                          </IconButton>
                          <Typography sx={{ 
                            minWidth: 40, 
                            textAlign: 'center', 
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: theme.palette.primary.main
                          }}>
                            {item.quantity}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => updateQuantity(item.id, 1)}
                            sx={{
                              bgcolor: 'white',
                              width: 32,
                              height: 32,
                              '&:hover': { 
                                bgcolor: theme.palette.primary.main,
                                color: 'white',
                                transform: 'scale(1.1)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <Add fontSize="small" />
                          </IconButton>
                        </Box>

                        {/* Price and Delete */}
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 700,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              WebkitBackgroundClip: 'text',
                              WebkitTextFillColor: 'transparent'
                            }}
                          >
                            ₹{(item.price * item.quantity).toFixed(2)}
                          </Typography>
                          <IconButton
                            color="error"
                            onClick={() => removeItem(item.id)}
                            sx={{
                              width: 40,
                              height: 40,
                              transition: 'all 0.3s ease',
                              '&:hover': {
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                transform: 'scale(1.15) rotate(10deg)'
                              }
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Box>
                </Card>
              ))}
            </Box>
          </Grid>

          {/* Order Summary */}
          <Grid item xs={12} md={4}>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                position: 'sticky',
                top: 20,
                borderRadius: 3,
                boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
                overflow: 'hidden'
              }}
            >
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  p: 3,
                  mx: -3,
                  mt: -3,
                  mb: 3
                }}
              >
                <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
                  Order Summary
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  Review your items
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Subtotal</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{subtotal.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Tax (10%)</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{tax.toFixed(2)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body1">Shipping</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>₹{shipping.toFixed(2)}</Typography>
                </Box>

                <Divider sx={{ my: 1 }} />

                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    p: 2,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.08),
                    border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                  }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    Total
                  </Typography>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}
                  >
                    ₹{total.toFixed(2)}
                  </Typography>
                </Box>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => {
                    // Check if user is logged in
                    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
                    if (!token) {
                      // Not logged in - redirect to login page
                      toast.info('Please log in to proceed to checkout')
                      navigate('/login', { state: { from: '/cart' } })
                    } else {
                      // Logged in - proceed to checkout
                      navigate('/checkout')
                    }
                  }}
                  sx={{
                    mt: 2,
                    py: 1.8,
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    letterSpacing: '0.5px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #764ba2 0%, #667eea 100%)',
                      transform: 'translateY(-3px)',
                      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.6)'
                    }
                  }}
                >
                  Proceed to Checkout
                </Button>

                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate('/products')}
                  sx={{
                    py: 1.3,
                    fontWeight: 600,
                    borderWidth: 2,
                    '&:hover': {
                      borderWidth: 2,
                      transform: 'translateY(-2px)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }
                  }}
                >
                  Continue Shopping
                </Button>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  )
}
