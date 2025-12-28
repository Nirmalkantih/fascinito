import { useState, useEffect } from 'react'
import {
  Typography,
  Button,
  Box,
  Container,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  alpha,
  useTheme,
  IconButton,
  Chip,
  Rating,
  Paper
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  ShoppingBag,
  LocalShipping,
  Security,
  Support,
  ArrowForward,
  Favorite,
  FavoriteBorder,
  ShoppingCart
} from '@mui/icons-material'
import { useWishlist } from '../../contexts/WishlistContext'
import { Loader } from '../../components/Loader'
import api from '../../services/api'

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Helper function to construct proper image URL
const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return 'https://via.placeholder.com/400x400?text=No+Image'

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
  name: string
  price: number
  originalPrice?: number
  rating: number
  reviews: number
  image: string
  category: string
  badge?: string
}

interface Category {
  id: number
  name: string
  image: string
  productCount: number
  totalStockCount: number
  color: string
}

interface CarouselItem {
  id: number
  title: string
  subtitle: string
  image: string
  color: string
  textColor?: string
  ctaUrl?: string
}

export default function Home() {
  const navigate = useNavigate()
  const theme = useTheme()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const [currentSlide, setCurrentSlide] = useState(0)
  const [carouselItems, setCarouselItems] = useState<CarouselItem[]>([])
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [newCollection, setNewCollection] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  // Fetch products from API
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)

        // Fetch featured products using dedicated featured endpoint
        // Add cache-busting query parameter to ensure fresh data
        const timestamp = new Date().getTime()
        const featuredResponse = await api.get(`/products/featured?page=0&size=8&sortBy=id&sortDir=desc&t=${timestamp}`)
        const featuredData = featuredResponse.data || featuredResponse
        const featuredList = featuredData?.content || []

        // Fetch all products for new collection (to show newest products)
        const allResponse = await api.get(`/products?page=0&size=100&active=true&visibleToCustomers=true&sortBy=createdAt&sortDir=desc&t=${timestamp}`)
        const allData = allResponse.data || allResponse
        const allProducts = allData?.content || []

        // Helper to extract image URL from product
        const getProductImageUrl = (product: any): string => {
          let imageUrl = product.imageUrl

          // If no imageUrl, try to get from images array
          if (!imageUrl && product.images && product.images.length > 0) {
            const firstImage = product.images[0]
            // Handle both object with url property and string
            imageUrl = typeof firstImage === 'string' ? firstImage : firstImage.url
          }

          // Apply getImageUrl helper to convert relative paths to API URLs
          return getImageUrl(imageUrl || '')
        }

        // Process featured products
        if (featuredList.length > 0) {
          setFeaturedProducts(featuredList.slice(0, 4).map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.title || p.name,
            price: p.salePrice || p.regularPrice || 0,
            originalPrice: p.regularPrice && p.salePrice ? p.regularPrice : undefined,
            rating: 4.5,
            reviews: 234,
            image: getProductImageUrl(p),
            category: p.categoryName || p.category?.name || 'Uncategorized',
            badge: 'Featured'
          })))
        } else if (allProducts.length > 0) {
          // Fallback: use first 4 products as featured
          setFeaturedProducts(allProducts.slice(0, 4).map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.title || p.name,
            price: p.salePrice || p.regularPrice || 0,
            originalPrice: p.regularPrice && p.salePrice ? p.regularPrice : undefined,
            rating: 4.5,
            reviews: 234,
            image: getProductImageUrl(p),
            category: p.categoryName || p.category?.name || 'Uncategorized'
          })))
        }

        // Process new collection - get newest products (sorted by creation date)
        if (allProducts.length > 0) {
          // Sort by createdAt in descending order to get newest products
          const newestProducts = [...allProducts].sort((a: any, b: any) => {
            const dateA = new Date(b.createdAt || 0).getTime()
            const dateB = new Date(a.createdAt || 0).getTime()
            return dateA - dateB
          }).slice(0, 4)

          setNewCollection(newestProducts.map((p: any) => ({
            id: p.id,
            slug: p.slug,
            name: p.title || p.name,
            price: p.salePrice || p.regularPrice || 0,
            originalPrice: p.regularPrice && p.salePrice ? p.regularPrice : undefined,
            rating: 4.5,
            reviews: 234,
            image: getProductImageUrl(p),
            category: p.categoryName || p.category?.name || 'Uncategorized',
            badge: p.salePrice && p.regularPrice && p.salePrice < p.regularPrice ? 'Sale' : undefined
          })))
        }
      } catch (error) {
        console.error('Error fetching products:', error)
        // Fallback to empty arrays
        setFeaturedProducts([])
        setNewCollection([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()

    // Refresh products every 5 minutes to ensure fresh data
    const refreshInterval = setInterval(fetchProducts, 5 * 60 * 1000)
    return () => clearInterval(refreshInterval)
  }, [])

  // Fetch carousel banners from API
  useEffect(() => {
    const fetchCarousels = async () => {
      try {
        // Add cache-busting query parameter to ensure fresh data
        const timestamp = new Date().getTime()
        const response = await api.get(`/banners/active?t=${timestamp}`)
        const data = response.data || response
        const apiBanners = data || []

        if (apiBanners.length > 0) {
          // Map banner data to carousel items
          setCarouselItems(
            apiBanners.map((banner: any) => ({
              id: banner.id,
              title: banner.title,
              subtitle: banner.subtitle,
              image: getImageUrl(banner.imageUrl),
              color: banner.backgroundColor || '#667eea',
              textColor: banner.textColor || '#ffffff',
              ctaUrl: banner.ctaUrl,
            }))
          )
        } else {
          // Fallback: use default carousel items if no banners in database
          setCarouselItems([
            {
              id: 1,
              title: 'Summer Collection 2025',
              subtitle: 'Up to 50% OFF on Selected Items',
              image: 'https://picsum.photos/1200/500?random=1',
              color: '#667eea',
              textColor: '#ffffff',
            },
            {
              id: 2,
              title: 'New Arrivals',
              subtitle: 'Discover the Latest Trends',
              image: 'https://picsum.photos/1200/500?random=2',
              color: '#f093fb',
              textColor: '#ffffff',
            },
            {
              id: 3,
              title: 'Electronics Sale',
              subtitle: 'Amazing Deals on Tech Products',
              image: 'https://picsum.photos/1200/500?random=3',
              color: '#4facfe',
              textColor: '#ffffff',
            },
          ])
        }
      } catch (error) {
        console.error('Error fetching carousel banners:', error)
        // Fallback to default carousel items
        setCarouselItems([
          {
            id: 1,
            title: 'Summer Collection 2025',
            subtitle: 'Up to 50% OFF on Selected Items',
            image: 'https://picsum.photos/1200/500?random=1',
            color: '#667eea',
            textColor: '#ffffff',
          },
          {
            id: 2,
            title: 'New Arrivals',
            subtitle: 'Discover the Latest Trends',
            image: 'https://picsum.photos/1200/500?random=2',
            color: '#f093fb',
            textColor: '#ffffff',
          },
          {
            id: 3,
            title: 'Electronics Sale',
            subtitle: 'Amazing Deals on Tech Products',
            image: 'https://picsum.photos/1200/500?random=3',
            color: '#4facfe',
            textColor: '#ffffff',
          },
        ])
      }
    }

    fetchCarousels()

    // Refresh banners every 5 minutes to ensure fresh data
    const refreshInterval = setInterval(fetchCarousels, 5 * 60 * 1000)
    return () => clearInterval(refreshInterval)
  }, [])

  // Fetch categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        // Fetch only active categories
        const response = await api.get('/categories?page=0&size=6&active=true')
        const data = response.data || response
        const apiCategories = data?.content || []

        if (apiCategories.length > 0) {
          const colors = ['#667eea', '#f093fb', '#4facfe', '#43e97b', '#fa709a', '#fee140']
          setCategories(apiCategories.map((cat: any, index: number) => {
            let imageUrl = cat.imageUrl || ''
            // If no imageUrl or it's empty, use placeholder
            if (!imageUrl) {
              imageUrl = `https://picsum.photos/300/300?random=${20 + index}`
            } else {
              // Apply getImageUrl helper to convert relative paths to API URLs
              imageUrl = getImageUrl(imageUrl)
            }
            return {
              id: cat.id,
              name: cat.name,
              image: imageUrl,
              productCount: cat.productCount || 0,
              totalStockCount: cat.totalStockCount || 0,
              color: colors[index % colors.length]
            }
          }))
        }
      } catch (error) {
        console.error('Error fetching categories:', error)
        setCategories([])
      }
    }

    fetchCategories()
  }, [])

  // Auto-advance carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % carouselItems.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [carouselItems.length])

  const toggleFavorite = async (productId: number) => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (!token) {
        toast.error('Please log in to add to wishlist')
        return
      }

      const isFavorited = isInWishlist(productId)

      if (isFavorited) {
        await api.delete(`/wishlist/${productId}`)
        removeFromWishlist(productId)
      } else {
        await api.post(`/wishlist/${productId}`)
        addToWishlist(productId)
      }

      toast.success(isFavorited ? 'Removed from wishlist' : 'Added to wishlist')
    } catch (error) {
      console.error('Error updating wishlist:', error)
      toast.error('Failed to update wishlist')
    }
  }

  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]))
  }

  const getDisplayImageUrl = (imageUrl: string) => {
    if (failedImages.has(imageUrl)) {
      return 'https://via.placeholder.com/400x400?text=Image+Not+Available'
    }
    return imageUrl
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.3s ease-in-out',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: theme.shadows[20],
          '& .product-image': {
            transform: 'scale(1.1)'
          }
        }
      }}
    >
      {/* Badge */}
      {product.badge && (
        <Chip
          label={product.badge}
          size="small"
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            zIndex: 1,
            bgcolor: product.badge === 'Hot' ? '#ff4757' : product.badge === 'New' ? '#2ed573' : '#ffa502',
            color: 'white',
            fontWeight: 700
          }}
        />
      )}

      {/* Favorite Button */}
      <IconButton
        sx={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 1,
          bgcolor: 'white',
          '&:hover': { bgcolor: alpha('#ffffff', 0.9) }
        }}
        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
          e.stopPropagation()
          toggleFavorite(product.id)
        }}
      >
        {isInWishlist(product.id) ? (
          <Favorite sx={{ color: '#ff4757' }} />
        ) : (
          <FavoriteBorder />
        )}
      </IconButton>

      {/* Product Image */}
      <Box
        sx={{ overflow: 'hidden', height: 250, cursor: 'pointer' }}
        onClick={() => navigate(`/products/${product.slug}`)}
      >
        <CardMedia
          className="product-image"
          component="img"
          height="250"
          image={getDisplayImageUrl(product.image)}
          alt={product.name}
          onError={(e: any) => {
            const currentSrc = e.currentTarget.src
            if (!currentSrc.includes('placeholder')) {
              handleImageError(currentSrc)
            }
          }}
          sx={{ transition: 'transform 0.3s ease-in-out' }}
        />
      </Box>

      {/* Product Info */}
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        <Chip
          label={product.category}
          size="small"
          sx={{
            mb: 1,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            color: theme.palette.primary.main,
            fontSize: '0.75rem'
          }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            mb: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}
        >
          {product.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Rating value={product.rating} precision={0.1} size="small" readOnly />
          <Typography variant="body2" color="text.secondary">
            ({product.reviews})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main
            }}
          >
            ₹{product.price.toFixed(2)}
          </Typography>
          {product.originalPrice && (
            <>
              <Typography
                variant="body2"
                sx={{
                  textDecoration: 'line-through',
                  color: 'text.secondary'
                }}
              >
                ₹{product.originalPrice.toFixed(2)}
              </Typography>
              <Chip
                label={`-${Math.round((1 - product.price / product.originalPrice) * 100)}%`}
                size="small"
                color="error"
                sx={{ height: 20, fontSize: '0.7rem' }}
              />
            </>
          )}
        </Box>
      </CardContent>

      {/* Add to Cart Button */}
      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          fullWidth
          variant="contained"
          startIcon={<ShoppingCart />}
          onClick={async () => {
            try {
              await api.post('/cart/items', {
                productId: product.id,
                quantity: 1
              })

              toast.success(`${product.name || product.slug || 'Product'} added to cart!`)
              // Dispatch event to update cart in navbar
              window.dispatchEvent(new CustomEvent('cartUpdated'))
              // Navigate to cart page
              navigate('/cart')
            } catch (error: any) {
              console.error('Error adding to cart:', error)
              // Check if it's a 401 error (handled by interceptor)
              if (error.response?.status === 401) {
                toast.error('Please login to add items to cart')
              } else {
                const errorMessage = error.response?.data?.message || 'Failed to add to cart'
                toast.error(errorMessage)
              }
            }
          }}
          sx={{
            fontWeight: 600,
            boxShadow: theme.shadows[4]
          }}
        >
          Add to Cart
        </Button>
      </CardActions>
    </Card>
  )

  return (
    <Box>
      {/* Hero Carousel */}
      <Box
        sx={{
          position: 'relative',
          height: { xs: 400, md: 500 },
          overflow: 'hidden',
          mb: 6,
          borderRadius: { xs: 0, md: 2 }
        }}
      >
        {carouselItems.map((item, index) => (
          <Box
            key={index}
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: currentSlide === index ? 1 : 0,
              transition: 'opacity 0.5s ease-in-out',
              overflow: 'hidden',
              backgroundColor: item.color
            }}
          >
            {/* Background Image with proper aspect ratio */}
            <Box
              component="img"
              src={item.image}
              alt={item.title}
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'center'
              }}
            />

            {/* Overlay Gradient */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, ${alpha(item.color, 0.25)} 0%, ${alpha(item.color, 0.1)} 100%)`,
                zIndex: 1
              }}
            />

            {/* Text Content */}
            <Container
              maxWidth="lg"
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                zIndex: 2
              }}
            >
              <Box sx={{ color: item.textColor || 'white', maxWidth: 600 }}>
                <Typography
                  variant="h2"
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    fontSize: { xs: '2rem', md: '3.5rem' },
                    color: item.textColor || 'white',
                    textShadow: '0 2px 20px rgba(0,0,0,0.3)'
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 300,
                    mb: 4,
                    color: item.textColor || 'white',
                    textShadow: '0 2px 10px rgba(0,0,0,0.3)'
                  }}
                >
                  {item.subtitle}
                </Typography>
                <Button
                  variant="contained"
                  size="large"
                  endIcon={<ArrowForward />}
                  onClick={() => {
                    // Use CTA URL if available, otherwise navigate to products
                    if (item.ctaUrl) {
                      if (item.ctaUrl.startsWith('http://') || item.ctaUrl.startsWith('https://')) {
                        window.location.href = item.ctaUrl
                      } else {
                        navigate(item.ctaUrl)
                      }
                    } else {
                      navigate('/products')
                    }
                  }}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.primary.main, 0.9),
                      transform: 'translateY(-2px)'
                    }
                  }}
                >
                  Shop Now
                </Button>
              </Box>
            </Container>
          </Box>
        ))}

        {/* Carousel Indicators */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 1,
            zIndex: 2
          }}
        >
          {carouselItems.map((_, index) => (
            <Box
              key={index}
              onClick={() => setCurrentSlide(index)}
              sx={{
                width: currentSlide === index ? 40 : 10,
                height: 10,
                borderRadius: 5,
                bgcolor: currentSlide === index ? 'white' : alpha('#ffffff', 0.5),
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            />
          ))}
        </Box>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h2"
            gutterBottom
            sx={{
              fontWeight: 800,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Shop by Category
          </Typography>
          <Typography
            variant="h6"
            color="text.secondary"
            sx={{
              maxWidth: 600,
              mx: 'auto',
              fontWeight: 500
            }}
          >
            Explore our diverse collection organized by categories
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={6} sm={4} md={2.4} key={category.id}>
              <Box
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  textAlign: 'center',
                  '&:hover': {
                    transform: 'translateY(-8px) scale(1.02)',
                    '& .category-image': {
                      transform: 'scale(1.08)'
                    }
                  }
                }}
                onClick={() => navigate(`/products?categoryId=${category.id}`)}
              >
                {/* Category Image */}
                <Box
                  sx={{
                    position: 'relative',
                    width: '100%',
                    paddingTop: '100%',
                    overflow: 'hidden',
                    borderRadius: 2.5,
                    mb: 1.5,
                    boxShadow: theme.shadows[4],
                    bgcolor: alpha(theme.palette.primary.main, 0.08)
                  }}
                >
                  <img
                    className="category-image"
                    src={getDisplayImageUrl(category.image)}
                    alt={category.name}
                    onError={(e: any) => {
                      const currentSrc = e.currentTarget.src
                      if (!currentSrc.includes('placeholder')) {
                        handleImageError(currentSrc)
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                </Box>

                {/* Category Name with Product Count */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '0.95rem', sm: '1rem' },
                      color: 'text.primary',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        color: theme.palette.primary.main
                      }
                    }}
                  >
                    {category.name}
                  </Typography>

                  {/* Product Count Badge */}
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minWidth: 28,
                      height: 28,
                      borderRadius: '50%',
                      bgcolor: alpha(theme.palette.primary.main, 0.15),
                      border: `2px solid ${alpha(theme.palette.primary.main, 0.3)}`,
                      transition: 'all 0.3s ease',
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.25),
                        borderColor: theme.palette.primary.main,
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        fontSize: '0.85rem',
                        color: theme.palette.primary.main
                      }}
                    >
                      {category.productCount}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Products Section */}
      <Container maxWidth="lg" sx={{ mb: 8 }}>
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
              Featured Products
            </Typography>
            <Typography variant="h6" color="text.secondary">
              Handpicked items just for you
            </Typography>
          </Box>
          <Button
            variant="outlined"
            endIcon={<ArrowForward />}
            onClick={() => navigate('/products')}
            sx={{ display: { xs: 'none', md: 'flex' } }}
          >
            View All
          </Button>
        </Box>

        {loading ? (
          <Loader size="medium" text="Loading featured products..." />
        ) : (
          <Grid container spacing={3}>
            {featuredProducts.length > 0 ? (
              featuredProducts.map((product) => (
                <Grid item xs={12} sm={6} md={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography variant="body1" color="text.secondary">
                    No featured products available
                  </Typography>
                  <Button
                    variant="contained"
                    onClick={() => navigate('/products')}
                    sx={{ mt: 2 }}
                  >
                    Browse All Products
                  </Button>
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Container>

      {/* New Collection Section */}
      <Box
        sx={{
          bgcolor: alpha(theme.palette.primary.main, 0.03),
          py: 8
        }}
      >
        <Container maxWidth="lg">
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
                New Collection
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Latest arrivals from top brands
              </Typography>
            </Box>
            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/products?filter=new')}
              sx={{ display: { xs: 'none', md: 'flex' } }}
            >
              View All
            </Button>
          </Box>

          {loading ? (
            <Loader size="medium" text="Loading new collection..." />
          ) : (
            <Grid container spacing={3}>
              {newCollection.length > 0 ? (
                newCollection.map((product) => (
                  <Grid item xs={12} sm={6} md={3} key={product.id}>
                    <ProductCard product={product} />
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No new collection products available
                    </Typography>
                    <Button
                      variant="contained"
                      onClick={() => navigate('/products')}
                      sx={{ mt: 2 }}
                    >
                      Browse All Products
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          )}
        </Container>
      </Box>

      {/* Why Choose Us Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
            gutterBottom
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 2
            }}
          >
            Why Choose Us
          </Typography>
          <Typography variant="h6" color="text.secondary">
            We provide the best shopping experience
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {[
            {
              icon: <ShoppingBag sx={{ fontSize: 48 }} />,
              title: 'Quality Products',
              description: 'Curated selection from trusted vendors',
              color: '#667eea'
            },
            {
              icon: <LocalShipping sx={{ fontSize: 48 }} />,
              title: 'Fast Delivery',
              description: 'Express shipping options available',
              color: '#f093fb'
            },
            {
              icon: <Security sx={{ fontSize: 48 }} />,
              title: 'Secure Payment',
              description: 'Bank-grade encryption for safety',
              color: '#4facfe'
            },
            {
              icon: <Support sx={{ fontSize: 48 }} />,
              title: '24/7 Support',
              description: 'Always here to help you',
              color: '#43e97b'
            }
          ].map((feature, index) => (
            <Grid item xs={12} sm={6} md={3} key={index}>
              <Paper
                elevation={0}
                sx={{
                  p: 4,
                  textAlign: 'center',
                  height: '100%',
                  border: `2px solid ${alpha(feature.color, 0.1)}`,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: feature.color,
                    transform: 'translateY(-4px)',
                    boxShadow: theme.shadows[10]
                  }
                }}
              >
                <Box
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    bgcolor: alpha(feature.color, 0.1),
                    color: feature.color,
                    mb: 2
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  {feature.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {feature.description}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* CTA Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          py: 8
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h3"
              gutterBottom
              sx={{ fontWeight: 700, mb: 3 }}
            >
              Ready to Start Shopping?
            </Typography>
            <Typography
              variant="h6"
              paragraph
              sx={{ mb: 4, opacity: 0.95 }}
            >
              Join thousands of satisfied customers and discover amazing deals today
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForward />}
              onClick={() => navigate('/products')}
              sx={{
                px: 6,
                py: 2,
                fontSize: '1.1rem',
                bgcolor: theme.palette.primary.main,
                color: 'white',
                fontWeight: 700,
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.9),
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Browse All Products
            </Button>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
