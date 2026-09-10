import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiX } from 'react-icons/fi';
import { useUnreadCount, useNotifications, useMarkAsRead, useMarkAllAsRead } from './useNotifications';

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function NotificationItem({ notification, onRead, onClose }) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!notification.isRead) onRead(notification.id);
    if (notification.questionId) {
      onClose();
      navigate(`/community/questions/${notification.questionId}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left px-4 py-3 transition-colors hover:bg-surface-hover ${
        !notification.isRead ? 'bg-primary-500/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${!notification.isRead ? 'bg-primary-400' : 'bg-transparent'}`} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{notification.title}</p>
          <p className="mt-0.5 text-xs text-ink-muted line-clamp-2">{notification.message}</p>
          <p className="mt-1 text-[11px] text-ink-muted">{timeAgo(notification.createdAt)}</p>
        </div>
      </div>
    </button>
  );
}

export function NotificationPanel({ open, onClose }) {
  const navigate = useNavigate();
  const { data: countData } = useUnreadCount();
  const { data: notifData } = useNotifications({ limit: 20 });
  const markRead = useMarkAsRead();
  const markAll = useMarkAllAsRead();

  const unreadCount = countData?.data?.count || 0;
  const notifications = notifData?.data || [];

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  // Portal ke body: `backdrop-filter` pada header menjadikannya containing block
  // keturunan fixed — tanpa portal, modal terhimpit setinggi header (64px).
  return createPortal(
    <div className="fixed inset-0 z-[70] flex justify-end" role="dialog" aria-modal="true" aria-label="Notifications">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-sm flex-col bg-navy shadow-lg">
        <div className="flex items-center justify-between border-b border-edge px-4 py-3">
          <h2 className="text-sm font-bold text-ink">Notifications</h2>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs font-medium text-primary-400 hover:text-primary-300"
              >
                Mark all read
              </button>
            )}
            <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-hover hover:text-ink-soft">
              <FiX className="text-lg" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
              <FiBell className="mb-3 text-3xl text-ink-muted" aria-hidden="true" />
              <p className="text-sm text-ink-muted">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-edge">
              {notifications.map((n) => (
                <li key={n.id}>
                  <NotificationItem
                    notification={n}
                    onRead={(id) => markRead.mutate(id)}
                    onClose={onClose}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="border-t border-edge px-4 py-3">
            <button
              onClick={() => {
                onClose();
                navigate('/notifications');
              }}
              className="w-full rounded-lg bg-surface py-2 text-center text-xs font-semibold text-ink-soft transition-colors hover:bg-surface-hover"
            >
              View all notifications
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
