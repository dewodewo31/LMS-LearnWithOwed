import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { FiBookOpen, FiEye, FiPlus, FiSearch } from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Form';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import Pagination from '../../components/ui/Pagination';

export default function CoursesPage() {
  const { user } = useAuth();
  const [params, setParams] = useState({ page: 1, keyword: '', status: '', level: '' });
  const [keywordInput, setKeywordInput] = useState('');

  const query = new URLSearchParams(
    Object.entries({ page: params.page, keyword: params.keyword, status: params.status, level: params.level }).filter(
      ([, v]) => v
    )
  ).toString();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['courses', query],
    queryFn: () => api.get(`/courses?${query}`),
    placeholderData: (prev) => prev,
  });

  const applySearch = (e) => {
    e.preventDefault();
    setParams((p) => ({ ...p, keyword: keywordInput, page: 1 }));
  };

  const courses = data?.data?.courses || [];
  const isAdmin = user.role === 'admin';

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight text-ink">Courses</h1>
          <p className="mt-1 text-sm text-ink-soft">Kelola course dan materi pembelajaran.</p>
        </div>
        <Link to="/dashboard/courses/new">
          <Button>
            <FiPlus aria-hidden="true" /> Buat Course
          </Button>
        </Link>
      </header>

      <form onSubmit={applySearch} className="flex flex-wrap gap-3" role="search" aria-label="Cari course">
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <Input
            aria-label="Cari course"
            placeholder="Cari course…"
            className="pl-9"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
        </div>
        <Select aria-label="Filter status" value={params.status} onChange={(e) => setParams((p) => ({ ...p, status: e.target.value, page: 1 }))}>
          <option value="">Semua status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </Select>
        <Select aria-label="Filter level" value={params.level} onChange={(e) => setParams((p) => ({ ...p, level: e.target.value, page: 1 }))}>
          <option value="">Semua level</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </Select>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : courses.length === 0 ? (
        <EmptyState
          icon={FiBookOpen}
          title="Belum ada course"
          body={params.keyword || params.status || params.level ? 'Tidak ada course yang cocok dengan filter.' : 'Buat course pertama untuk mulai mengelola materi.'}
          action={
            !params.keyword &&
            !params.status &&
            !params.level && (
              <Link to="/dashboard/courses/new">
                <Button>
                  <FiPlus aria-hidden="true" /> Buat Course
                </Button>
              </Link>
            )
          }
        />
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden overflow-hidden rounded-2xl border border-edge bg-surface md:block">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-edge bg-surface-hover text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Course</th>
                  {isAdmin && <th scope="col" className="px-5 py-3 font-semibold">Mentor</th>}
                  <th scope="col" className="px-5 py-3 font-semibold">Level</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Lessons</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 font-semibold sr-only">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-hover">
                    <td className="px-5 py-3.5">
                      <Link to={`/dashboard/courses/${c.id}`} className="font-medium text-ink hover:text-primary-400">
                        {c.title}
                      </Link>
                      <p className="text-xs text-ink-muted">{c.category || 'Tanpa kategori'}</p>
                    </td>
                    {isAdmin && <td className="px-5 py-3.5 text-ink-soft">{c.mentor?.name || '—'}</td>}
                    <td className="px-5 py-3.5"><Badge value={c.level} kind="level" /></td>
                    <td className="px-5 py-3.5 text-ink-soft">{c.totalLessons}</td>
                    <td className="px-5 py-3.5"><Badge value={c.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <Link to={`/dashboard/courses/${c.id}`} className="inline-flex items-center gap-1 font-medium text-primary-400 hover:text-primary-300">
                        <FiEye aria-hidden="true" /> Kelola
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: cards */}
          <ul className="space-y-3 md:hidden">
            {courses.map((c) => (
              <li key={c.id}>
                <Link to={`/dashboard/courses/${c.id}`} className="block rounded-2xl border border-edge bg-surface p-4 active:bg-surface-hover">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-bold text-ink">{c.title}</h2>
                    <Badge value={c.status} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-ink-muted">{c.shortDescription || 'Tanpa deskripsi.'}</p>
                  <p className="mt-2 text-xs text-ink-muted">
                    {c.totalLessons} lessons · {c.mentor?.name || '—'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination meta={data?.meta} onPage={(page) => setParams((p) => ({ ...p, page }))} />
        </>
      )}
    </div>
  );
}
