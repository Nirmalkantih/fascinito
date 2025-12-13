import { useState, useEffect } from 'react'
import {
  Container,
  Grid,
  Box,
  Typography,
  Button,
  Card,
  Rating,
  Chip,
  alpha,
  useTheme,
  IconButton,
  Tabs,
  Tab,
  Avatar,
  Stack
} from '@mui/material'
import {
  ShoppingCart,
  Favorite,
  FavoriteBorder,
  Share,
  Add,
  Remove
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { useWishlist } from '../../contexts/WishlistContext'
import api from '../../services/api'

interface TabPanelProps {
  children?: React.ReactNode
  index: number
  value: number
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  )
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

// Helper function to construct proper image URL
const getImageUrl = (imageUrl: string): string => {
  if (!imageUrl) return 'https://via.placeholder.com/500x500?text=No+Image'

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

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const theme = useTheme()
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlist()
  const [quantity, setQuantity] = useState(1)
  const [tabValue, setTabValue] = useState(0)
  const [selectedImage, setSelectedImage] = useState(0)
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  // Map of variation ID to selected option
  const [selectedVariations, setSelectedVariations] = useState<Map<number, any>>(new Map())
  // Store the specific variant combination details (price, stock, etc.)
  const [selectedVariantCombination, setSelectedVariantCombination] = useState<any>(null)
  const [loadingVariantDetails, setLoadingVariantDetails] = useState(false)
  // Review state
  const [reviews, setReviews] = useState<any[]>([])
  const [userReview, setUserReview] = useState<any>(null)
  const [reviewRating, setReviewRating] = useState<number>(0)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)
  const [productRating, setProductRating] = useState<any>(null)
  const [loadingReviews, setLoadingReviews] = useState(false)

  // Fetch product from API and check if in wishlist
  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true)
      try {
        // Fetch by slug - the backend also supports /api/products/slug/{slug} endpoint
        const response = await api.get(`/products/slug/${slug}`)
        const data = response.data || response
        // Handle both ApiResponse wrapper and direct response
        const productData = data.data || data

        // Ensure trackInventory is explicitly set from API (don't override with default if API provides it)
        const finalProduct = {
          images: [],
          reviews: [],
          specifications: [],
          ...productData,
          // Convert trackInventory to boolean properly (handles 1, true, "true", etc.)
          trackInventory: Boolean(productData.trackInventory)
        }
        setProduct(finalProduct)

        // Wishlist status will be loaded from WishlistContext via isInWishlist()
      } catch (error) {
        console.error('Error fetching product:', error)
        setProduct(null)
      } finally {
        setLoading(false)
      }
    }
    if (slug) {
      fetchProduct()
    }
  }, [slug])

  // Fetch reviews and user's review
  useEffect(() => {
    const fetchReviews = async () => {
      if (!product?.id) return

      setLoadingReviews(true)
      try {
        // Fetch all reviews
        const reviewsResponse = await api.get(`/products/${product.id}/reviews`)
        const reviewsData = reviewsResponse.data?.data || []
        setReviews(reviewsData)

        // Fetch product rating
        const ratingResponse = await api.get(`/products/${product.id}/reviews/rating`)
        console.log('⭐ Rating response:', ratingResponse.data)
        const ratingData = ratingResponse.data?.data || ratingResponse.data || null
        console.log('⭐ Rating data:', ratingData)
        setProductRating(ratingData)

        // Fetch user's review if logged in
        const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
        console.log('🔐 Token found:', !!token)
        if (token) {
          try {
            console.log('🔍 Fetching user review from:', `/products/${product.id}/reviews/my-review`)
            const userReviewResponse = await api.get(`/products/${product.id}/reviews/my-review`)
            console.log('📦 User review response:', userReviewResponse.data)
            
            // The response might be wrapped in ApiResponse or direct data
            // Try both: response.data.data (wrapped) OR response.data (direct)
            let userReviewData = userReviewResponse.data?.data || userReviewResponse.data
            
            // Check if it's actually a review object (has id and rating properties)
            const isValidReview = userReviewData && typeof userReviewData === 'object' && 
                                  'id' in userReviewData && 'rating' in userReviewData
            
            console.log('🔍 userReviewData:', userReviewData)
            console.log('🔍 isValidReview:', isValidReview)
            
            if (isValidReview) {
              setUserReview(userReviewData)
              setReviewRating(userReviewData.rating)
              setReviewComment(userReviewData.comment || '')
              console.log('✅ User review loaded:', userReviewData)
            } else {
              // User hasn't reviewed yet - reset form
              setUserReview(null)
              setReviewRating(0)
              setReviewComment('')
              console.log('ℹ️ No existing review from user')
            }
          } catch (error: any) {
            // User hasn't reviewed yet or authentication error - reset form
            setUserReview(null)
            setReviewRating(0)
            setReviewComment('')
            console.log('⚠️ Error fetching user review:')
            console.log('   Status:', error.response?.status)
            console.log('   Message:', error.message)
            console.log('   Response data:', error.response?.data)
          }
        } else {
          // Not logged in - reset form
          setUserReview(null)
          setReviewRating(0)
          setReviewComment('')
          console.log('ℹ️ User not logged in - no token found')
        }
      } catch (error) {
        console.error('❌ Error fetching reviews:', error)
      } finally {
        setLoadingReviews(false)
      }
    }

    fetchReviews()
  }, [product?.id])

  // Log productRating changes
  useEffect(() => {
    console.log('🌟 productRating state changed:', productRating)
  }, [productRating])

  // Submit or update review
  const handleSubmitReview = async () => {
    console.log('🔄 Submit review clicked')
    console.log('   userReview state:', userReview)
    console.log('   reviewRating:', reviewRating)
    console.log('   reviewComment:', reviewComment)
    
    if (!product?.id) {
      console.log('❌ No product ID')
      return
    }
    if (reviewRating === 0) {
      toast.error('Please select a rating')
      return
    }

    const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
    if (!token) {
      toast.error('Please log in to submit a review')
      navigate('/login')
      return
    }

    setSubmittingReview(true)

    try {
      const reviewData = {
        rating: reviewRating,
        comment: reviewComment
      }

      let response
      if (userReview) {
        // Update existing review
        console.log('✏️ Updating existing review:', userReview.id)
        response = await api.put(`/products/${product.id}/reviews/${userReview.id}`, reviewData)
        console.log('📦 Update response:', response.data)
        toast.success('Review updated successfully!')
      } else {
        // Create new review
        console.log('✍️ Creating new review')
        response = await api.post(`/products/${product.id}/reviews`, reviewData)
        console.log('📦 Create response:', response.data)
        toast.success('Review submitted successfully!')
      }

      // Refresh reviews
      const reviewsResponse = await api.get(`/products/${product.id}/reviews`)
      setReviews(reviewsResponse.data?.data || [])

      // Update product rating
      const ratingResponse = await api.get(`/products/${product.id}/reviews/rating`)
      console.log('⭐ Rating response after submit:', ratingResponse.data)
      const updatedRating = ratingResponse.data?.data || ratingResponse.data || null
      console.log('⭐ Updated rating data:', updatedRating)
      setProductRating(updatedRating)

      // Update user review state from response
      // Try both wrapped (data.data) and direct (data) response formats
      const newUserReview = response.data?.data || response.data
      console.log('🔍 Response data structure:', response.data)
      console.log('🔍 newUserReview:', newUserReview)
      
      // Check if it's a valid review object
      const isValidReview = newUserReview && typeof newUserReview === 'object' && 
                           'id' in newUserReview && 'rating' in newUserReview
      
      if (isValidReview) {
        setUserReview(newUserReview)
        setReviewRating(newUserReview.rating || 0)
        setReviewComment(newUserReview.comment || '')
        console.log('✅ Review state updated successfully:', newUserReview)
      } else {
        // Fallback: Fetch user review again to ensure state is correct
        console.log('⚠️ No review data in response, fetching again...')
        try {
          const userReviewResponse = await api.get(`/products/${product.id}/reviews/my-review`)
          // Try both wrapped and direct formats
          const fetchedReview = userReviewResponse.data?.data || userReviewResponse.data
          const isFetchedValid = fetchedReview && typeof fetchedReview === 'object' && 
                                'id' in fetchedReview && 'rating' in fetchedReview
          
          if (isFetchedValid) {
            setUserReview(fetchedReview)
            setReviewRating(fetchedReview.rating || 0)
            setReviewComment(fetchedReview.comment || '')
            console.log('✅ Review state updated from fetch:', fetchedReview)
          }
        } catch (fetchError) {
          console.error('❌ Error fetching user review after submit:', fetchError)
        }
      }
    } catch (error: any) {
      console.error('❌ Error submitting review:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Failed to submit review'
      toast.error(errorMessage)
    } finally {
      setSubmittingReview(false)
    }
  }

  // Delete review
  const handleDeleteReview = async () => {
    if (!product?.id || !userReview?.id) return

    if (!confirm('Are you sure you want to delete your review?')) return

    try {
      await api.delete(`/products/${product.id}/reviews/${userReview.id}`)
      toast.success('Review deleted successfully!')

      // Refresh reviews
      const reviewsResponse = await api.get(`/products/${product.id}/reviews`)
      setReviews(reviewsResponse.data?.data || [])

      // Update product rating
      const ratingResponse = await api.get(`/products/${product.id}/reviews/rating`)
      console.log('⭐ Rating response after delete:', ratingResponse.data)
      const updatedRating = ratingResponse.data?.data || ratingResponse.data || null
      console.log('⭐ Updated rating after delete:', updatedRating)
      setProductRating(updatedRating)

      // Clear user review state
      setUserReview(null)
      setReviewRating(0)
      setReviewComment('')
    } catch (error: any) {
      console.error('Error deleting review:', error)
      toast.error(error.response?.data?.message || 'Failed to delete review')
    }
  }

  // Fetch variant combination details when all variations are selected
  useEffect(() => {
    const shouldFetch = product?.variations && product.variations.length > 0 &&
                       product.variations.every((v: any) => selectedVariations.has(v.id))

    if (!shouldFetch) {
      setSelectedVariantCombination(null)
      return
    }

    setLoadingVariantDetails(true)

    try {
      // Get selected variation option IDs
      const selectedOptionIds = Array.from(selectedVariations.values()).map(opt => opt.id)
      
      // Find matching variant combination from product data
      const matchingCombination = product.variantCombinations?.find((combo: any) => {
        // The API returns optionIds array directly
        const comboOptionIds = combo.optionIds || []
        return selectedOptionIds.length === comboOptionIds.length &&
               selectedOptionIds.every(id => comboOptionIds.includes(id))
      })

      if (matchingCombination) {
        setSelectedVariantCombination(matchingCombination)
      } else {
        // Fallback: Calculate price from selected options
        const adjustment = Array.from(selectedVariations.values()).reduce((sum, opt) => {
          return sum + (opt.priceAdjustment || 0)
        }, 0)

        setSelectedVariantCombination({
          id: null, // No actual combination found
          price: (product.regularPrice || product.price || 0) + adjustment,
          stock: null // Unknown stock
        })
      }
    } finally {
      setLoadingVariantDetails(false)
    }
  }, [selectedVariations, product?.variations, product?.variantCombinations, product?.regularPrice, product?.price])

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Loading...</Typography>
      </Box>
    )
  }

  if (!product) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Product not found</Typography>
      </Box>
    )
  }

  // Handler for image loading errors
  const handleImageError = (imageUrl: string) => {
    setFailedImages(prev => new Set([...prev, imageUrl]))
  }

  // Get valid image URL or placeholder
  const getDisplayImageUrl = (imageUrl: string) => {
    if (failedImages.has(imageUrl)) {
      return 'https://via.placeholder.com/500x500?text=Image+Not+Available'
    }
    return imageUrl
  }

  // Handler for sharing product
  const handleShare = async () => {
    const productUrl = window.location.href
    const productTitle = product?.title || product?.name || 'Product'
    const productDescription = product?.description || 'Check out this amazing product!'

    // Check if Web Share API is supported
    if (navigator.share) {
      try {
        await navigator.share({
          title: productTitle,
          text: productDescription,
          url: productUrl,
        })
        toast.success('Product shared successfully!')
      } catch (error: any) {
        // User cancelled the share or error occurred
        if (error.name !== 'AbortError') {
          console.error('Error sharing:', error)
          // Fallback to clipboard
          fallbackCopyToClipboard(productUrl)
        }
      }
    } else {
      // Fallback: Copy to clipboard
      fallbackCopyToClipboard(productUrl)
    }
  }

  // Fallback function to copy URL to clipboard
  const fallbackCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(
      () => {
        toast.success('Product link copied to clipboard!')
      },
      (err) => {
        console.error('Could not copy text:', err)
        toast.error('Failed to copy link')
      }
    )
  }

  // Calculate total price from all selected variation options
  const calculateTotalPrice = () => {
    let totalAdjustment = 0;

    // Add price adjustments from all selected variations
    selectedVariations.forEach((option) => {
      if (option && option.priceAdjustment) {
        totalAdjustment += option.priceAdjustment;
      }
    });

    return totalAdjustment;
  };

  // Base price from product
  const basePrice = product.regularPrice || product.originalPrice || product.price || 0;
  const baseSalePrice = product.salePrice || product.price || 0;

  // Add all variation price adjustments
  const variationPriceAdjustment = calculateTotalPrice();

  // Final prices with variation adjustments
  const finalBasePrice = basePrice + variationPriceAdjustment;
  const finalSalePrice = (baseSalePrice ? baseSalePrice + variationPriceAdjustment : finalBasePrice);

  // Display logic
  const displayPrice = (finalSalePrice && finalSalePrice < finalBasePrice) ? finalSalePrice : finalBasePrice;
  const displayOriginalPrice = (finalSalePrice && finalSalePrice < finalBasePrice) ? finalBasePrice : 0;

  const discount = displayOriginalPrice && displayPrice && displayOriginalPrice > displayPrice
    ? ((displayOriginalPrice - displayPrice) / displayOriginalPrice * 100).toFixed(0)
    : 0;

  // Check if all required variations are selected
  const allVariationsSelected = product.variations && product.variations.length > 0
    ? product.variations.every((variation: any) => selectedVariations.has(variation.id))
    : true;

  // Helper function to check if product has stock
  // Respects inventory tracking flag and prioritizes variation stock
  const hasStock = () => {
    if (!product) {
      return false;
    }

    // If inventory tracking is disabled, always in stock
    if (!product.trackInventory) {
      return true;
    }

    // If product has variations and all are selected, check variant combination stock
    if (product.variations && product.variations.length > 0 && allVariationsSelected) {
      if (selectedVariantCombination) {
        const stock = selectedVariantCombination.stock || selectedVariantCombination.stockQuantity
        // If combination exists and has stock defined, use it
        if (stock != null && stock > 0) {
          return true;
        }
        // If combination exists but stock is null/undefined/0, check selected options as fallback
        if (stock == null) {
          // Check if all selected variation options have stock
          const allSelectedHaveStock = Array.from(selectedVariations.values()).every((option: any) =>
            option.stockQuantity != null && option.stockQuantity > 0
          );
          return allSelectedHaveStock;
        }
        return false; // Combination has stock = 0
      }
      // No combination found - check if selected options have stock
      const allSelectedHaveStock = Array.from(selectedVariations.values()).every((option: any) =>
        option.stockQuantity != null && option.stockQuantity > 0
      );
      return allSelectedHaveStock;
    }

    // If product has variations but not all selected
    if (product.variations && product.variations.length > 0) {
      if (selectedVariations.size === 0) {
        // No variations selected yet - check if ANY variation option has stock
        return product.variations.some((variation: any) =>
          variation.options && variation.options.some((option: any) =>
            option.stockQuantity && option.stockQuantity > 0
          )
        );
      } else {
        // Some variations selected - check if ALL selected options have stock
        return Array.from(selectedVariations.values()).every((option: any) =>
          option.stockQuantity && option.stockQuantity > 0
        );
      }
    }

    // No variations - check product-level stock
    return product.stockQuantity > 0;
  };

  return (
    <Box sx={{ bgcolor: alpha(theme.palette.primary.main, 0.02), minHeight: '100vh', py: 4 }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Product Images */}
          <Grid item xs={12} md={6}>
            <Box>
              {/* Main Image - Show variation image if selected, otherwise product image */}
              <Card
                sx={{
                  mb: 2,
                  overflow: 'hidden',
                  borderRadius: 3,
                  boxShadow: theme.shadows[10],
                  bgcolor: '#f9f9f9',
                  position: 'relative'
                }}
              >
                <Box
                  component="img"
                  src={
                    Array.from(selectedVariations.values()).find(v => v?.imageUrl) && Array.from(selectedVariations.values()).find(v => v?.imageUrl)?.imageUrl
                      ? getDisplayImageUrl(getImageUrl(Array.from(selectedVariations.values()).find(v => v?.imageUrl)?.imageUrl || ''))
                      : getDisplayImageUrl(
                          getImageUrl(
                            product.images?.[selectedImage]?.url ||
                            product.images?.[selectedImage] ||
                            ''
                          )
                        )
                  }
                  alt={product.title || product.name}
                  onError={(e: any) => {
                    const currentSrc = e.currentTarget.src
                    if (!currentSrc.includes('placeholder')) {
                      handleImageError(currentSrc)
                    }
                  }}
                  sx={{
                    width: '100%',
                    height: 450,
                    objectFit: 'contain',
                    padding: 2
                  }}
                />

                {/* Navigation Arrows for Product Images */}
                {product.images && product.images.length > 1 && selectedVariations.size === 0 && (
                  <>
                    {/* Left Arrow */}
                    <IconButton
                      onClick={() => {
                        setSelectedImage(prev =>
                          prev === 0 ? product.images.length - 1 : prev - 1
                        );
                      }}
                      sx={{
                        position: 'absolute',
                        left: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: alpha(theme.palette.common.white, 0.9),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.common.white, 1),
                          transform: 'translateY(-50%) scale(1.1)'
                        },
                        boxShadow: theme.shadows[4],
                        zIndex: 10,
                        transition: 'all 0.3s ease'
                      }}
                      size="large"
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: '1.8rem',
                          fontWeight: 'bold',
                          color: theme.palette.primary.main,
                          lineHeight: 1
                        }}
                      >
                        ‹
                      </Box>
                    </IconButton>

                    {/* Right Arrow */}
                    <IconButton
                      onClick={() => {
                        setSelectedImage(prev =>
                          prev === product.images.length - 1 ? 0 : prev + 1
                        );
                      }}
                      sx={{
                        position: 'absolute',
                        right: 16,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        bgcolor: alpha(theme.palette.common.white, 0.9),
                        '&:hover': {
                          bgcolor: alpha(theme.palette.common.white, 1),
                          transform: 'translateY(-50%) scale(1.1)'
                        },
                        boxShadow: theme.shadows[4],
                        zIndex: 10,
                        transition: 'all 0.3s ease'
                      }}
                      size="large"
                    >
                      <Box
                        component="span"
                        sx={{
                          fontSize: '1.8rem',
                          fontWeight: 'bold',
                          color: theme.palette.primary.main,
                          lineHeight: 1
                        }}
                      >
                        ›
                      </Box>
                    </IconButton>

                    {/* Image Counter */}
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 16,
                        right: 16,
                        bgcolor: alpha(theme.palette.common.black, 0.6),
                        color: theme.palette.common.white,
                        px: 2,
                        py: 0.75,
                        borderRadius: 1,
                        fontSize: '0.875rem',
                        fontWeight: 700,
                        zIndex: 10
                      }}
                    >
                      {selectedImage + 1} / {product.images.length}
                    </Box>
                  </>
                )}
              </Card>
            </Box>
          </Grid>

          {/* Product Info */}
          <Grid item xs={12} md={6}>
            <Box>
              {/* Product Name */}
              <Typography
                variant="h2"
                gutterBottom
                sx={{
                  fontWeight: 800,
                  mb: 2,
                  fontSize: { xs: '1.8rem', sm: '2.2rem', md: '2.5rem' },
                  color: '#000'
                }}
              >
                {product.name || product.title}
              </Typography>

              {/* Rating and Reviews Count */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Rating 
                    value={productRating?.averageRating || 5} 
                    readOnly 
                    size="small" 
                    precision={0.5}
                  />
                  <Typography variant="body2" sx={{ color: 'text.secondary', ml: 0.5 }}>
                    ({productRating?.totalReviews || 0} review{productRating?.totalReviews !== 1 ? 's' : ''})
                  </Typography>
                </Box>
              </Box>

              {/* Price Section - Only show when all variations are selected */}
              {product.variations && product.variations.length > 0 ? (
                // Product has variations
                allVariationsSelected ? (
                  // All variations selected - show price
                  <Card sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                    {loadingVariantDetails ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 2 }}>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                          Fetching variant details...
                        </Typography>
                      </Box>
                    ) : selectedVariantCombination ? (
                      <>
                        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                          <Typography
                            variant="h3"
                            sx={{
                              fontWeight: 800,
                              color: theme.palette.primary.main
                            }}
                          >
                            ₹{(selectedVariantCombination.price || displayPrice).toFixed(2)}
                          </Typography>
                        </Box>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                          Inclusive of all taxes
                        </Typography>
                      </>
                    ) : null}
                  </Card>
                ) : (
                  // Variations not selected - show message
                  <Card sx={{ p: 3, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.08), border: `2px dashed ${alpha(theme.palette.info.main, 0.5)}` }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.info.main, flex: 1 }}>
                        ✓ Select all options to see price
                      </Typography>
                    </Box>
                  </Card>
                )
              ) : (
                // Product has no variations - show price normally
                <Card sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.05), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 2, mb: 1, flexWrap: 'wrap' }}>
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 800,
                        color: theme.palette.primary.main
                      }}
                    >
                      ₹{displayPrice.toFixed(2)}
                    </Typography>
                    {displayOriginalPrice > displayPrice && (
                      <>
                        <Typography
                          variant="h6"
                          sx={{
                            textDecoration: 'line-through',
                            color: 'text.secondary',
                            fontWeight: 600
                          }}
                        >
                          ₹{displayOriginalPrice.toFixed(2)}
                        </Typography>
                        <Chip
                          label={`${discount}% OFF`}
                          color="error"
                          size="small"
                          sx={{ fontWeight: 700 }}
                        />
                      </>
                    )}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                    Inclusive of all taxes
                  </Typography>
                </Card>
              )}

              {/* Stock & Availability - Only show if inventory tracking is enabled */}
              {product.trackInventory === true && (
                <Card sx={{
                  p: 2,
                  mb: 3,
                  bgcolor: hasStock()
                    ? alpha(theme.palette.success.main, 0.08)
                    : alpha(theme.palette.error.main, 0.08),
                  border: `1px solid ${hasStock() ? alpha(theme.palette.success.main, 0.3) : alpha(theme.palette.error.main, 0.3)}`
                }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                        Availability
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontWeight: 700,
                          color: hasStock() ? 'success.main' : 'error.main'
                        }}
                      >
                        {hasStock() ? 'In Stock' : 'Out of Stock'}
                      </Typography>
                    </Box>
                    {hasStock() && product.trackInventory && (
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                          Available Quantity
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 700, color: 'success.main' }}>
                          {/* Show minimum stock from selected variations, or product stock if no variations */}
                          {product.variations && product.variations.length > 0 && selectedVariations.size > 0
                            ? (() => {
                                const selectedOptions = Array.from(selectedVariations.values());
                                return selectedOptions.reduce((minStock, option) => {
                                  const optionStock = option.stockQuantity || 0;
                                  return minStock === null ? optionStock : Math.min(minStock, optionStock);
                                }, null as number | null) || 0;
                              })()
                            : product.stockQuantity || 0}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Card>
              )}

              {/* Description */}
              {product.description && (
                <Card sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.info.main, 0.02) }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                    About this Product
                  </Typography>
                  <Typography variant="body2" paragraph sx={{ lineHeight: 1.6, color: 'text.secondary', mb: 0 }}>
                    {product.description}
                  </Typography>
                </Card>
              )}

              {/* Key Specifications Quick View */}
              <Card sx={{ p: 2, mb: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                  Key Features
                </Typography>
                <Stack spacing={1}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Product Code</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.sku || product.code || 'N/A'}
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}` }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>Category</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {product.categoryName || 'Uncategorized'}
                    </Typography>
                  </Box>
                  {product.trackInventory === true && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>Availability</Typography>
                      <Chip
                        label={hasStock() ? 'In Stock' : 'Out of Stock'}
                        size="small"
                        color={hasStock() ? 'success' : 'error'}
                        variant="outlined"
                      />
                    </Box>
                  )}
                </Stack>
              </Card>

              {/* Product Variations - New Architecture with Type and Options */}
              {product.variations && product.variations.length > 0 && (
                <Box sx={{ mb: 4 }}>
                  {product.variations.map((variation: any) => {
                    // Determine if this is a color variation based on type or if options have imageUrl
                    const isColorVariation = variation.type?.toLowerCase() === 'color' ||
                                            (variation.options && variation.options[0]?.imageUrl);

                    return (
                      <Box key={variation.id} sx={{ mb: 2.5 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: 600,
                            mb: 1,
                            color: '#333',
                            fontSize: '0.9rem',
                            textTransform: 'capitalize'
                          }}
                        >
                          {variation.type}:
                        </Typography>

                        {isColorVariation ? (
                          // Color variation: Show as color boxes with actual colors
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
                            {variation.options && variation.options.map((option: any) => {
                              // Map color names to hex codes
                              const colorMap: { [key: string]: string } = {
                                'red': '#d32f2f',
                                'blue': '#1976d2',
                                'green': '#388e3c',
                                'black': '#000000',
                                'white': '#ffffff',
                                'gray': '#757575',
                                'grey': '#757575',
                                'yellow': '#fbc02d',
                                'orange': '#f57c00',
                                'purple': '#7b1fa2',
                                'pink': '#c2185b',
                                'brown': '#5d4037',
                                'navy': '#01579b',
                                'gold': '#d4af37',
                                'silver': '#c0c0c0',
                                'beige': '#f5f5dc',
                                'tan': '#d2b48c',
                                'maroon': '#800000',
                                'teal': '#008080',
                                'khaki': '#f0e68c'
                              };

                              const colorName = option.name.toLowerCase();
                              const colorCode = colorMap[colorName] || '#ddd';

                              return (
                                <Box
                                  key={option.id}
                                  onClick={() => {
                                    if (option.stockQuantity && option.stockQuantity > 0) {
                                      setSelectedVariations(prev => new Map(prev).set(variation.id, option));
                                    }
                                  }}
                                  title={option.name}
                                  sx={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: '4px',
                                    border: selectedVariations.get(variation.id)?.id === option.id ? '3px solid #333' : '2px solid #ddd',
                                    bgcolor: colorCode,
                                    boxShadow: colorCode === '#ffffff' ? 'inset 0 0 0 1px #ddd' : 'none',
                                    cursor: option.stockQuantity && option.stockQuantity > 0 ? 'pointer' : 'not-allowed',
                                    transition: 'all 0.3s ease',
                                    opacity: option.stockQuantity && option.stockQuantity > 0 ? 1 : 0.5,
                                    pointerEvents: option.stockQuantity && option.stockQuantity > 0 ? 'auto' : 'none',
                                    position: 'relative',
                                    '&:hover': option.stockQuantity && option.stockQuantity > 0 ? {
                                      transform: 'scale(1.1)',
                                      boxShadow: colorCode === '#ffffff' ? 'inset 0 0 0 1px #ddd, 0 2px 8px rgba(0,0,0,0.15)' : '0 2px 8px rgba(0,0,0,0.15)'
                                    } : {}
                                  }}
                                >
                                  {(!option.stockQuantity || option.stockQuantity <= 0) && (
                                    <Box
                                      sx={{
                                        position: 'absolute',
                                        top: -6,
                                        right: -6,
                                        width: 16,
                                        height: 16,
                                        borderRadius: '50%',
                                        bgcolor: '#d32f2f',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontSize: '0.6rem',
                                        fontWeight: 'bold'
                                      }}
                                    >
                                      ✕
                                    </Box>
                                  )}
                                </Box>
                              );
                            })}
                          </Box>
                        ) : (
                          // Size/Other variation: Show as text links
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                            {variation.options && variation.options.map((option: any) => (
                              <Typography
                                key={option.id}
                                onClick={() => {
                                  if (option.stockQuantity && option.stockQuantity > 0) {
                                    setSelectedVariations(prev => new Map(prev).set(variation.id, option));
                                  }
                                }}
                                component="span"
                                sx={{
                                  cursor: option.stockQuantity && option.stockQuantity > 0 ? 'pointer' : 'not-allowed',
                                  padding: '6px 12px',
                                  border: selectedVariations.get(variation.id)?.id === option.id ? '2px solid #333' : '1px solid #ddd',
                                  borderRadius: '3px',
                                  fontSize: '0.9rem',
                                  fontWeight: selectedVariations.get(variation.id)?.id === option.id ? 600 : 500,
                                  color: selectedVariations.get(variation.id)?.id === option.id ? '#333' : '#666',
                                  bgcolor: selectedVariations.get(variation.id)?.id === option.id ? '#f5f5f5' : 'transparent',
                                  opacity: option.stockQuantity && option.stockQuantity > 0 ? 1 : 0.4,
                                  transition: 'all 0.2s ease',
                                  position: 'relative',
                                  '&:hover': option.stockQuantity && option.stockQuantity > 0 ? {
                                    borderColor: '#333',
                                    bgcolor: '#f5f5f5'
                                  } : {},
                                  textDecoration: (!option.stockQuantity || option.stockQuantity <= 0) ? 'line-through' : 'none'
                                }}
                              >
                                {option.name}
                              </Typography>
                            ))}
                          </Box>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}

              {/* Quantity Selector - Only show when all variations are selected or product has no variations */}
              {!product.variations || product.variations.length === 0 || allVariationsSelected ? (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                    Quantity
                  </Typography>
                  <Box
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 2,
                      bgcolor: alpha(theme.palette.primary.main, 0.05),
                      borderRadius: 2,
                      p: 1
                    }}
                  >
                    <IconButton
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      sx={{
                        bgcolor: 'white',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                    >
                      <Remove />
                    </IconButton>
                    <Typography sx={{ minWidth: 40, textAlign: 'center', fontWeight: 700, fontSize: '1.2rem' }}>
                      {quantity}
                    </Typography>
                    <IconButton
                      onClick={() => {
                        // Calculate max available stock based on variations or product stock
                        let maxStock = 0;
                        
                        if (product.trackInventory) {
                          if (product.variations && product.variations.length > 0) {
                            // For products with variations, get the minimum stock across selected variations
                            const selectedOptions = Array.from(selectedVariations.values());
                            if (selectedOptions.length > 0) {
                              maxStock = selectedOptions.reduce((min, option) => {
                                const optionStock = option.stockQuantity || 0;
                                return min === 0 ? optionStock : Math.min(min, optionStock);
                              }, 0);
                            }
                          } else {
                            // For products without variations, use product stock
                            maxStock = product.stockQuantity || 0;
                          }
                        } else {
                          // If inventory tracking is disabled, allow large quantity (up to 999)
                          maxStock = 999;
                        }
                        
                        // Only increment if below max stock
                        if (quantity < maxStock) {
                          setQuantity(quantity + 1);
                        } else {
                          toast.warning(`Maximum available stock: ${maxStock}`);
                        }
                      }}
                      sx={{
                        bgcolor: 'white',
                        '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                      }}
                    >
                      <Add />
                    </IconButton>
                  </Box>
                </Box>
              ) : null}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<ShoppingCart />}
                  disabled={
                    (product.variations && product.variations.length > 0 && !allVariationsSelected) ||
                    !hasStock()
                  }
                  onClick={async () => {
                    try {
                      // Check if user is logged in
                      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
                      if (!token) {
                        toast.error('Please log in to add items to cart')
                        navigate('/login')
                        return
                      }

                      // Check if variations exist and all are selected
                      if (product.variations && product.variations.length > 0 && !allVariationsSelected) {
                        toast.error('Please select all variations')
                        return
                      }

                      // Validate stock before adding to cart
                      if (product.trackInventory) {
                        let maxStock = 0;
                        
                        if (product.variations && product.variations.length > 0) {
                          // Check minimum stock across selected variations
                          const selectedOptions = Array.from(selectedVariations.values());
                          if (selectedOptions.length > 0) {
                            maxStock = selectedOptions.reduce((min, option) => {
                              const optionStock = option.stockQuantity || 0;
                              return min === 0 ? optionStock : Math.min(min, optionStock);
                            }, 0);
                          }
                        } else {
                          // Use product stock
                          maxStock = product.stockQuantity || 0;
                        }
                        
                        if (quantity > maxStock) {
                          toast.error(`Only ${maxStock} items available in stock`);
                          setQuantity(Math.min(quantity, maxStock));
                          return;
                        }
                      }

                      // Determine what to send based on product variations
                      let requestBody: any = {
                        productId: product.id,
                        quantity: quantity
                      }

                      // If product has multiple variations and all are selected, send variantCombinationId
                      if (product.variations && product.variations.length > 0 && allVariationsSelected) {
                        if (selectedVariantCombination?.id) {
                          requestBody.variantCombinationId = selectedVariantCombination.id
                        } else {
                          // No valid combination found - should not happen if validation is correct
                          toast.error('Unable to find the selected variant combination. Please try again.')
                          return
                        }
                      } else if (selectedVariations.size > 0) {
                        // Single variation selected (backward compatibility)
                        requestBody.variationId = Array.from(selectedVariations.values())[0].id
                      }

                      await api.post('/cart/items', requestBody)

                      const productName = product.name || product.title || 'Product'
                      const variationText = selectedVariations.size > 0
                        ? ` (${Array.from(selectedVariations.values()).map(v => v.name).join(', ')})`
                        : ''
                      toast.success(`${productName}${variationText} added to cart!`)
                      setQuantity(1) // Reset quantity after adding
                      setSelectedVariations(new Map()) // Reset variation selection
                      // Trigger cart update event
                      window.dispatchEvent(new CustomEvent('cartUpdated'))
                      // Navigate to cart page
                      navigate('/cart')
                    } catch (error) {
                      console.error('Error adding to cart:', error)
                      toast.error(error instanceof Error ? error.message : 'Failed to add to cart')
                    }
                  }}
                  sx={{
                    flex: 1,
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 700,
                    boxShadow: theme.shadows[10]
                  }}
                >
                  {product.variations && product.variations.length > 0 && !allVariationsSelected
                    ? 'Select All Variations'
                    : !hasStock()
                    ? 'Out of Stock'
                    : 'Add to Cart'}
                </Button>
                <IconButton
                  size="large"
                  onClick={async () => {
                    if (!product?.id) return
                    try {
                      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
                      if (!token) {
                        toast.error('Please log in to add to wishlist')
                        return
                      }

                      const isFavorited = isInWishlist(product.id)
                      
                      if (isFavorited) {
                        await api.delete(`/wishlist/${product.id}`)
                        removeFromWishlist(product.id)
                      } else {
                        await api.post(`/wishlist/${product.id}`)
                        addToWishlist(product.id)
                      }

                      toast.success(isFavorited ? 'Removed from wishlist' : 'Added to wishlist')
                    } catch (error) {
                      console.error('Error updating wishlist:', error)
                      toast.error('Failed to update wishlist')
                    }
                  }}
                  sx={{
                    border: `2px solid ${theme.palette.primary.main}`,
                    color: isInWishlist(product.id) ? theme.palette.error.main : theme.palette.primary.main
                  }}
                >
                  {isInWishlist(product.id) ? <Favorite /> : <FavoriteBorder />}
                </IconButton>
                <IconButton
                  size="large"
                  onClick={handleShare}
                  sx={{
                    border: `2px solid ${theme.palette.primary.main}`,
                    color: theme.palette.primary.main
                  }}
                >
                  <Share />
                </IconButton>
              </Box>

              {/* Detailed Specifications */}
              <Card sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02), border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}` }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
                  Detailed Specifications
                </Typography>
                {product.specifications && product.specifications.length > 0 ? (
                  <Grid container spacing={2}>
                    {product.specifications.map((spec: any, index: number) => (
                      <Grid item xs={12} sm={6} key={index}>
                        <Box sx={{ pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            {spec.label}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#000' }}>
                            {spec.value}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                      Standard specifications for this product:
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Material
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Premium Quality
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Warranty
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            1 Year
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Shipping
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            Free Delivery
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Return Policy
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            30 Days
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Availability
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            In Stock
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ pb: 1.5, borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}` }}>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 0.5 }}>
                            Authenticity
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            100% Genuine
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                )}
              </Card>
            </Box>
          </Grid>
        </Grid>

        {/* Tabs for Description & Reviews */}
        <Box sx={{ mt: 6 }}>
          <Tabs
            value={tabValue}
            onChange={(_, newValue) => setTabValue(newValue)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                fontSize: '1.1rem',
                fontWeight: 600,
                textTransform: 'none'
              }
            }}
          >
            <Tab label="Description" />
            <Tab label={`Reviews (${productRating?.totalReviews || 0})`} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.8 }}>
              {product.description}
            </Typography>
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              These premium headphones deliver exceptional audio quality with deep bass and crystal-clear highs. 
              The active noise cancellation technology blocks out unwanted ambient noise, allowing you to fully 
              immerse yourself in your music. With a battery life of up to 30 hours, you can enjoy your favorite 
              tracks all day long without worrying about recharging.
            </Typography>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Add/Edit Review Form */}
              <Card sx={{ p: 3, bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  {userReview ? '✏️ Edit Your Review' : '✍️ Write a Review'}
                </Typography>
                
                {userReview && (
                  <Box sx={{ mb: 2, p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.1), borderRadius: 1, border: `1px solid ${alpha(theme.palette.info.main, 0.3)}` }}>
                    <Typography variant="body2" sx={{ color: 'info.main', fontWeight: 600 }}>
                      You already reviewed this product. You can update your review below.
                    </Typography>
                  </Box>
                )}
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    Rating *
                  </Typography>
                  <Rating
                    value={reviewRating}
                    onChange={(_, newValue) => setReviewRating(newValue || 0)}
                    size="large"
                    sx={{ fontSize: '2rem' }}
                  />
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                    Comment (Optional)
                  </Typography>
                  <Box
                    component="textarea"
                    value={reviewComment}
                    onChange={(e: any) => setReviewComment(e.target.value)}
                    placeholder="Share your experience with this product..."
                    sx={{
                      width: '100%',
                      minHeight: 120,
                      p: 1.5,
                      border: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
                      borderRadius: 1,
                      fontSize: '1rem',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      '&:focus': {
                        outline: 'none',
                        borderColor: theme.palette.primary.main
                      }
                    }}
                  />
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="contained"
                    onClick={handleSubmitReview}
                    disabled={submittingReview || reviewRating === 0 || loadingReviews}
                    sx={{ minWidth: 120 }}
                  >
                    {loadingReviews ? 'Loading...' : submittingReview ? 'Submitting...' : (userReview ? 'Update Review' : 'Submit Review')}
                  </Button>
                  
                  {userReview && (
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleDeleteReview}
                      disabled={submittingReview}
                    >
                      Delete Review
                    </Button>
                  )}
                </Box>
              </Card>

              {/* Display Reviews */}
              {reviews.length > 0 ? (
                reviews.map((review: any) => (
                  <Card key={review.id} sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                        {review.userName ? review.userName[0].toUpperCase() : 'U'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                          {review.userName || 'Anonymous'}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(review.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                      </Box>
                      <Rating value={review.rating} readOnly />
                    </Box>
                    {review.comment && (
                      <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
                        {review.comment}
                      </Typography>
                    )}
                  </Card>
                ))
              ) : (
                <Card sx={{ p: 4, textAlign: 'center', bgcolor: alpha(theme.palette.primary.main, 0.02) }}>
                  <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                    No reviews yet
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Be the first to review this product!
                  </Typography>
                </Card>
              )}
            </Box>
          </TabPanel>
        </Box>
      </Container>
    </Box>
  )
}
