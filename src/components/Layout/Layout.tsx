import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import {
  Menu, X, Bell, User, LogOut, Settings,
  LayoutDashboard, Users, Calendar, CalendarCheck,
  DollarSign, Clock, BarChart, FileText, GraduationCap,
  Trophy, RefreshCw, UserCog, Building2, MapPin, Network, CalendarDays, Gift, AlertTriangle, Fuel, Wallet, Mail
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import madihaaLogo from '/madihaa (1).jpg';

export const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, signOut } = useAuth();

  // Simplified navigation for employee role
  const employeeNavigation = [
    { name: 'My Profile', href: '/staff-dashboard', icon: User },
    { name: 'My Attendance', href: '/staff-attendance', icon: Calendar },
    { name: 'My Leaves', href: '/leave', icon: CalendarCheck },
    { name: 'My Overtime', href: '/overtime', icon: Clock },
    { name: 'My Payslips', href: '/staff-payslips', icon: DollarSign },
    { name: 'My Disciplinary', href: '/staff-disciplinary', icon: AlertTriangle },
  ] as const;

  // Full navigation for admin/manager roles
  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Employees', href: '/employees', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: Calendar },
    { name: 'Leave', href: '/leave', icon: CalendarCheck },
    { name: 'Friday Duty', href: '/friday-duty', icon: CalendarDays },
    { name: 'Disciplinary', href: '/disciplinary', icon: AlertTriangle },
    { name: 'Payroll', href: '/payroll', icon: DollarSign },
    { name: 'Bonus', href: '/bonus', icon: Gift },
    { name: 'Overtime', href: '/overtime', icon: Clock },
    { name: 'Petrol Requests', href: '/petrol-requests', icon: Fuel },
    { name: 'Salary', href: '/salary', icon: Wallet },
    { name: 'Forms & Letters', href: '/forms-letters', icon: Mail },
    { name: 'Reports', href: '/reports', icon: BarChart },
    { name: 'Recruitment', href: '/recruitment', icon: FileText },
    { name: 'Training', href: '/training', icon: GraduationCap },
    { name: 'Performance', href: '/performance', icon: Trophy },
    { name: 'Lifecycle', href: '/lifecycle', icon: RefreshCw },
    { name: 'Accommodation', href: '/accommodation', icon: Building2 },
    { name: 'Work Locations', href: '/work-locations', icon: MapPin },
    { name: 'Organization Chart', href: '/organization-chart', icon: Network },
    { name: 'User Management', href: '/users', icon: UserCog },
    { name: 'Settings', href: '/settings', icon: Settings },
  ] as const;

  const navigation = user?.role === 'employee' ? employeeNavigation : adminNavigation;

  return (
    <div className="min-h-screen bg-secondary-50">
      {/* Mobile sidebar backdrop */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 left-0 w-80 bg-white shadow-xl z-50 lg:hidden"
          >
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
                <div className="flex items-center space-x-3">
                  <img src={madihaaLogo} alt="Madihaa Logo" className="w-10 h-10 object-contain" />
                  <div>
                    <h1 className="text-lg font-bold text-secondary-900">Madihaa HRMS</h1>
                    <p className="text-xs text-secondary-600">Human Resource Management</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="text-secondary-600 hover:text-secondary-900"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* User info */}
              <div className="px-6 py-4 border-b border-secondary-200">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-secondary-900 truncate">
                      {user?.displayName || user?.email}
                    </p>
                    <p className="text-xs text-secondary-600 capitalize">
                      {user?.role?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg text-secondary-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </a>
                  );
                })}
              </nav>

              {/* Logout */}
              <div className="px-4 py-4 border-t border-secondary-200">
                <Button
                  variant="ghost"
                  onClick={() => {
                    signOut();
                    setSidebarOpen(false);
                  }}
                  className="w-full justify-start"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Sign Out
                </Button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside
        className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-80 lg:bg-white lg:shadow-xl"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-secondary-200">
            <div className="flex items-center space-x-3">
              <img src={madihaaLogo} alt="Madihaa Logo" className="w-10 h-10 object-contain" />
              <div>
                <h1 className="text-lg font-bold text-secondary-900">Madihaa HRMS</h1>
                <p className="text-xs text-secondary-600">Human Resource Management</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-secondary-600 hover:text-secondary-900"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* User info */}
          <div className="px-6 py-4 border-b border-secondary-200">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary-900 truncate">
                  {user?.displayName || user?.email}
                </p>
                <p className="text-xs text-secondary-600 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className="flex items-center space-x-3 px-4 py-3 text-sm font-medium rounded-lg text-secondary-700 hover:bg-primary-50 hover:text-primary-700 transition-colors"
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </a>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="px-4 py-4 border-t border-secondary-200">
            <Button
              variant="ghost"
              onClick={signOut}
              className="w-full justify-start"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-80">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b border-secondary-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-secondary-600 hover:text-secondary-900"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-4">
              <button className="relative p-2 text-secondary-600 hover:text-secondary-900">
                <Bell className="w-6 h-6" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button className="p-2 text-secondary-600 hover:text-secondary-900">
                <Settings className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
