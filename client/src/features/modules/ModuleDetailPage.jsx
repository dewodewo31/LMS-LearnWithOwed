import { Link, useParams } from 'react-router-dom';
import {
  FiArrowLeft, FiArrowRight, FiBookOpen, FiCheck, FiCheckSquare,
  FiFileText, FiLayers, FiPlayCircle,
} from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';
import TopBar from './TopBar';
import { useModuleDetail } from './hooks';

const pad = (n) => String(n).padStart(2, '0');

function Breadcrumb({ title }) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 font-lp-mono text-[11px] uppercase tracking-widest text-lp-muted-light">
      <Link to="/" className="transition-colors hover:text-lp-text">Beranda</Link>
      <span aria-hidden="true">/</span>
      <Link to="/modules" className="transition-colors hover:text-lp-text">Modul</Link>
      <span aria-hidden="true">/</span>
      <span className="max-w-[260px] truncate text-lp-muted">{title}</span>
    </nav>
  );
}

function AccessCTA() {
  const { user } = useAuth();
  const href = !user ? '/login' : user.role === 'student' ? '/student' : '/dashboard';
  const label = !user ? 'Masuk untuk Akses' : 'Buka Dashboard';
  return (
    <div className="mt-8">
      <Link
        to={href}
        className="inline-flex h-[48px] items-center justify-center gap-3 rounded-full bg-lp-text px-7 text-sm font-semibold text-lp-bg transition-all hover:bg-lp-accent hover:-translate-y-[3px]"
      >
        {label}
        <FiArrowRight className="text-base" aria-hidden="true" />
      </Link>
      <p className="mt-3 text-xs leading-relaxed text-lp-muted">
        Akses ke modul diberikan oleh admin setelah pendaftaran akun.
      </p>
    </div>
  );
}

function LessonIcon({ contentType }) {
  return contentType === 'video'
    ? <FiPlayCircle className="shrink-0 text-lp-muted" aria-hidden="true" />
    : <FiFileText className="shrink-0 text-lp-muted" aria-hidden="true" />;
}

function DetailSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-3 w-48 rounded bg-lp-card-hover" />
      <div className="mt-10 grid gap-10 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-4">
          <div className="h-3 w-24 rounded bg-lp-card-hover" />
          <div className="h-10 w-full rounded bg-lp-card-hover" />
          <div className="h-10 w-2/3 rounded bg-lp-card-hover" />
          <div className="h-4 w-full rounded bg-lp-card-hover" />
          <div className="h-4 w-3/4 rounded bg-lp-card-hover" />
          <div className="h-9 w-40 rounded-full bg-lp-card-hover" />
        </div>
        <div className="aspect-video rounded-[20px] bg-lp-card-hover" />
      </div>
    </div>
  );
}

const NAV_ANCHOR = 'inline-flex whitespace-nowrap px-4 py-3.5 text-sm font-medium text-lp-muted transition-colors hover:text-lp-text border-b-2 border-transparent hover:border-lp-border-hover';

export default function ModuleDetailPage() {
  const { slug } = useParams();
  const { data, isLoading, error, refetch } = useModuleDetail(slug);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-lp-bg-soft">
        <TopBar />
        <main className="px-4 py-12 sm:px-6">
          <div className="lp-container"><DetailSkeleton /></div>
        </main>
      </div>
    );
  }

  if (error) {
    const notFound = error.status === 404;
    return (
      <div className="min-h-screen bg-lp-bg-soft">
        <TopBar />
        <main className="px-4 py-20 sm:px-6">
          <div className="lp-container">
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-lp-border px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lp-accent-soft text-lp-accent">
                <FiBookOpen className="text-xl" aria-hidden="true" />
              </div>
              <h1 className="font-lp-sans text-lg font-bold text-lp-text">
                {notFound ? 'Modul tidak ditemukan' : 'Gagal memuat modul'}
              </h1>
              <p className="mt-1.5 text-sm leading-relaxed text-lp-muted">
                {notFound
                  ? 'Modul ini mungkin sudah diarsipkan atau belum dipublikasikan.'
                  : 'Terjadi kesalahan saat memuat modul. Silakan coba lagi.'}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                {notFound ? (
                  <Link to="/modules" className="inline-flex items-center gap-2 rounded-full bg-lp-text px-5 py-2.5 text-xs font-bold text-lp-bg transition-colors hover:bg-lp-accent">
                    Lihat Semua Modul <FiArrowRight aria-hidden="true" />
                  </Link>
                ) : (
                  <button onClick={refetch} className="rounded-full border border-[#F87171]/40 px-5 py-2 text-xs font-bold text-[#F87171] transition-colors hover:bg-[#EF4444]/20">
                    Coba Lagi
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const course = data.course;
  const lessons = data.lessons ?? [];
  const hasObjectives = (course.learningObjectives ?? []).length > 0;
  const hasRequirements = (course.requirements ?? []).length > 0;
  const navItems = [
    { href: '#tentang', label: 'Tentang' },
    ...(hasObjectives ? [{ href: '#poin', label: 'Poin Pembelajaran' }] : []),
    ...(hasRequirements ? [{ href: '#prasyarat', label: 'Prasyarat' }] : []),
    { href: '#materi', label: 'Materi' },
  ];

  return (
    <div className="min-h-screen bg-lp-bg-soft">
      <TopBar />
      <main className="px-4 pb-24 pt-10 sm:px-6">
        <div className="lp-container">
          <Breadcrumb title={course.title} />

          {/* Hero */}
          <section className="mt-8 grid gap-10 lg:grid-cols-[1.1fr_.9fr] lg:items-start">
            <div>
              <p className="font-lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-lp-accent">
                {course.category || 'Modul Pembelajaran'}
              </p>
              <h1 className="mt-3 break-words font-lp-sans text-[clamp(30px,4.5vw,52px)] font-bold leading-[1.05] tracking-[-0.04em] text-lp-text">
                {course.title}
              </h1>
              {course.shortDescription && (
                <p className="mt-5 max-w-xl text-base leading-relaxed text-lp-muted sm:text-lg">
                  {course.shortDescription}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-lp-mono text-[11px] uppercase tracking-widest text-lp-muted-light">
                {course.totalLessons > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <FiLayers aria-hidden="true" />
                    {course.totalLessons} {course.totalLessons === 1 ? 'Lesson' : 'Lessons'}
                  </span>
                )}
                <span>{course.level}</span>
                <span>{course.language}</span>
              </div>
              <AccessCTA />
            </div>

            <div className="overflow-hidden rounded-[20px] border border-lp-border bg-lp-card">
              {course.thumbnail ? (
                <img src={course.thumbnail} alt={course.title} className="aspect-video w-full object-cover" />
              ) : (
                <div className="flex aspect-video w-full flex-col items-center justify-center gap-2 bg-lp-accent-soft">
                  <FiBookOpen className="text-4xl text-lp-accent" aria-hidden="true" />
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Section nav — sticky under the top bar */}
        <nav aria-label="Navigasi modul" className="sticky top-16 z-30 mt-14 border-y border-lp-border bg-lp-bg-soft/95 backdrop-blur">
          <div className="lp-container flex gap-1 overflow-x-auto no-scrollbar">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className={NAV_ANCHOR}>
                {item.label}
              </a>
            ))}
          </div>
        </nav>

        <div className="lp-container mt-14 space-y-20 max-[767px]:space-y-14">
          {/* About */}
          <section id="tentang" className="scroll-mt-32">
            <h2 className="font-lp-sans text-2xl font-bold tracking-tight text-lp-text sm:text-3xl">Tentang Modul</h2>
            <div className="lesson-content mt-6 max-w-3xl text-lp-muted" dangerouslySetInnerHTML={{ __html: course.description || '' }} />
          </section>

          {/* Key points */}
          {hasObjectives && (
            <section id="poin" className="scroll-mt-32">
              <h2 className="font-lp-sans text-2xl font-bold tracking-tight text-lp-text sm:text-3xl">Poin Pembelajaran</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {course.learningObjectives.map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-xl border border-lp-border bg-lp-card px-4 py-3.5">
                    <FiCheck className="mt-0.5 shrink-0 text-lp-accent" aria-hidden="true" />
                    <span className="break-words text-sm leading-relaxed text-lp-text">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Prerequisites */}
          {hasRequirements && (
            <section id="prasyarat" className="scroll-mt-32">
              <h2 className="font-lp-sans text-2xl font-bold tracking-tight text-lp-text sm:text-3xl">Prasyarat</h2>
              <ul className="mt-6 max-w-3xl space-y-3">
                {course.requirements.map((item) => (
                  <li key={item} className="flex items-start gap-3 rounded-xl border border-lp-border bg-lp-card px-4 py-3.5">
                    <FiCheckSquare className="mt-0.5 shrink-0 text-lp-accent" aria-hidden="true" />
                    <span className="break-words text-sm leading-relaxed text-lp-text">{item}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Lessons / syllabus */}
          <section id="materi" className="scroll-mt-32">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-lp-sans text-2xl font-bold tracking-tight text-lp-text sm:text-3xl">Materi Pembelajaran</h2>
              {lessons.length > 0 && (
                <span className="font-lp-mono text-[11px] uppercase tracking-widest text-lp-muted-light">
                  {lessons.length} {lessons.length === 1 ? 'Lesson' : 'Lessons'}
                </span>
              )}
            </div>
            {lessons.length === 0 ? (
              <p className="mt-6 rounded-xl border border-dashed border-lp-border px-5 py-8 text-center text-sm text-lp-muted">
                Belum ada materi yang dipublikasikan untuk modul ini.
              </p>
            ) : (
              <ol className="mt-6 max-w-3xl space-y-2.5">
                {lessons.map((lesson) => (
                  <li
                    key={lesson.id}
                    className="flex items-center gap-4 rounded-xl border border-lp-border bg-lp-card px-5 py-4 transition-colors hover:border-lp-border-hover"
                  >
                    <span className="w-7 shrink-0 font-lp-mono text-sm font-medium text-lp-accent">{pad(lesson.order)}</span>
                    <span className="min-w-0 flex-1 break-words text-sm font-medium text-lp-text">{lesson.title}</span>
                    {lesson.duration ? (
                      <span className="shrink-0 font-lp-mono text-[11px] text-lp-muted-light">{lesson.duration} menit</span>
                    ) : null}
                    <LessonIcon contentType={lesson.contentType} />
                  </li>
                ))}
              </ol>
            )}
          </section>

          <div>
            <Link
              to="/modules"
              className="inline-flex items-center gap-2 rounded-full border border-lp-border px-6 py-3 text-sm font-semibold text-lp-text transition-all hover:bg-lp-accent-soft hover:border-lp-border-hover"
            >
              <FiArrowLeft aria-hidden="true" />
              Kembali ke Semua Modul
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
