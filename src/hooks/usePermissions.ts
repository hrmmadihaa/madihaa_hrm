import { useAuth } from '../contexts/AuthContext';
import { hasPermission, hasAnyPermission, hasAllPermissions } from '../lib/permissions';
import type { UserRole } from '../types';

export const usePermissions = () => {
  const { user } = useAuth();
  const userRole = user?.role as UserRole || 'employee';

  return {
    role: userRole,
    
    // Check if user has a specific permission
    can: (permission: string) => {
      return hasPermission(userRole, permission);
    },
    
    // Check if user has any of the specified permissions
    canAny: (permissions: string[]) => {
      return hasAnyPermission(userRole, permissions);
    },
    
    // Check if user has all of the specified permissions
    canAll: (permissions: string[]) => {
      return hasAllPermissions(userRole, permissions);
    },
    
    // Check if user is a specific role
    isRole: (role: UserRole) => {
      return userRole === role;
    },
    
    // Check if user is any of the specified roles
    isAnyRole: (roles: UserRole[]) => {
      return roles.includes(userRole);
    },
    
    // Check if user is super admin
    isSuperAdmin: () => {
      return userRole === 'super_admin';
    },
    
    // Check if user is HR Manager
    isHRManager: () => {
      return userRole === 'hr_manager';
    },
    
    // Check if user is HR Manager or above
    isHRManagerOrAbove: () => {
      return ['super_admin', 'hr_manager'].includes(userRole);
    },
    
    // Check if user is Department Manager or above
    isDeptManagerOrAbove: () => {
      return ['super_admin', 'hr_manager', 'department_manager'].includes(userRole);
    },
    
    // Check if user is Supervisor or above
    isSupervisorOrAbove: () => {
      return ['super_admin', 'hr_manager', 'department_manager', 'supervisor'].includes(userRole);
    },
  };
};
