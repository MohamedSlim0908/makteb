import { useNavigate } from 'react-router-dom';
import { Bell, Check } from 'lucide-react';
import { useNotifications } from '../../features/notifications/useNotifications';
import { useMarkAsRead } from '../../features/notifications/useMarkAsRead';
import { useMarkAllAsRead } from '../../features/notifications/useMarkAllAsRead';

function timeAgo(dateStr) {
  const now = Date.now();
  const diff = now - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export function NotificationPanel({ onClose }) {
  const navigate = useNavigate();
  const { data, isLoading } = useNotifications({ page: 1, limit: 20 });
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const notifications = data?.notifications ?? [];

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead.mutate(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
    onClose();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead.mutate();
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-80 max-w-[calc(100vw-1rem)] sm:w-96 bg-white rounded-xl shadow-dropdown border border-gray-200 z-50 animate-scale-in overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
        {notifications.length > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            disabled={markAllAsRead.isPending}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all as read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-gray-400">Loading...</div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <Bell className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-900">No notifications</p>
            <p className="text-xs text-gray-500 mt-0.5">You're all caught up!</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <button
              key={notification.id}
              onClick={() => handleNotificationClick(notification)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                !notification.read ? 'bg-blue-50/40' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm truncate ${!notification.read ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {notification.title}
                  </p>
                  {!notification.read && (
                    <span className="shrink-0 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notification.body}</p>
                <p className="text-[11px] text-gray-400 mt-1">{timeAgo(notification.createdAt)}</p>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
