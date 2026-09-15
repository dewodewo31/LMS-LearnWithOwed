import { Link } from 'react-router-dom';
import { useHomeModules } from '../modules/hooks';

export default function HeroSection() {
  const { data } = useHomeModules();
  const stats = data?.stats;
  const firstCourse = data?.courses?.[0];

  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 sm:pt-40 sm:pb-28 lg:px-8 lg:pt-44 lg:pb-36">
      <div className="lp-container relative z-[2]">
        <div className="grid items-center gap-16 lg:grid-cols-[1.1fr_.9fr]">
          {/* Left — Content */}
          <div className="max-w-2xl">
            <p className="mb-5 font-lp-sans text-xs font-semibold uppercase tracking-[0.15em] text-lp-accent">
              Learning Management System
            </p>

            <h1 className="font-lp-sans text-[clamp(40px,7vw,88px)] font-extrabold leading-[0.95] tracking-[-0.06em] text-lp-text max-[767px]:text-center">
              Belajar
              <br />
              Programming
              <br />
              <span className="text-lp-accent">dengan Terstruktur</span>
            </h1>

            <p className="mt-7 max-w-xl text-[clamp(16px,2vw,19px)] font-medium leading-relaxed text-lp-muted max-[767px]:mx-auto max-[767px]:text-center">
              Platform LMS untuk pembelajaran coding yang terstruktur, terarah, dan menyenangkan.
              Belajar dari nol hingga mahir bersama mentor berpengalaman.
            </p>

            <div className="mt-10 flex items-center gap-3 max-[767px]:flex-col max-[767px]:items-stretch">
              <Link
                to="/register"
                className="inline-flex h-[48px] items-center justify-center rounded-lg bg-lp-text px-7 text-sm font-semibold text-lp-bg transition-colors hover:bg-lp-accent"
              >
                Mulai Belajar
              </Link>
              <a
                href="#modul"
                className="inline-flex h-[48px] items-center justify-center rounded-lg border border-lp-border px-7 text-sm font-semibold text-lp-text transition-colors hover:bg-lp-accent-soft"
              >
                Jelajahi Modul
              </a>
            </div>

            {stats && stats.totalCourses > 0 && (
              <div className="mt-14 grid grid-cols-3 gap-6 border-t border-lp-border pt-8 sm:gap-8">
                <div className="max-[767px]:text-center">
                  <p className="font-lp-sans text-2xl font-extrabold tracking-tight text-lp-text sm:text-4xl">{stats.totalCourses}</p>
                  <p className="mt-1 font-lp-sans text-[11px] uppercase tracking-wider text-lp-muted">Modul Pembelajaran</p>
                </div>
                <div className="max-[767px]:text-center">
                  <p className="font-lp-sans text-2xl font-extrabold tracking-tight text-lp-text sm:text-4xl">{stats.totalLessons}</p>
                  <p className="mt-1 font-lp-sans text-[11px] uppercase tracking-wider text-lp-muted">Total Lesson</p>
                </div>
                <div className="max-[767px]:text-center">
                  <p className="font-lp-sans text-2xl font-extrabold tracking-tight text-lp-text sm:text-4xl">{stats.categories}</p>
                  <p className="mt-1 font-lp-sans text-[11px] uppercase tracking-wider text-lp-muted">Kategori</p>
                </div>
              </div>
            )}
          </div>

          {/* Right — Course card (honest product representation) */}
          <div className="hidden lg:block">
            {firstCourse ? (
              <div className="group rounded-2xl border border-lp-border bg-lp-card p-6 transition-colors hover:border-lp-border-hover">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-lp-accent-soft">
                    <span className="font-lp-mono text-lg font-bold text-lp-accent">
                      {(firstCourse.category || 'M')[0]}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-lp-mono text-[10px] font-medium uppercase tracking-[0.2em] text-lp-accent">
                        {firstCourse.category || 'Pembelajaran'}
                      </span>
                      <span className="text-lp-border">·</span>
                      <span className="font-lp-mono text-[10px] uppercase tracking-wider text-lp-muted">
                        {firstCourse.totalLessons || 0} lesson
                      </span>
                    </div>
                    <h3 className="mt-2 font-lp-sans text-lg font-bold leading-snug text-lp-text">
                      {firstCourse.title || 'Modul Pembelajaran'}
                    </h3>
                  </div>
                </div>

                {/* Tentang Modul */}
                {firstCourse.shortDescription && (
                  <div className="mt-4">
                    <p className="font-lp-mono text-[10px] font-medium uppercase tracking-[0.15em] text-lp-muted">
                      Tentang Modul
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-lp-muted">
                      {firstCourse.shortDescription}
                    </p>
                  </div>
                )}

                {/* Poin Pembelajaran */}
                {firstCourse.learningObjectives?.length > 0 && (
                  <div className="mt-4">
                    <p className="font-lp-mono text-[10px] font-medium uppercase tracking-[0.15em] text-lp-muted">
                      Poin Pembelajaran
                    </p>
                    <ul className="mt-2 space-y-1.5">
                      {firstCourse.learningObjectives.slice(0, 3).map((obj, i) => (
                        <li key={i} className="flex items-start gap-2 text-[13px] text-lp-muted">
                          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-lp-accent" />
                          {obj}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex items-center justify-between">
                  <span className="font-lp-mono text-[10px] uppercase tracking-wider text-lp-muted">
                    {firstCourse.enrolledCount || 0} siswa
                  </span>
                  <Link
                    to={`/modules/${firstCourse.slug || ''}`}
                    className="inline-flex items-center gap-1.5 font-lp-sans text-xs font-semibold text-lp-text transition-colors hover:text-lp-accent"
                  >
                    Mulai Belajar
                    <svg className="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-lp-border bg-lp-card p-8 text-center">
                <p className="font-lp-sans text-sm text-lp-muted">Modul baru segera tersedia</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
