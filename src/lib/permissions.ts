import type { UserRole } from '../types';

// Define all available permissions in the system
export const PERMISSIONS = {
  // User Management
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',
  
  // Employee Management
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_CREATE: 'employees.create',
  EMPLOYEES_EDIT: 'employees.edit',
  EMPLOYEES_DELETE: 'employees.delete',
  EMPLOYEES_VIEW_ALL: 'employees.view_all', // View all employees vs only own department
  
  // Attendance
  ATTENDANCE_VIEW: 'attendance.view',
  ATTENDANCE_VIEW_ALL: 'attendance.view_all',
  ATTENDANCE_EDIT: 'attendance.edit',
  ATTENDANCE_ADJUST: 'attendance.adjust',
  ATTENDANCE_APPROVE_ADJUSTMENTS: 'attendance.approve_adjustments',
  ATTENDANCE_DELETE: 'attendance.delete',
  
  // Leave Management
  LEAVE_VIEW: 'leave.view',
  LEAVE_VIEW_ALL: 'leave.view_all',
  LEAVE_REQUEST: 'leave.request',
  LEAVE_CANCEL_OWN: 'leave.cancel_own',
  LEAVE_CANCEL_ANY: 'leave.cancel_any',
  LEAVE_APPROVE: 'leave.approve',
  LEAVE_REJECT: 'leave.reject',
  LEAVE_IMPORT: 'leave.import',
  LEAVE_DELETE: 'leave.delete',
  
  // Payroll
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_VIEW_ALL: 'payroll.view_all',
  PAYROLL_CREATE: 'payroll.create',
  PAYROLL_EDIT: 'payroll.edit',
  PAYROLL_APPROVE: 'payroll.approve',
  PAYROLL_PROCESS: 'payroll.process',
  
  // Overtime
  OVERTIME_VIEW: 'overtime.view',
  OVERTIME_VIEW_ALL: 'overtime.view_all',
  OVERTIME_REQUEST: 'overtime.request',
  OVERTIME_APPROVE: 'overtime.approve',
  OVERTIME_REJECT: 'overtime.reject',
  OVERTIME_DELETE: 'overtime.delete',
  
  // Performance
  PERFORMANCE_VIEW: 'performance.view',
  PERFORMANCE_VIEW_ALL: 'performance.view_all',
  PERFORMANCE_REVIEW: 'performance.review',
  PERFORMANCE_MANAGE: 'performance.manage',
  
  // Recruitment
  RECRUITMENT_VIEW: 'recruitment.view',
  RECRUITMENT_MANAGE: 'recruitment.manage',
  RECRUITMENT_APPROVE: 'recruitment.approve',
  
  // Training
  TRAINING_VIEW: 'training.view',
  TRAINING_MANAGE: 'training.manage',
  TRAINING_APPROVE: 'training.approve',
  
  // Accommodation
  ACCOMMODATION_VIEW: 'accommodation.view',
  ACCOMMODATION_MANAGE: 'accommodation.manage',
  ACCOMMODATION_ASSIGN: 'accommodation.assign',
  
  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',
  REPORTS_ALL: 'reports.all',
  
  // Settings
  SETTINGS_MANAGE: 'settings.manage',
} as const;

// Role-based permissions configuration
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  super_admin: [
    // Full access to everything
    ...Object.values(PERMISSIONS),
  ],
  
  hr_manager: [
    // User Management - View and create only
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    
    // Employee Management - Full CRUD
    PERMISSIONS.EMPLOYEES_VIEW_ALL,
    PERMISSIONS.EMPLOYEES_CREATE,
    PERMISSIONS.EMPLOYEES_EDIT,
    PERMISSIONS.EMPLOYEES_DELETE,
    
    // Attendance - Full CRUD
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.ATTENDANCE_EDIT,
    PERMISSIONS.ATTENDANCE_ADJUST,
    PERMISSIONS.ATTENDANCE_APPROVE_ADJUSTMENTS,
    PERMISSIONS.ATTENDANCE_DELETE,
    
    // Leave - Full management including approval
    PERMISSIONS.LEAVE_VIEW,
    PERMISSIONS.LEAVE_VIEW_ALL,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.LEAVE_REJECT,
    PERMISSIONS.LEAVE_IMPORT,
    PERMISSIONS.LEAVE_DELETE,
    
    // Payroll - Full management (but can only view own salary, not all)
    PERMISSIONS.PAYROLL_VIEW,
    PERMISSIONS.PAYROLL_CREATE,
    PERMISSIONS.PAYROLL_EDIT,
    PERMISSIONS.PAYROLL_APPROVE,
    PERMISSIONS.PAYROLL_PROCESS,
    
    // Overtime - View and approve
    PERMISSIONS.OVERTIME_VIEW,
    PERMISSIONS.OVERTIME_VIEW_ALL,
    PERMISSIONS.OVERTIME_APPROVE,
    PERMISSIONS.OVERTIME_REJECT,
    
    // Performance - View and manage
    PERMISSIONS.PERFORMANCE_VIEW,
    PERMISSIONS.PERFORMANCE_VIEW_ALL,
    PERMISSIONS.PERFORMANCE_MANAGE,
    
    // Recruitment - Full management
    PERMISSIONS.RECRUITMENT_VIEW,
    PERMISSIONS.RECRUITMENT_MANAGE,
    PERMISSIONS.RECRUITMENT_APPROVE,
    
    // Training - Full management
    PERMISSIONS.TRAINING_VIEW,
    PERMISSIONS.TRAINING_MANAGE,
    PERMISSIONS.TRAINING_APPROVE,
    
    // Accommodation - View and manage
    PERMISSIONS.ACCOMMODATION_VIEW,
    PERMISSIONS.ACCOMMODATION_MANAGE,
    PERMISSIONS.ACCOMMODATION_ASSIGN,
    
    // Reports - View and export
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
  ],
  
  department_manager: [
    // Employee Management - View department employees, create/edit
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_CREATE,
    PERMISSIONS.EMPLOYEES_EDIT,
    
    // Attendance - View department, approve adjustments
    PERMISSIONS.ATTENDANCE_VIEW,
    PERMISSIONS.ATTENDANCE_APPROVE_ADJUSTMENTS,
    
    // Leave - View department, approve/reject
    PERMISSIONS.LEAVE_VIEW,
    PERMISSIONS.LEAVE_VIEW_ALL,
    PERMISSIONS.LEAVE_APPROVE,
    PERMISSIONS.LEAVE_REJECT,
    
    // Payroll - Cannot view salaries (only superadmin can view all)
    
    // Overtime - View department, approve
    PERMISSIONS.OVERTIME_VIEW,
    PERMISSIONS.OVERTIME_VIEW_ALL,
    PERMISSIONS.OVERTIME_APPROVE,
    PERMISSIONS.OVERTIME_REJECT,
    
    // Performance - View and review department
    PERMISSIONS.PERFORMANCE_VIEW,
    PERMISSIONS.PERFORMANCE_REVIEW,
    
    // Recruitment - View and manage department
    PERMISSIONS.RECRUITMENT_VIEW,
    PERMISSIONS.RECRUITMENT_MANAGE,
    
    // Training - View and approve department
    PERMISSIONS.TRAINING_VIEW,
    PERMISSIONS.TRAINING_APPROVE,
    
    // Accommodation - View
    PERMISSIONS.ACCOMMODATION_VIEW,
    
    // Reports - View
    PERMISSIONS.REPORTS_VIEW,
  ],
  
  supervisor: [
    // Employee Management - View and create
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_CREATE,

    // Attendance - View team
    PERMISSIONS.ATTENDANCE_VIEW,

    // Leave - View team and apply for leave (no approval)
    PERMISSIONS.LEAVE_VIEW,
    PERMISSIONS.LEAVE_VIEW_ALL,
    PERMISSIONS.LEAVE_REQUEST,

    // Overtime - View team, approve team requests
    PERMISSIONS.OVERTIME_VIEW,
    PERMISSIONS.OVERTIME_VIEW_ALL,
    PERMISSIONS.OVERTIME_APPROVE,

    // Performance - View and review team
    PERMISSIONS.PERFORMANCE_VIEW,
    PERMISSIONS.PERFORMANCE_REVIEW,
  ],
  
  employee: [
    // Employee Management - View own profile only
    PERMISSIONS.EMPLOYEES_VIEW,

    // Attendance - View own attendance
    PERMISSIONS.ATTENDANCE_VIEW,

    // Leave - View own only (no request or cancel)
    PERMISSIONS.LEAVE_VIEW,

    // Overtime - View own and request
    PERMISSIONS.OVERTIME_VIEW,
    PERMISSIONS.OVERTIME_REQUEST,

    // Performance - View own
    PERMISSIONS.PERFORMANCE_VIEW,

    // Training - View available
    PERMISSIONS.TRAINING_VIEW,
  ],
};

// Helper function to check if a role has a specific permission
export const hasPermission = (role: UserRole, permission: string): boolean => {
  const rolePermissions = ROLE_PERMISSIONS[role] || [];
  return rolePermissions.includes(permission);
};

// Helper function to check if a role has any of the specified permissions
export const hasAnyPermission = (role: UserRole, permissions: string[]): boolean => {
  return permissions.some(permission => hasPermission(role, permission));
};

// Helper function to check if a role has all of the specified permissions
export const hasAllPermissions = (role: UserRole, permissions: string[]): boolean => {
  return permissions.every(permission => hasPermission(role, permission));
};
