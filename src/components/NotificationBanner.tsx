import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getTaskNotifications, markNotificationAsRead, dismissNotification } from '../lib/tasks';
import type { TaskNotification } from '../types';
import { formatDate } from '../lib/dateUtils';

export const NotificationBanner = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<TaskNotification[]>([]);
  const [visibleNotifications, setVisibleNotifications] = useState<Set<string>>(new Set());

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
      const data = await getTaskNotifications(userId);
      const unreadUndismissed = data.filter(n => !n.read && !n.dismissed);
      
      // Show new notifications that haven't been shown yet
      unreadUndismissed.forEach(notification => {
        if (!visibleNotifications.has(notification.id)) {
          setVisibleNotifications(prev => new Set(prev).add(notification.id));
        }
      });
      
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId);
      setVisibleNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      await loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleDismiss = async (notificationId: string) => {
    try {
      await dismissNotification(notificationId);
      setVisibleNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notificationId);
        return newSet;
      });
      await loadNotifications();
    } catch (error) {
      console.error('Error dismissing notification:', error);
    }
  };

  const activeNotifications = notifications.filter(n => 
    !n.read && !n.dismissed && visibleNotifications.has(n.id)
  );

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task_assigned':
        return <Clock className="w-6 h-6 text-blue-600" />;
      case 'task_updated':
        return <AlertCircle className="w-6 h-6 text-yellow-600" />;
      case 'task_completed':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'task_cancelled':
        return <X className="w-6 h-6 text-red-600" />;
      default:
        return <Bell className="w-6 h-6 text-secondary-600" />;
    }
  };

  if (activeNotifications.length === 0) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 p-4 pointer-events-none">
      <div className="max-w-2xl mx-auto space-y-2">
        <AnimatePresence>
          {activeNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -50, scale: 0.95 }}
              className="pointer-events-auto bg-white rounded-lg shadow-lg border border-secondary-200 p-4"
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
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarkAsRead(notification.id)}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                    title="Mark as read"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDismiss(notification.id)}
                    className="text-secondary-400 hover:text-secondary-600 transition-colors"
                    title="Dismiss"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
