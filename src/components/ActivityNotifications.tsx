import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { subscribeToRecentActivities, type ActivityLog } from '../lib/activityLog';
import { formatDate } from '../lib/dateUtils';

export const ActivityNotifications = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasOpened, setHasOpened] = useState(false);

  useEffect(() => {
    console.log('ActivityNotifications - Subscribing to activities');
    const unsubscribe = subscribeToRecentActivities((newActivities) => {
      console.log('ActivityNotifications - Received activities:', newActivities);
      setActivities(newActivities);
      if (!hasOpened) {
        setUnreadCount(newActivities.length);
      }
    }, 10);

    return () => {
      console.log('ActivityNotifications - Unsubscribing');
      unsubscribe();
    };
  }, [hasOpened]);

  const formatTime = (timestamp: any) => {
    const date = timestamp.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return formatDate(date);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'created': return 'text-green-600';
      case 'approved': return 'text-green-600';
      case 'rejected': return 'text-red-600';
      case 'updated': return 'text-blue-600';
      case 'deleted': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) {
            setUnreadCount(0);
            setHasOpened(true);
          }
        }}
        className="relative p-2 text-secondary-600 hover:text-secondary-900 hover:bg-secondary-100 rounded-lg transition-colors"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-12 w-96 bg-white rounded-lg shadow-xl border border-secondary-200 z-50 max-h-96 overflow-hidden">
            <div className="p-4 border-b border-secondary-200 flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900">Recent Activity</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-secondary-400 hover:text-secondary-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-80">
              {activities.length === 0 ? (
                <div className="p-4 text-center text-secondary-500">
                  No recent activity
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="p-4 border-b border-secondary-100 hover:bg-secondary-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-secondary-900">
                          <span className={`font-medium ${getActionColor(activity.action)}`}>
                            {activity.action.charAt(0).toUpperCase() + activity.action.slice(1)}
                          </span>{' '}
                          {activity.entity}
                        </p>
                        {activity.details && (
                          <p className="text-xs text-secondary-600 mt-1">{activity.details}</p>
                        )}
                        <p className="text-xs text-secondary-400 mt-1">
                          by {activity.userEmail}
                        </p>
                      </div>
                      <span className="text-xs text-secondary-400 whitespace-nowrap ml-2">
                        {formatTime(activity.timestamp)}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
