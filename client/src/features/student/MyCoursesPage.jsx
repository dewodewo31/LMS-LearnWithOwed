import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiBookOpen } from 'react-icons/fi';
import { api } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Progress from '../../components/ui/Progress';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';

export default function MyCoursesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['courses', 'mine'],
    queryFn: () => api.get('/courses/mine').then((d) => d.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const courses = data?.courses || [];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold leading-tight text-ink sm:text-3xl lg:text-[32px]">Kursus Saya</h1>
        <p className="mt-1 text-sm text-ink-soft">Semua course yang sedang kamu ikuti.</p>
      </header>

      {courses.length === 0 ? (
        <EmptyState
          icon={FiBookOpen}
          title="Belum ada course"
          body="Course akan muncul di sini setelah admin memberikan akses."
        />
      ) : (
        <>
          {/* Mobile: vertical list */}
          <div className="space-y-3 lg:hidden">
            {courses.map((c) => (
              <MyCourseRow key={c.id} course={c} />
            ))}
          </div>
          {/* Desktop: grid */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
            {courses.map((c) => (
              <MyCourseCard key={c.id} course={c} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function MyCourseRow({ course: c }) {
  return (
    <Link
      to={`/student/courses/${c.id}`}
      className="flex items-center gap-4 rounded-2xl border border-edge bg-surface p-4 transition-colors hover:bg-surface-hover"
    >
      {c.thumbnail ? (
        <img src={c.thumbnail} alt="" className="h-20 w-20 shrink-0 rounded-xl object-cover" />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400">
          <FiBookOpen className="text-2xl" aria-hidden="true" />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold text-ink">{c.title}</h2>
          <Badge value={c.status} />
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          {c.category || '—'} · {c.level} · {c.totalLessons} lessons
        </p>
        <div className="mt-2">
          <Progress percent={c.progress} label="Progress" />
        </div>
      </div>
    </Link>
  );
}

function MyCourseCard({ course: c }) {
  return (
    <Link
      to={`/student/courses/${c.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-edge bg-surface transition-colors hover:bg-surface-hover"
    >
      {c.thumbnail ? (
        <img src={c.thumbnail} alt="" className="h-36 w-full object-cover" />
      ) : (
        <div className="flex h-36 items-center justify-center bg-primary-500/10 text-primary-400">
          <FiBookOpen className="text-3xl" aria-hidden="true" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-bold text-ink group-hover:text-primary-400">{c.title}</h2>
          <Badge value={c.status} />
        </div>
        <p className="mt-1 text-xs text-ink-muted">
          {c.category || '—'} · {c.level} · {c.totalLessons} lessons
        </p>
        <div className="mt-3 pt-1">
          <Progress percent={c.progress} label="Progress" />
        </div>
      </div>
    </Link>
  );
}
