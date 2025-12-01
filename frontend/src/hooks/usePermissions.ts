import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Permission, ROLE_PERMISSIONS, Role } from '../types/permissions';

export const usePermissions = () => {
  const { user } = useAuth();

  const userPermissions = useMemo(() => {
    if (!user || !user.roles || user.roles.length === 0) {
      return [];
    }

    // Get all permissions for all user roles
    const permissions = new Set<Permission>();
    user.roles.forEach((role: string) => {
      const rolePermissions = ROLE_PERMISSIONS[role as Role] || [];
      rolePermissions.forEach(permission => permissions.add(permission));
    });

    return Array.from(permissions);
  }, [user]);

  const hasPermission = (permission: Permission): boolean => {
    return userPermissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const isAdmin = (): boolean => {
    return user?.roles?.includes('ROLE_ADMIN') || false;
  };

  const isStaff = (): boolean => {
    return user?.roles?.includes('ROLE_STAFF') || false;
  };

  const isCustomer = (): boolean => {
    return user?.roles?.includes('ROLE_CUSTOMER') || false;
  };

  return {
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isStaff,
    isCustomer,
  };
};
