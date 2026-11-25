import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTaskNotifications, markNotificationAsRead, dismissNotification, markAllNotificationsAsRead } from '../lib/tasks';
import type { TaskNotification } from '../types';
import { formatDate } from '../lib/dateUtils';

export const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.employeeId || user?.id) {
      loadNotifications();
      // Poll for new notifications every 30 seconds
      const interval = setInterval(loadNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.employeeId, user?.id]);

  const loadNotifications = async () => {
    // Use employeeId if available, otherwise use user ID
    const userId = user?.employeeId || user?.id;
    if (!userId) return;
    try {
      setLoading(true);
      const data = await getTaskNotifications(userId);
      const unread = data.filter(n => !n.read && !n.dismissed);
      setNotifications(data);
      setUnreadCount(unread.length);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await dismissNotification(notificationId);
      await loadNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.employeeId) return;
    try {
      await markAllNotificationsAsRead(user.employeeId);
      await loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <Clock className="w-5 h-5 text-blue-600" />;
      case 'task_updated':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'task_completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'task_cancelled':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return <Bell className="w-5 h-5 text-secondary-600" />;
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-secondary-100 transition-colors"
      >
        <Bell className="w-6 h-6 text-secondary-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-lg shadow-xl border border-secondary-200 z-50 max-h-[80vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
                <h3 className="font-semibold text-secondary-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center p-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-secondary-500">
                    <Bell className="w-12 h-12 mx-auto mb-2 text-secondary-300" />
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-secondary-100 hover:bg-secondary-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getNotificationIcon(notification.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-secondary-900">
                            {notification.message}
                          </p>
                          <p className="text-xs text-secondary-500 mt-1">
                            {formatDate(notification.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col gap-1">
                          {!notification.read && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-secondary-400 hover:text-secondary-600"
                              title="Mark as read"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => handleDismiss(notification.id)}
                            className="text-secondary-400 hover:text-secondary-600"
                            title="Dismiss"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
