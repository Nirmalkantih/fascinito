// Permission types for role-based access control
export type Permission =
  | 'view_dashboard'
  | 'view_products'
  | 'manage_products'
  | 'view_categories'
  | 'manage_categories'
  | 'view_banners'
  | 'manage_banners'
  | 'view_vendors'
  | 'manage_vendors'
  | 'view_customers'
  | 'manage_customers'
  | 'view_locations'
  | 'manage_locations'
  | 'view_staff'
  | 'manage_staff'
  | 'view_orders'
  | 'manage_orders'
  | 'view_invoices'
  | 'manage_invoices'
  | 'view_analytics'
  | 'view_reports';

export type Role = 'ROLE_ADMIN' | 'ROLE_STAFF' | 'ROLE_CUSTOMER';

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  ROLE_ADMIN: [
    'view_dashboard',
    'view_products',
    'manage_products',
    'view_categories',
    'manage_categories',
    'view_banners',
    'manage_banners',
    'view_vendors',
    'manage_vendors',
    'view_customers',
    'manage_customers',
    'view_locations',
    'manage_locations',
    'view_staff',
    'manage_staff',
    'view_orders',
    'manage_orders',
    'view_invoices',
    'manage_invoices',
    'view_analytics',
    'view_reports',
  ],
  ROLE_STAFF: [
    'view_dashboard',
    'view_products',
    'manage_products',
    'view_categories',
    'manage_categories',
    'view_banners',
    'manage_banners',
    'view_vendors',
    'manage_vendors',
    'view_locations',
    'view_orders',
    'manage_orders',
    'view_invoices',
  ],
  ROLE_CUSTOMER: [],
};

// Menu items with their required permissions
export interface MenuItem {
  name: string;
  path: string;
  icon?: string;
  requiredPermission?: Permission;
}

export const ADMIN_MENU_ITEMS: MenuItem[] = [
  { name: 'Dashboard', path: '/admin/dashboard', requiredPermission: 'view_dashboard' },
  { name: 'Products', path: '/admin/products', requiredPermission: 'view_products' },
  { name: 'Categories', path: '/admin/categories', requiredPermission: 'view_categories' },
  { name: 'Vendors', path: '/admin/vendors', requiredPermission: 'view_vendors' },
  { name: 'Customers', path: '/admin/customers', requiredPermission: 'view_customers' },
  { name: 'Locations', path: '/admin/locations', requiredPermission: 'view_locations' },
  { name: 'Staff', path: '/admin/staff', requiredPermission: 'view_staff' },
  { name: 'Orders', path: '/admin/orders', requiredPermission: 'view_orders' },
  { name: 'Invoice Templates', path: '/admin/invoice-templates', requiredPermission: 'view_invoices' },
  { name: 'Invoices', path: '/admin/invoices', requiredPermission: 'view_invoices' },
  { name: 'Analytics', path: '/admin/analytics', requiredPermission: 'view_analytics' },
  { name: 'Reports', path: '/admin/reports', requiredPermission: 'view_reports' },
];
