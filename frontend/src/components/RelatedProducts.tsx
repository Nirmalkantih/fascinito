import React, { useEffect, useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Rating,
  Skeleton,
  alpha,
  useTheme,
  Container
} from '@mui/material'
import { ShoppingCart } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

interface RelatedProductsProps {
  productId: number
  limit?: number
}

interface Product {
  id: number
  name: string
  title: string
  slug: string
  regularPrice: number
  salePrice?: number
  rating?: number
  reviewCount?: number
  images?: Array<{ url: string } | string>
}

const RelatedProducts: React.FC<RelatedProductsProps> = ({ productId, limit = 6 }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRelatedProducts = async () => {
      try {
        setLoading(true)
        const response = await api.get(`/products/${productId}/related?limit=${limit}`)
        // axios interceptor returns the ApiResponse wrapper directly
        if ((response as any).success && Array.isArray((response as any).data)) {
          setProducts((response as any).data)
        } else {
          setProducts([])
        }
        setError(null)
      } catch (err) {
        console.error('Error fetching related products:', err)
        setError('Failed to load related products')
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchRelatedProducts()
  }, [productId, limit])

  // Helper to get image URL
  const getProductImage = (images?: Array<{ url: string } | string>): string => {
    if (!images || images.length === 0) {
      return 'https://via.placeholder.com/300x300?text=No+Image'
    }

    const firstImage = images[0]
    const imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url

    // Format image URL with API base if needed
    if (imageUrl.startsWith('http')) {
      return imageUrl
    }

    const apiBase = import.meta.env.VITE_API_URL || '/api'
    if (imageUrl.startsWith('/')) {
      return `${apiBase}${imageUrl}`
    }

    return `${apiBase}/${imageUrl}`
  }

  const displayPrice = (product: Product) => {
    if (product.salePrice && product.salePrice < product.regularPrice) {
      return product.salePrice
    }
    return product.regularPrice
  }

  const showSalePrice = (product: Product) => {
    return product.salePrice && product.salePrice < product.regularPrice
  }

  // Don't show section if no products or loading
  if (loading) {
    return (
      <Box sx={{ py: 4, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
        <Container maxWidth="lg">
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: theme.palette.primary.main, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ width: 4, height: 24, bgcolor: theme.palette.primary.main, borderRadius: 1 }} />
            Related Products
          </Typography>
          <Grid container spacing={2}>
            {[...Array(6)].map((_, index) => (
              <Grid item xs={12} sm={6} md={4} lg={2} key={index}>
                <Skeleton variant="rectangular" width="100%" height={200} sx={{ mb: 1 }} />
                <Skeleton variant="text" width="80%" />
                <Skeleton variant="text" width="60%" />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    )
  }

  if (error || products.length === 0) {
    return null
  }

  return (
    <Box sx={{ py: 4, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
      <Container maxWidth="lg">
        {/* Section Title */}
        <Typography
          variant="h6"
          sx={{
            mb: 4,
            fontWeight: 700,
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Box component="span" sx={{ width: 4, height: 24, bgcolor: theme.palette.primary.main, borderRadius: 1 }} />
          Related Products
        </Typography>

        {/* Products Grid */}
        <Grid container spacing={2.5}>
          {products.map((product) => (
            <Grid item xs={12} sm={6} md={4} lg={2} key={product.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: theme.shadows[12]
                  },
                  borderRadius: 2,
                  overflow: 'hidden'
                }}
                onClick={() => navigate(`/products/${product.slug}`)}
              >
                {/* Product Image */}
                <CardMedia
                  component="img"
                  height="200"
                  image={getProductImage(product.images)}
                  alt={product.name || product.title}
                  sx={{
                    objectFit: 'cover',
                    backgroundColor: '#f5f5f5'
                  }}
                />

                {/* Sale Badge */}
                {showSalePrice(product) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      bgcolor: theme.palette.error.main,
                      color: 'white',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}
                  >
                    SALE
                  </Box>
                )}

                {/* Content */}
                <CardContent sx={{ flexGrow: 1, pb: 1 }}>
                  {/* Product Name */}
                  <Typography
                    variant="body2"
                    sx={{
                      mb: 0.5,
                      fontWeight: 600,
                      color: theme.palette.text.primary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontSize: '0.9rem'
                    }}
                  >
                    {product.name || product.title}
                  </Typography>

                  {/* Rating */}
                  {product.rating && product.reviewCount ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <Rating value={product.rating} readOnly size="small" />
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                        ({product.reviewCount})
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ mb: 1 }} />
                  )}

                  {/* Price */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        color: theme.palette.primary.main,
                        fontSize: '1rem'
                      }}
                    >
                      ₹{displayPrice(product).toFixed(2)}
                    </Typography>
                    {showSalePrice(product) && (
                      <Typography
                        variant="body2"
                        sx={{
                          textDecoration: 'line-through',
                          color: theme.palette.text.disabled,
                          fontSize: '0.85rem'
                        }}
                      >
                        ₹{product.regularPrice.toFixed(2)}
                      </Typography>
                    )}
                  </Box>
                </CardContent>

                {/* Add to Cart Button */}
                <Box sx={{ p: 1 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    size="small"
                    startIcon={<ShoppingCart />}
                    sx={{
                      textTransform: 'none',
                      fontSize: '0.75rem',
                      py: 0.75,
                      color: theme.palette.primary.main,
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.1),
                        borderColor: theme.palette.primary.main
                      }
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/products/${product.slug}`)
                    }}
                  >
                    View
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  )
}

export default RelatedProducts
