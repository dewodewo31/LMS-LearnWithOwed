import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiCheckCircle, FiUserCheck, FiUsers } from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import StatCard from '../../components/ui/StatCard';
import Badge from '../../components/ui/Badge';
import { Skeleton, SkeletonLines, ErrorState } from '../../components/ui/States';
import { fmtDate } from '../../lib/format';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => api.get('/dashboard').then((d) => d.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
        <SkeletonLines lines={6} />
      </div>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const { role, stats, recent } = data;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-[28px] font-extrabold leading-tight text-ink">Selamat datang, {user.name.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {role === 'admin' ? 'Ringkasan aktivitas platform hari ini.' : 'Ringkasan course dan student Anda.'}
        </p>
      </header>

      <section aria-label="Statistik" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {role === 'admin' ? (
          <>
            <StatCard icon={FiUsers} label="Total Students" value={stats.totalStudents} />
            <StatCard icon={FiBookOpen} label="Total Courses" value={stats.totalCourses} accent />
            <StatCard icon={FiBookOpen} label="Published Courses" value={stats.publishedCourses} />
            <StatCard icon={FiUserCheck} label="Enrollments Aktif" value={stats.activeEnrollments} accent />
          </>
        ) : (
          <>
            <StatCard icon={FiBookOpen} label="Total Courses" value={stats.totalCourses} />
            <StatCard icon={FiBookOpen} label="Published" value={stats.publishedCourses} accent />
            <StatCard icon={FiUserCheck} label="Total Enrollments" value={stats.totalEnrollments} />
            <StatCard icon={FiCheckCircle} label="Rata-rata Progress" value={`${stats.avgProgress}%`} accent />
          </>
        )}
      </section>

      <section aria-label="Aktivitas terbaru" className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-edge bg-surface p-5">
          <h2 className="mb-4 text-base font-bold text-ink">Enrollment terbaru</h2>
          {recent.enrollments?.length ? (
            <ul className="divide-y divide-edge">
              {recent.enrollments.map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{e.student}</p>
                    <p className="truncate text-xs text-ink-muted">{e.course}</p>
                  </div>
                  <Badge value={e.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-ink-muted">Belum ada enrollment.</p>
          )}
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-5">
          <h2 className="mb-4 text-base font-bold text-ink">
            {role === 'admin' ? 'Student terbaru' : 'Course terbaru'}
          </h2>
          {role === 'admin' ? (
            recent.students?.length ? (
              <ul className="divide-y divide-edge">
                {recent.students.map((s) => (
                  <li key={s.id} className="flex items-center justify-between py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{s.name}</p>
                      <p className="truncate text-xs text-ink-muted">{s.email}</p>
                    </div>
                    <span className="shrink-0 text-xs text-ink-muted">{fmtDate(s.createdAt)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-6 text-center text-sm text-ink-muted">Belum ada student terdaftar.</p>
            )
          ) : recent.courses?.length ? (
            <ul className="divide-y divide-edge">
              {recent.courses.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <p className="truncate text-sm font-medium text-ink">{c.title}</p>
                  <Badge value={c.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-ink-muted">Belum ada course.</p>
          )}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          to="/dashboard/courses"
          className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 min-h-[44px]"
        >
          <FiBookOpen aria-hidden="true" /> Kelola Courses
        </Link>
        {role === 'admin' && (
          <Link
            to="/dashboard/enrollments"
            className="inline-flex items-center gap-2 rounded-full border border-edge bg-surface px-4 py-2.5 text-sm font-semibold text-ink-soft hover:bg-surface-hover min-h-[44px]"
          >
            <FiUserCheck aria-hidden="true" /> Kelola Enrollment
          </Link>
        )}
      </div>
    </div>
  );
}
