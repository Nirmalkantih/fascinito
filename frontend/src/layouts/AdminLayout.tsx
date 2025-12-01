import { Outlet } from 'react-router-dom'
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Button,
  alpha,
  useTheme,
  Avatar,
  Chip
} from '@mui/material'
import {
  Dashboard as DashboardIcon,
  Inventory as ProductsIcon,
  Category as CategoryIcon,
  Store as VendorIcon,
  LocationOn as LocationIcon,
  ShoppingCart,
  People,
  Assessment,
  Logout,
  AdminPanelSettings,
  Summarize,
  ViewCarousel as BannerIcon
} from '@mui/icons-material'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { Permission } from '../types/permissions'

const drawerWidth = 260

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()
  const theme = useTheme()
  const { hasPermission, isAdmin } = usePermissions()
  
  // Get user name from localStorage
  const userData = JSON.parse(localStorage.getItem('user') || '{}')
  const userName = userData.firstName || userData.name || 'Admin'
  const userRole = isAdmin() ? 'Admin' : 'Staff'

  const menuItems: Array<{ text: string; icon: JSX.Element; path: string; permission: Permission }> = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin', permission: 'view_dashboard' },
    { text: 'Products', icon: <ProductsIcon />, path: '/admin/products', permission: 'view_products' },
    { text: 'Categories', icon: <CategoryIcon />, path: '/admin/categories', permission: 'view_categories' },
    { text: 'Banners', icon: <BannerIcon />, path: '/admin/banners', permission: 'view_banners' },
    { text: 'Vendors', icon: <VendorIcon />, path: '/admin/vendors', permission: 'view_vendors' },
    { text: 'Locations', icon: <LocationIcon />, path: '/admin/locations', permission: 'view_locations' },
    { text: 'Orders', icon: <ShoppingCart />, path: '/admin/orders', permission: 'view_orders' },
    { text: 'Customers', icon: <People />, path: '/admin/customers', permission: 'view_customers' },
    { text: 'Staff', icon: <AdminPanelSettings />, path: '/admin/staff', permission: 'view_staff' },
    { text: 'Reports', icon: <Summarize />, path: '/admin/reports', permission: 'view_reports' },
    { text: 'Analytics', icon: <Assessment />, path: '/admin/analytics', permission: 'view_analytics' },
  ]

  // Filter menu items based on user permissions
  const visibleMenuItems = menuItems.filter(item => hasPermission(item.permission))

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          boxShadow: theme.shadows[12]
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Avatar 
              sx={{ 
                bgcolor: alpha('#ffffff', 0.2),
                width: 45,
                height: 45,
                border: `2px solid ${alpha('#ffffff', 0.3)}`
              }}
            >
              <AdminPanelSettings />
            </Avatar>
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 800,
                  letterSpacing: '0.5px',
                  lineHeight: 1.2
                }}
              >
                FASCINITO POS
              </Typography>
              <Chip
                label={`${userRole} - ${userName}`}
                size="small"
                sx={{
                  height: 20,
                  bgcolor: alpha('#ffffff', 0.2),
                  color: 'white',
                  fontWeight: 600,
                  fontSize: '0.7rem',
                  '& .MuiChip-label': { px: 1 }
                }}
              />
            </Box>
          </Box>
          <Button 
            color="inherit" 
            onClick={logout}
            startIcon={<Logout />}
            sx={{
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 2,
              bgcolor: alpha('#ffffff', 0.15),
              '&:hover': {
                bgcolor: alpha('#ffffff', 0.25),
              },
              transition: 'all 0.3s ease'
            }}
          >
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            background: 'linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%)',
            borderRight: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto', mt: 2 }}>
          <List>
            {visibleMenuItems.map((item) => {
              const isActive = location.pathname === item.path
              return (
                <ListItem key={item.text} disablePadding sx={{ mb: 0.5, px: 2 }}>
                  <ListItemButton 
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2,
                      bgcolor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                      '&:hover': {
                        bgcolor: isActive 
                          ? alpha(theme.palette.primary.main, 0.15) 
                          : alpha(theme.palette.primary.main, 0.05)
                      },
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <ListItemIcon 
                      sx={{ 
                        color: isActive ? theme.palette.primary.main : 'text.secondary',
                        minWidth: 45
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text} 
                      primaryTypographyProps={{
                        fontWeight: isActive ? 700 : 500,
                        color: isActive ? theme.palette.primary.main : 'text.primary'
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              )
            })}
          </List>
        </Box>
      </Drawer>
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 4,
          bgcolor: alpha(theme.palette.primary.main, 0.02),
          minHeight: '100vh'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  )
}
