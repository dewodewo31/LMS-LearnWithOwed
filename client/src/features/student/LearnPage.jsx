import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FiArrowLeft, FiArrowRight, FiBookOpen, FiCheck, FiCheckCircle, FiChevronDown,
  FiClipboard, FiFileText, FiHelpCircle, FiMessageSquare, FiPlay,
} from 'react-icons/fi';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import Progress from '../../components/ui/Progress';
import { ErrorState, Skeleton } from '../../components/ui/States';
import StudentTopBar from '../../layouts/StudentTopBar';
import { ProtectedLessonContent, ProtectedLessonVideo } from './ProtectedLesson';

function LessonIcon({ done, contentType }) {
  if (done) return <FiCheckCircle className="shrink-0 text-[#4ADE80]" aria-hidden="true" />;
  if (contentType === 'assignment') return <FiClipboard className="shrink-0 text-ink-muted" aria-hidden="true" />;
  return contentType === 'video' ? (
    <FiPlay className="shrink-0 text-ink-muted" aria-hidden="true" />
  ) : (
    <FiFileText className="shrink-0 text-ink-muted" aria-hidden="true" />
  );
}

function AssignmentLessonCard({ assignmentId }) {
  if (!assignmentId) {
    return (
      <div role="alert" className="rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-5 py-4 text-sm text-[#FBBF24]">
        Assignment belum tersedia. Silakan cek kembali nanti.
      </div>
    );
  }
  return (
    <section className="rounded-2xl border border-edge bg-surface p-6">
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400" aria-hidden="true">
          <FiClipboard className="text-xl" />
        </span>
        <div className="min-w-0">
          <h2 className="text-base font-bold text-ink">Lesson ini berupa assignment</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Baca instruksi, unduh file soal, kerjakan, lalu kumpulkan hasil tugasmu di halaman assignment.
          </p>
          <Link to={`/student/assignments/${assignmentId}`} className="mt-4 inline-block">
            <Button>
              <FiClipboard aria-hidden="true" /> Buka Assignment
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function LearnPage() {
  const { courseId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [listOpen, setListOpen] = useState(false);

  const courseQ = useQuery({ queryKey: ['course', courseId], queryFn: () => api.get(`/courses/${courseId}`) });
  const progressQ = useQuery({ queryKey: ['progress', courseId], queryFn: () => api.get(`/courses/${courseId}/progress`) });

  const lessons = courseQ.data?.data?.lessons || [];
  const completed = useMemo(() => new Set(progressQ.data?.data?.completedLessonIds || []), [progressQ.data]);

  const lessonId = searchParams.get('lessonId') || lessons.find((l) => !completed.has(l._id))?._id || lessons[0]?._id;
  const index = lessons.findIndex((l) => l._id === lessonId);
  const lesson = lessons[index];
  const percent = progressQ.data?.data?.percent || 0;

  const contentQ = useQuery({
    queryKey: ['lesson-content', lessonId],
    queryFn: () => api.get(`/lessons/${lessonId}/content`),
    enabled: Boolean(lessonId),
  });
  const content = contentQ.data?.data?.lesson;

  const completeMut = useMutation({
    mutationFn: () => api.post(`/lessons/${lessonId}/complete`),
    onSuccess: (d) => {
      qc.invalidateQueries({ queryKey: ['progress', courseId] });
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      if (d.data.enrollmentStatus === 'completed') {
        toast.success('Selamat! Kamu telah menyelesaikan course ini.');
      } else {
        toast.success('Lesson selesai');
        const next = lessons[index + 1];
        if (next) setSearchParams({ lessonId: next._id });
      }
    },
    onError: (err) => toast.error(err.message),
  });

  if (courseQ.isLoading || progressQ.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-6 w-72" />
        <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
          <Skeleton className="hidden h-96 lg:block" />
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="aspect-video w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
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

  const course = courseQ.data.data.course;
  const goto = (l) => l && setSearchParams({ lessonId: l._id });

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 sm:px-6 lg:px-8 lg:space-y-8">
      <StudentTopBar
        backTo={`/student/courses/${courseId}`}
        items={[
          { label: 'Beranda', to: '/student', hideOnMobile: true },
          { label: course.title, to: `/student/courses/${courseId}` },
          { label: lesson ? `Lesson ${lesson.order}` : 'Lesson' },
        ]}
      />

      <div className="lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
        {/* ── Desktop sidebar: course contents ──────────────────────── */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            {/* Course progress card */}
            <div className="rounded-2xl border border-edge bg-surface p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-primary-400">Course</p>
              <p className="mt-1.5 truncate text-sm font-bold text-ink" title={course.title}>{course.title}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-muted tabular-nums">
                <span>{percent}% selesai</span>
                <span>{completed.size}/{lessons.length} lesson</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
                <div className="h-full rounded-full bg-primary-500 transition-all" style={{ width: `${percent}%` }} />
              </div>
            </div>

            {/* Lesson nav — independent scroll */}
            <nav aria-label="Daftar lesson" className="overflow-hidden rounded-2xl border border-edge bg-surface">
              <p className="border-b border-edge px-5 py-3 text-xs font-semibold uppercase tracking-widest text-ink-muted">
                Isi Course
              </p>
              <ul className="max-h-[calc(100vh-19rem)] overflow-y-auto py-2">
                {lessons.map((l) => {
                  const done = completed.has(l._id);
                  const current = l._id === lessonId;
                  return (
                    <li key={l._id}>
                      <button
                        onClick={() => goto(l)}
                        aria-current={current ? 'page' : undefined}
                        className={`flex w-full items-center gap-3 px-5 py-2.5 text-left text-sm transition-colors ${
                          current
                            ? 'bg-primary-500/10 font-semibold text-primary-400'
                            : done
                              ? 'text-ink-muted hover:bg-surface-hover'
                              : 'text-ink-soft hover:bg-surface-hover'
                        }`}
                      >
                        <LessonIcon done={done} contentType={l.contentType} />
                        <span className="min-w-0 flex-1 truncate">{l.title}</span>
                        <span className="shrink-0 text-xs text-ink-muted tabular-nums">{l.order}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </nav>
          </div>
        </aside>

        {/* ── Main column ───────────────────────────────────────────── */}
        <main className="min-w-0 lg:max-w-[880px]">
          {lesson ? (
            <div className="space-y-6 lg:space-y-8">
              {/* Mobile: title + progress + contents accordion */}
              <div className="lg:hidden">
                <p className="text-xs font-medium text-ink-muted tabular-nums">
                  Lesson {lesson.order} dari {lessons.length}
                </p>
                <h1 className="mt-1 text-xl font-extrabold leading-snug text-ink">{lesson.title}</h1>
                <div className="mt-4">
                  <Progress percent={percent} label={`${completed.size}/${lessons.length} lessons selesai`} />
                </div>
                <button
                  onClick={() => setListOpen((v) => !v)}
                  aria-expanded={listOpen}
                  className="mt-4 flex w-full items-center justify-between gap-3 rounded-xl border border-edge bg-surface px-4 py-3 text-sm font-semibold text-ink-soft transition-colors hover:bg-surface-hover"
                >
                  <span className="flex items-center gap-2">
                    <FiBookOpen aria-hidden="true" /> Isi Course
                  </span>
                  <FiChevronDown className={`text-lg transition-transform ${listOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                {listOpen && (
                  <ul className="mt-3 divide-y divide-edge overflow-hidden rounded-xl border border-edge bg-surface">
                    {lessons.map((l) => {
                      const done = completed.has(l._id);
                      const current = l._id === lessonId;
                      return (
                        <li key={l._id}>
                          <button
                            onClick={() => { setListOpen(false); goto(l); }}
                            aria-current={current ? 'page' : undefined}
                            className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm ${
                              current
                                ? 'bg-primary-500/10 font-semibold text-primary-400'
                                : done
                                  ? 'text-ink-muted'
                                  : 'text-ink-soft hover:bg-surface-hover'
                            }`}
                          >
                            <LessonIcon done={done} contentType={l.contentType} />
                            <span className="min-w-0 flex-1 truncate">{l.title}</span>
                            <span className="shrink-0 text-xs text-ink-muted tabular-nums">{l.order}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* Desktop: lesson title */}
              <header className="hidden lg:block">
                <p className="text-xs font-semibold uppercase tracking-widest text-primary-400">
                  Lesson {lesson.order} dari {lessons.length}
                </p>
                <h1 className="mt-2 text-3xl font-extrabold leading-tight text-ink">{lesson.title}</h1>
              </header>

              {/* Video / lesson body */}
              {contentQ.isLoading ? (
                <Skeleton className="aspect-video w-full" />
              ) : contentQ.error ? (
                <ErrorState message={contentQ.error.message} onRetry={contentQ.refetch} />
              ) : content?.contentType === 'video' && content?.youtubeVideoId ? (
                <ProtectedLessonVideo videoId={content.youtubeVideoId} title={lesson.title} />
              ) : content?.contentType === 'video' ? (
                <div role="alert" className="rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-5 py-4 text-sm text-[#FBBF24]">
                  Video lesson belum dikonfigurasi.
                </div>
              ) : content?.contentType === 'assignment' ? (
                <AssignmentLessonCard assignmentId={content.assignmentId} />
              ) : content?.textContent ? (
                <article className="rounded-2xl border border-edge bg-surface p-5 lg:p-8">
                  <ProtectedLessonContent html={content.textContent} />
                </article>
              ) : (
                <div role="alert" className="rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-5 py-4 text-sm text-[#FBBF24]">
                  Konten lesson belum tersedia.
                </div>
              )}

              {/* Community */}
              <section className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface p-5 sm:flex-row sm:items-center sm:justify-between lg:p-6">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-primary-400" aria-hidden="true">
                    <FiHelpCircle className="text-lg" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-ink">Butuh bantuan dengan lesson ini?</p>
                    <p className="text-xs text-ink-muted">Tanya ke kelas dan mentor di komunitas course.</p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => navigate(`/student/courses/${courseId}/community`)}>
                    <FiMessageSquare aria-hidden="true" /> Lihat Diskusi
                  </Button>
                  <Button size="sm" onClick={() => navigate(`/student/courses/${courseId}/community?ask=1`)}>
                    <FiHelpCircle aria-hidden="true" /> Tanya
                  </Button>
                </div>
              </section>

              {/* Previous / Complete / Next */}
              <section aria-label="Navigasi lesson" className="border-t border-edge pt-6">
                {/* Mobile: 2-col row + full-width complete */}
                <div className="grid grid-cols-2 gap-3 lg:hidden">
                  <Button
                    variant="secondary"
                    disabled={index <= 0}
                    onClick={() => goto(lessons[index - 1])}
                  >
                    <FiArrowLeft aria-hidden="true" /> Sebelumnya
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={index >= lessons.length - 1}
                    onClick={() => goto(lessons[index + 1])}
                  >
                    Berikutnya <FiArrowRight aria-hidden="true" />
                  </Button>
                  <div className="col-span-2">
                    {completed.has(lessonId) ? (
                      <span className="flex w-full items-center justify-center gap-2 rounded-full bg-[#22C55E]/10 px-4 py-3 text-sm font-semibold text-[#4ADE80]">
                        <FiCheckCircle aria-hidden="true" /> Lesson ini selesai
                      </span>
                    ) : (
                      <Button onClick={() => completeMut.mutate()} loading={completeMut.isPending} className="w-full">
                        <FiCheck aria-hidden="true" /> Tandai Selesai
                      </Button>
                    )}
                  </div>
                </div>

                {/* Desktop: single aligned row */}
                <div className="hidden items-center justify-between gap-4 lg:flex">
                  <Button
                    variant="secondary"
                    disabled={index <= 0}
                    onClick={() => goto(lessons[index - 1])}
                  >
                    <FiArrowLeft aria-hidden="true" /> Sebelumnya
                  </Button>
                  {completed.has(lessonId) ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#22C55E]/10 px-5 py-2.5 text-sm font-semibold text-[#4ADE80]">
                      <FiCheckCircle aria-hidden="true" /> Lesson ini selesai
                    </span>
                  ) : (
                    <Button onClick={() => completeMut.mutate()} loading={completeMut.isPending}>
                      <FiCheck aria-hidden="true" /> Tandai Selesai
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    disabled={index >= lessons.length - 1}
                    onClick={() => goto(lessons[index + 1])}
                  >
                    Berikutnya <FiArrowRight aria-hidden="true" />
                  </Button>
                </div>
              </section>
            </div>
          ) : (
            <div className="rounded-2xl border border-edge bg-surface px-6 py-20 text-center">
              <FiBookOpen className="mx-auto mb-4 text-4xl text-ink-muted" aria-hidden="true" />
              <p className="text-ink-muted">Materi belum tersedia. Silakan cek kembali nanti.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
