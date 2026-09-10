import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from 'react-router-dom';
import { FiArrowRight, FiCheckCircle, FiLock, FiMessageSquare, FiPlayCircle } from 'react-icons/fi';
import { api } from '../../lib/api';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Progress from '../../components/ui/Progress';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import StudentTopBar from '../../layouts/StudentTopBar';

const TABS = [
  { id: 'lessons', label: 'Materi' },
  { id: 'about', label: 'Tentang' },
  { id: 'discussions', label: 'Diskusi' },
];

export default function StudentCoursePage() {
  const { id } = useParams();
  const [tab, setTab] = useState('lessons');

  const courseQ = useQuery({ queryKey: ['course', id], queryFn: () => api.get(`/courses/${id}`) });
  const progressQ = useQuery({ queryKey: ['progress', id], queryFn: () => api.get(`/courses/${id}/progress`) });

  if (courseQ.isLoading || progressQ.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }
  if (courseQ.error) {
    return (
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <ErrorState message={courseQ.error.message} onRetry={courseQ.refetch} />
      </div>
    );
  }

  const { course, lessons } = courseQ.data.data;
  const progress = progressQ.data?.data;
  const completed = new Set(progress?.completedLessonIds || []);
  const firstIncomplete = lessons.find((l) => !completed.has(l._id)) || lessons[0];
  const enrollStatus = progress?.percent >= 100 ? 'completed' : 'active';
  const language = course.language === 'en' ? 'English' : 'Indonesia';

  const startLearning = () => {
    if (!firstIncomplete) return;
    window.location.assign(`/student/learn/${course.id}?lessonId=${firstIncomplete._id}`);
  };

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 sm:px-6 lg:px-8 lg:space-y-8">
      <StudentTopBar
        backTo="/student"
        items={[
          { label: 'Beranda', to: '/student', hideOnMobile: true },
          { label: course.title },
        ]}
      />

      {/* ── Course header: preview + info ─────────────────────────── */}
      <section
        aria-label="Info kursus"
        className="overflow-hidden rounded-2xl border border-edge bg-surface p-4 sm:p-5 lg:grid lg:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)] lg:gap-8 lg:p-6"
      >
        {/* Preview — fixed aspect ratio, never overflows */}
        <div className="overflow-hidden rounded-xl bg-primary-500/10">
          {course.thumbnail ? (
            <img src={course.thumbnail} alt="" className="aspect-video w-full object-cover" />
          ) : (
            <div className="flex aspect-video w-full items-center justify-center text-primary-400">
              <FiPlayCircle className="text-5xl" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Info panel */}
        <div className="mt-5 flex min-w-0 flex-col lg:mt-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary-400">
            {course.category || 'Tanpa Kategori'}
          </p>
          <h1 className="mt-2 text-2xl font-extrabold leading-tight text-ink lg:text-3xl">{course.title}</h1>
          {course.shortDescription && (
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">{course.shortDescription}</p>
          )}

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm sm:max-w-md">
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-ink-muted">Mentor</dt>
              <dd className="truncate font-medium text-ink">{course.mentor?.name || '—'}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-ink-muted">Level</dt>
              <dd className="truncate font-medium text-ink capitalize">{course.level}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-ink-muted">Bahasa</dt>
              <dd className="font-medium text-ink">{language}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="shrink-0 text-ink-muted">Lessons</dt>
              <dd className="font-medium text-ink">{course.totalLessons}</dd>
            </div>
          </dl>

          <div className="mt-5">
            <Progress percent={progress?.percent || 0} label={`${completed.size} / ${lessons.length} lessons selesai`} />
          </div>

          {/* CTA — pinned to bottom of info column */}
          <div className="mt-6 flex flex-wrap gap-3 lg:mt-auto lg:pt-6">
            {firstIncomplete && (
              <Button onClick={startLearning}>
                <FiPlayCircle aria-hidden="true" /> {completed.size > 0 ? 'Lanjutkan Belajar' : 'Mulai Belajar'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => window.location.assign(`/student/courses/${course.id}/community`)}>
              <FiMessageSquare aria-hidden="true" /> Diskusi
            </Button>
            <span className="hidden items-center lg:inline-flex">
              <Badge value={enrollStatus} />
            </span>
          </div>
          <div className="mt-3 lg:hidden">
            <Badge value={enrollStatus} />
          </div>
        </div>
      </section>

      {/* ── Tabs ──────────────────────────────────────────────────── */}
      <div role="tablist" aria-label="Navigasi course" className="flex gap-1 overflow-x-auto rounded-xl bg-surface p-1 no-scrollbar">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
              tab === t.id
                ? 'bg-primary-600 text-white'
                : 'text-ink-muted hover:bg-surface-hover hover:text-ink-soft'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Materi ───────────────────────────────────────────── */}
      {tab === 'lessons' && (
        <section aria-label="Daftar lesson" className="overflow-hidden rounded-2xl border border-edge bg-surface">
          <header className="flex items-center justify-between gap-4 border-b border-edge px-5 py-4 lg:px-6">
            <h2 className="text-base font-bold text-ink">Daftar Lesson</h2>
            <span className="text-sm text-ink-muted tabular-nums">
              {completed.size}/{lessons.length} selesai
            </span>
          </header>
          {lessons.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={FiLock}
                title="Materi belum tersedia"
                body="Silakan cek kembali nanti."
              />
            </div>
          ) : (
            <ul className="divide-y divide-edge">
              {lessons.map((l) => {
                const isDone = completed.has(l._id);
                const isNext = firstIncomplete && l._id === firstIncomplete._id;
                return (
                  <li key={l._id}>
                    <Link
                      to={`/student/learn/${course.id}?lessonId=${l._id}`}
                      className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-surface-hover sm:px-5 lg:px-6"
                    >
                      {/* Status — fixed 40px column */}
                      <span
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-base ${
                          isDone
                            ? 'bg-[#22C55E]/10 text-[#4ADE80]'
                            : isNext
                              ? 'bg-primary-500 text-white'
                              : 'bg-surface-hover text-ink-muted'
                        }`}
                        aria-hidden="true"
                      >
                        {isDone ? <FiCheckCircle /> : isNext ? <FiPlayCircle className="ml-0.5" /> : <FiLock />}
                      </span>

                      {/* Title + meta */}
                      <span className="min-w-0 flex-1">
                        <span className={`block truncate text-sm font-medium ${isDone ? 'text-ink-muted' : 'text-ink'}`}>
                          {l.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-ink-muted tabular-nums">
                          Lesson {l.order}{l.duration ? ` · ${l.duration} menit` : ''}
                        </span>
                      </span>

                      {/* Right column — fixed, never shifts */}
                      <span className="flex shrink-0 items-center gap-2">
                        <Badge value={l.contentType} className="hidden sm:inline-flex" />
                        {isNext && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary-400">
                            Lanjutkan <FiArrowRight aria-hidden="true" />
                          </span>
                        )}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {/* ── Tab: Tentang ──────────────────────────────────────────── */}
      {tab === 'about' && (
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2 lg:gap-8">
          {course.learningObjectives?.length > 0 && (
            <section className="rounded-2xl border border-edge bg-surface p-5 lg:p-6">
              <h2 className="text-base font-bold text-ink">Apa yang akan kamu pelajari</h2>
              <ul className="mt-4 grid gap-3">
                {course.learningObjectives.map((o, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink-soft">
                    <FiCheckCircle className="mt-0.5 shrink-0 text-[#4ADE80]" aria-hidden="true" />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}
          {course.requirements?.length > 0 && (
            <section className="rounded-2xl border border-edge bg-surface p-5 lg:p-6">
              <h2 className="text-base font-bold text-ink">Requirements</h2>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-relaxed text-ink-soft">
                {course.requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </section>
          )}
          {!course.learningObjectives?.length && !course.requirements?.length && (
            <section className="rounded-2xl border border-edge bg-surface p-6 lg:col-span-2">
              <p className="text-sm text-ink-muted">Belum ada deskripsi tambahan untuk course ini.</p>
            </section>
          )}
        </div>
      )}

      {/* ── Tab: Diskusi ──────────────────────────────────────────── */}
      {tab === 'discussions' && (
        <section className="flex flex-col items-center gap-4 rounded-2xl border border-edge bg-surface p-8 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 text-primary-400" aria-hidden="true">
            <FiMessageSquare className="text-xl" />
          </span>
          <div>
            <h2 className="text-base font-bold text-ink">Diskusi Course</h2>
            <p className="mt-1 text-sm text-ink-muted">Tanya mentor dan diskusi dengan peserta lain di komunitas course ini.</p>
          </div>
          <Button onClick={() => window.location.assign(`/student/courses/${course.id}/community`)}>
            <FiMessageSquare aria-hidden="true" /> Buka Diskusi
          </Button>
        </section>
      )}
    </div>
  );
}
