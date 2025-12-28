import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import CustomerLayout from './layouts/CustomerLayout'
import AdminLayout from './layouts/AdminLayout'
import Login from './pages/auth/Login'
import AdminLogin from './pages/auth/AdminLogin'
import Signup from './pages/auth/Signup'
import ForgotPassword from './pages/auth/ForgotPassword'
import Home from './pages/customer/Home'
import Products from './pages/customer/Products'
import ProductDetail from './pages/customer/ProductDetail'
import Cart from './pages/customer/Cart'
import Wishlist from './pages/customer/Wishlist'
import Checkout from './pages/customer/Checkout'
import OrderSuccess from './pages/customer/OrderSuccess'
import Profile from './pages/customer/Profile'
import Orders from './pages/customer/Orders'
import OrderDetailsPage from './pages/customer/OrderDetailsPage'
import Settings from './pages/customer/Settings'
import AdminDashboard from './pages/admin/DashboardEnhanced'
import AdminProducts from './pages/admin/Products'
import AdminProductForm from './pages/admin/ProductFormEnhanced'
import AdminCategories from './pages/admin/CategoriesEnhanced'
import AdminBanners from './pages/admin/BannersEnhanced'
import AdminVendors from './pages/admin/VendorsEnhanced'
import AdminLocations from './pages/admin/LocationsEnhanced'
import AdminOrders from './pages/admin/OrdersEnhanced'
import AdminOrderDetails from './pages/admin/OrderDetailsPage'
import AdminCustomers from './pages/admin/CustomersEnhanced'
import AdminStaff from './pages/admin/Staff'
import AdminReports from './pages/admin/ReportsEnhanced'
import EmailTemplateListPage from './pages/admin/EmailTemplateListPage'
import EmailTemplateEditPage from './pages/admin/EmailTemplateEditPage'

function App() {
  const { isAuthenticated, user, loading } = useAuth()

  console.log('🔑 Auth State:', { isAuthenticated, user, roles: user?.roles, isAdmin: user?.roles?.includes('ROLE_ADMIN'), loading })

  // Show loading state while session is being restored
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            display: 'inline-block',
            width: '50px',
            height: '50px',
            border: '4px solid #667eea',
            borderTop: '4px solid #764ba2',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <p style={{ marginTop: '16px', color: '#666' }}>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ToastProvider>
      <WishlistProvider>
        <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* Customer Portal */}
      <Route path="/" element={<CustomerLayout />}>
        <Route index element={<Home />} />
        <Route path="products" element={<Products />} />
        <Route path="products/:slug" element={<ProductDetail />} />
        <Route
          path="cart"
          element={isAuthenticated ? <Cart /> : <Navigate to="/login" />}
        />
        <Route
          path="wishlist"
          element={isAuthenticated ? <Wishlist /> : <Navigate to="/login" />}
        />
        <Route
          path="checkout"
          element={isAuthenticated ? <Checkout /> : <Navigate to="/login" />}
        />
        <Route
          path="order-success/:orderId"
          element={isAuthenticated ? <OrderSuccess /> : <Navigate to="/login" />}
        />
        <Route
          path="profile"
          element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="orders"
          element={isAuthenticated ? <Orders /> : <Navigate to="/login" />}
        />
        <Route
          path="order-details/:orderId"
          element={isAuthenticated ? <OrderDetailsPage /> : <Navigate to="/login" />}
        />
        <Route
          path="settings"
          element={isAuthenticated ? <Settings /> : <Navigate to="/login" />}
        />
      </Route>

      {/* Admin Portal */}
      <Route
        path="/admin"
        element={
          isAuthenticated && (user?.roles?.includes('ROLE_ADMIN') || user?.roles?.includes('ROLE_STAFF')) ? (
            <AdminLayout />
          ) : (
            <Navigate to="/admin/login" />
          )
        }
      >
        <Route index element={<ProtectedRoute requiredPermission="view_dashboard"><AdminDashboard /></ProtectedRoute>} />
        <Route path="products" element={<ProtectedRoute requiredPermission="view_products"><AdminProducts /></ProtectedRoute>} />
        <Route path="products/new" element={<ProtectedRoute requiredPermission="manage_products"><AdminProductForm /></ProtectedRoute>} />
        <Route path="products/edit/:id" element={<ProtectedRoute requiredPermission="manage_products"><AdminProductForm /></ProtectedRoute>} />
        <Route path="categories" element={<ProtectedRoute requiredPermission="view_categories"><AdminCategories /></ProtectedRoute>} />
        <Route path="banners" element={<ProtectedRoute requiredPermission="view_banners"><AdminBanners /></ProtectedRoute>} />
        <Route path="vendors" element={<ProtectedRoute requiredPermission="view_vendors"><AdminVendors /></ProtectedRoute>} />
        <Route path="locations" element={<ProtectedRoute requiredPermission="view_locations"><AdminLocations /></ProtectedRoute>} />
        <Route path="orders" element={<ProtectedRoute requiredPermission="view_orders"><AdminOrders /></ProtectedRoute>} />
        <Route path="orders/:orderId" element={<ProtectedRoute requiredPermission="view_orders"><AdminOrderDetails /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute requiredPermission="view_customers"><AdminCustomers /></ProtectedRoute>} />
        <Route path="staff" element={<ProtectedRoute requiredPermission="view_staff"><AdminStaff /></ProtectedRoute>} />
        <Route path="email-templates" element={<ProtectedRoute requiredPermission="view_dashboard"><EmailTemplateListPage /></ProtectedRoute>} />
        <Route path="email-templates/:id/edit" element={<ProtectedRoute requiredPermission="view_dashboard"><EmailTemplateEditPage /></ProtectedRoute>} />
        <Route path="reports" element={<ProtectedRoute requiredPermission="view_reports"><AdminReports /></ProtectedRoute>} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
      </WishlistProvider>
    </ToastProvider>
  )
}

export default App
