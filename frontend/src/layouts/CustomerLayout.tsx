import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  Badge,
  alpha,
  useTheme,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon
} from '@mui/material'
import {
  ShoppingCart as CartIcon,
  Favorite,
  Person,
  Logout as LogoutIcon,
  Settings,
  History,
  AccountBox
} from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useWishlist } from '../contexts/WishlistContext'

export default function CustomerLayout() {
  const navigate = useNavigate()
  const { isAuthenticated, logout } = useAuth()
  const { wishlistCount } = useWishlist()
  const theme = useTheme()
  const [cartCount, setCartCount] = useState(0)
  const [profileMenuAnchor, setProfileMenuAnchor] = useState<null | HTMLElement>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const [wishlistAnimating, setWishlistAnimating] = useState(false)

  // Get user name from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}')
  const userName = userData.firstName || userData.name || 'Customer'

  // Fetch initial cart count on login
  useEffect(() => {
    if (isAuthenticated) {
      fetchCartCount()

      // Listen for cart update events from product pages
      const handleCartUpdate = () => {
        fetchCartCount()
      }
      window.addEventListener('cartUpdated', handleCartUpdate)

      return () => {
        window.removeEventListener('cartUpdated', handleCartUpdate)
      }
    }
  }, [isAuthenticated])

  // Handle wishlist count animation
  useEffect(() => {
    if (wishlistCount > 0) {
      setWishlistAnimating(true)
      setTimeout(() => setWishlistAnimating(false), 600)
    }
  }, [wishlistCount])

  const fetchCartCount = async () => {
    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('token')
      if (!token) return

      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        const newCount = data.data?.totalItems || 0

        // Trigger animation if count changed
        if (newCount !== cartCount) {
          setIsAnimating(true)
          setCartCount(newCount)
          // Remove animation class after animation completes
          setTimeout(() => setIsAnimating(false), 600)
        }
      }
    } catch (error) {
      console.error('Error fetching cart count:', error)
    }
  }

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      <AppBar
        position="fixed"
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: theme.shadows[12],
          borderRadius: 0
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            {/* Logo/Avatar */}
            <Avatar
              sx={{
                bgcolor: alpha('#ffffff', 0.2),
                width: 45,
                height: 45,
                border: `2px solid ${alpha('#ffffff', 0.3)}`,
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            >
              <Person />
            </Avatar>
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  lineHeight: 1.2,
                  cursor: 'pointer',
                  color: '#ffffff'
                }}
                onClick={() => navigate('/')}
              >
                FASCINITO
              </Typography>
              {isAuthenticated && (
                <Chip
                  label={`Welcome, ${userName}`}
                  size="small"
                  sx={{
                    height: 20,
                    bgcolor: alpha('#ffffff', 0.25),
                    color: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              )}
              {!isAuthenticated && (
                <Typography
                  variant="caption"
                  sx={{
                    color: alpha('#ffffff', 0.8),
                    fontWeight: 500,
                    fontSize: '0.7rem'
                  }}
                >
                  Online Shopping
                </Typography>
              )}
            </Box>
          </Box>

          {/* Navigation Buttons */}
          <Button
            color="inherit"
            onClick={() => navigate('/')}
            sx={{
              mx: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.1)
              }
            }}
          >
            Home
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/products')}
            sx={{
              mx: 1,
              fontWeight: 600,
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.1)
              }
            }}
          >
            Products
          </Button>

          {isAuthenticated ? (
            <>
              {/* Wishlist Icon */}
              <IconButton
                color="inherit"
                onClick={() => navigate('/wishlist')}
                sx={{
                  mx: 0.5,
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.1)
                  }
                }}
              >
                <Badge
                  badgeContent={wishlistCount}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      animation: wishlistAnimating ? 'pulse-scale 0.6s ease-in-out' : 'none',
                      '@keyframes pulse-scale': {
                        '0%': {
                          transform: 'scale(0.8)',
                          opacity: 0.8
                        },
                        '50%': {
                          transform: 'scale(1.3)',
                          opacity: 1
                        },
                        '100%': {
                          transform: 'scale(1)',
                          opacity: 1
                        }
                      }
                    }
                  }}
                >
                  <Favorite />
                </Badge>
              </IconButton>

              {/* Cart Icon */}
              <IconButton
                color="inherit"
                onClick={() => navigate('/cart')}
                sx={{
                  mx: 0.5,
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.1)
                  }
                }}
              >
                <Badge
                  badgeContent={cartCount}
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      animation: isAnimating ? 'pulse-scale 0.6s ease-in-out' : 'none',
                      '@keyframes pulse-scale': {
                        '0%': {
                          transform: 'scale(0.8)',
                          opacity: 0.8
                        },
                        '50%': {
                          transform: 'scale(1.3)',
                          opacity: 1
                        },
                        '100%': {
                          transform: 'scale(1)',
                          opacity: 1
                        }
                      }
                    }
                  }}
                >
                  <CartIcon />
                </Badge>
              </IconButton>

              {/* Profile Dropdown Menu */}
              <IconButton
                color="inherit"
                onClick={(e) => setProfileMenuAnchor(e.currentTarget)}
                sx={{
                  mx: 0.5,
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.1)
                  }
                }}
              >
                <Person />
              </IconButton>

              <Menu
                anchorEl={profileMenuAnchor}
                open={Boolean(profileMenuAnchor)}
                onClose={() => setProfileMenuAnchor(null)}
                anchorOrigin={{
                  vertical: 'bottom',
                  horizontal: 'right'
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right'
                }}
              >
                <MenuItem sx={{ minWidth: 200 }} disabled>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {userName}
                  </Typography>
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    navigate('/profile')
                    setProfileMenuAnchor(null)
                  }}
                >
                  <ListItemIcon>
                    <AccountBox fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2">Profile</Typography>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    navigate('/orders')
                    setProfileMenuAnchor(null)
                  }}
                >
                  <ListItemIcon>
                    <History fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2">My Orders</Typography>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    navigate('/settings')
                    setProfileMenuAnchor(null)
                  }}
                >
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2">Settings</Typography>
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    logout()
                    setProfileMenuAnchor(null)
                  }}
                  sx={{ color: theme.palette.error.main }}
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" sx={{ color: theme.palette.error.main }} />
                  </ListItemIcon>
                  <Typography variant="body2">Logout</Typography>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={() => navigate('/login')}
                sx={{
                  mx: 1,
                  fontWeight: 600,
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.1)
                  }
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/signup')}
                sx={{
                  ml: 1,
                  fontWeight: 600,
                  bgcolor: 'white',
                  color: theme.palette.primary.main,
                  '&:hover': {
                    bgcolor: alpha('#ffffff', 0.9)
                  }
                }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          marginTop: { xs: '64px', sm: '64px' },
          flex: 1,
          width: '100%'
        }}
      >
        <Outlet />
      </Box>

      {/* Footer */}
      <Box
        component="footer"
        sx={{
          bgcolor: '#1a1a2e',
          color: 'white',
          py: 3,
          mt: 4,
          flexShrink: 0
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 3, mb: 2 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
                FASCINITO
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, maxWidth: 250, display: 'block' }}>
                Your ultimate shopping destination for quality products at the best prices.
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Quick Links
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', cursor: 'pointer', mb: 0.5 }}>
                About Us
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', cursor: 'pointer', mb: 0.5 }}>
                Contact
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', cursor: 'pointer' }}>
                FAQs
              </Typography>
            </Box>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Customer Service
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', cursor: 'pointer', mb: 0.5 }}>
                Shipping Info
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', cursor: 'pointer', mb: 0.5 }}>
                Returns
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', cursor: 'pointer' }}>
                Privacy Policy
              </Typography>
            </Box>
          </Box>
          <Box sx={{ pt: 2, borderTop: `1px solid ${alpha('#ffffff', 0.1)}`, textAlign: 'center' }}>
            <Typography variant="caption" sx={{ opacity: 0.5 }}>
              © 2025 Fascinito. All rights reserved.
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
