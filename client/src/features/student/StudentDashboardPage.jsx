import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiCheckCircle, FiClock, FiPlay, FiTrendingUp } from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Progress from '../../components/ui/Progress';
import StatCard from '../../components/ui/StatCard';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { fmtDateTime } from '../../lib/format';

export default function StudentDashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((d) => d.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-44 w-full" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const { stats, continueLearning, courses = [], recentActivity = [] } = data || {};

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold leading-tight text-ink sm:text-3xl lg:text-[32px]">Halo {user.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-ink-soft">Siap lanjut belajar hari ini?</p>
      </header>

      {continueLearning ? (
        <section aria-label="Lanjutkan belajar" className="overflow-hidden rounded-3xl border border-edge bg-surface shadow-sm">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center sm:p-6">
            {continueLearning.thumbnail ? (
              <img src={continueLearning.thumbnail} alt="" className="h-32 w-full rounded-xl object-cover sm:w-56 lg:h-40 lg:w-64" />
            ) : (
              <div className="flex h-32 w-full items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 sm:w-56 lg:h-40 lg:w-64">
                <FiBookOpen className="text-4xl" aria-hidden="true" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-400">Lanjutkan Belajar</p>
              <h2 className="mt-1 text-xl font-bold text-ink">{continueLearning.title}</h2>
              <p className="mt-1 text-xs text-ink-muted">
                Lesson {continueLearning.completedLessons} dari {continueLearning.totalLessons}
              </p>
              <div className="mt-3 max-w-md">
                <Progress percent={continueLearning.progress} label="Progress" />
              </div>
              <Link to={`/student/courses/${continueLearning.courseId}`} className="mt-4 inline-block">
                <Button>
                  <FiPlay aria-hidden="true" /> Lanjutkan Belajar
                </Button>
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <EmptyState
          icon={FiBookOpen}
          title="Belum ada course"
          body="Course akan muncul di sini setelah admin memberikan akses."
        />
      )}

      {/* Stats */}
      <section aria-label="Statistik belajar" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={FiBookOpen} label="My Courses" value={stats.myCourses} />
        <StatCard icon={FiCheckCircle} label="Selesai" value={stats.completedCourses} accent />
        <StatCard icon={FiTrendingUp} label="Rata-rata Progress" value={`${stats.avgProgress}%`} />
      </section>

      {/* Courses — carousel on mobile, grid on desktop */}
      {courses.length > 0 && (
        <section aria-label="Course saya">
          <h2 className="mb-4 text-lg font-bold text-ink">Kursus Saya</h2>
          {/* Mobile: horizontal scroll */}
          <div className="flex gap-4 overflow-x-auto -mx-4 px-4 no-scrollbar sm:-mx-6 sm:px-6 lg:hidden">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
          {/* Desktop: grid */}
          <div className="hidden gap-4 lg:grid lg:grid-cols-2 xl:grid-cols-3">
            {courses.map((c) => (
              <CourseCard key={c.id} course={c} />
            ))}
          </div>
        </section>
      )}

      {/* Recent activity */}
      {recentActivity.length > 0 && (
        <section aria-label="Aktivitas belajar" className="rounded-2xl border border-edge bg-surface p-5">
          <h2 className="mb-4 text-base font-bold text-ink">Aktivitas Belajar</h2>
          <ul className="divide-y divide-edge">
            {recentActivity.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22C55E]/10 text-[#4ADE80]">
                    <FiCheckCircle className="text-base" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{a.lesson}</p>
                    <p className="truncate text-xs text-ink-muted">{a.course}</p>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1 text-xs text-ink-muted">
                  <FiClock aria-hidden="true" /> {fmtDateTime(a.completedAt)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function CourseCard({ course: c }) {
  return (
    <Link
      to={`/student/courses/${c.id}`}
      className="group flex min-w-[240px] flex-col overflow-hidden rounded-2xl border border-edge bg-surface transition-colors hover:bg-surface-hover sm:min-w-[280px] lg:min-w-0"
    >
      {c.thumbnail ? (
        <img src={c.thumbnail} alt="" className="h-28 w-full object-cover rounded-t-2xl lg:h-36" />
      ) : (
        <div className="flex h-28 items-center justify-center bg-primary-500/10 text-primary-400 lg:h-36">
          <FiBookOpen className="text-3xl" aria-hidden="true" />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-ink group-hover:text-primary-400">{c.title}</h3>
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
