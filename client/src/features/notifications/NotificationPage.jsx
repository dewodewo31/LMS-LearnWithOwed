import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiBell, FiCheck, FiArrowLeft } from 'react-icons/fi';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from './useNotifications';
import Pagination from '../../components/ui/Pagination';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import Button from '../../components/ui/Button';

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

export default function NotificationPage() {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState('all');
  const { data, isLoading, error, refetch } = useNotifications({
    page,
    limit: 20,
    unreadOnly: filter === 'unread',
  });
  const markRead = useMarkAsRead();
  const markAll = useMarkAllAsRead();

  const notifications = data?.data || [];
  const meta = data?.meta;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (error) {
    return <ErrorState message={error.message} onRetry={refetch} />;
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* Mobile back button */}
      <div className="mb-6 flex items-center gap-3 lg:hidden">
        <Link to="/dashboard" className="rounded-full bg-surface p-2.5 text-ink-muted hover:bg-surface-hover min-h-[44px] min-w-[44px] flex items-center justify-center">
          <FiArrowLeft className="text-lg" aria-hidden="true" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-extrabold text-ink">Notifications</h1>
        </div>
        {notifications.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAll.mutate()}>
            <FiCheck aria-hidden="true" /> Mark all read
          </Button>
        )}
      </div>

      {/* Desktop header */}
      <div className="mb-6 hidden items-center justify-between lg:flex">
        <div>
          <h1 className="text-2xl font-extrabold text-ink lg:text-3xl">Notifications</h1>
          <p className="mt-1 text-sm text-ink-muted">Notifikasi terbaru tentang aktivitas kamu.</p>
        </div>
        {notifications.length > 0 && (
          <Button variant="secondary" size="sm" onClick={() => markAll.mutate()}>
            <FiCheck aria-hidden="true" /> Mark all read
          </Button>
        )}
      </div>

      <div className="mb-4 flex rounded-lg bg-surface p-1" role="tablist">
        {[
          { value: 'all', label: 'All' },
          { value: 'unread', label: 'Unread' },
        ].map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => { setFilter(f.value); setPage(1); }}
            className={`rounded-md px-4 py-1.5 text-xs font-semibold transition-colors ${
              filter === f.value ? 'bg-surface-hover text-ink' : 'text-ink-muted hover:text-ink-soft'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
        {notifications.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={FiBell}
              title="No notifications"
              body={filter === 'unread' ? "You're all caught up." : "Notifications will appear here."}
            />
          </div>
        ) : (
          <>
            <ul className="divide-y divide-edge">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link
                    to={n.questionId ? `/community/questions/${n.questionId}` : '#'}
                    onClick={() => {
                      if (!n.isRead) markRead.mutate(n.id);
                    }}
                    className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface-hover ${
                      !n.isRead ? 'bg-primary-500/5' : ''
                    }`}
                  >
                    <div className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${!n.isRead ? 'bg-primary-400' : 'bg-transparent'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink">{n.title}</p>
                      <p className="mt-0.5 text-xs text-ink-muted">{n.message}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-ink-muted">
                        {n.courseName && <span>{n.courseName}</span>}
                        <span>{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="px-4 pb-3">
              <Pagination meta={meta} onPage={setPage} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
