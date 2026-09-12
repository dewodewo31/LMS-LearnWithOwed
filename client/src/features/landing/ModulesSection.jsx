import { Link } from 'react-router-dom';
import { FiArrowRight, FiBookOpen } from 'react-icons/fi';
import ModuleCard from '../modules/ModuleCard';
import { useHomeModules } from '../modules/hooks';

function ModuleGridSkeleton() {
  return (
    <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="animate-pulse overflow-hidden rounded-[20px] border border-lp-border bg-lp-card">
          <div className="aspect-video bg-lp-card-hover" />
          <div className="space-y-3 p-6">
            <div className="h-3 w-20 rounded bg-lp-card-hover" />
            <div className="h-4 w-3/4 rounded bg-lp-card-hover" />
            <div className="h-3 w-full rounded bg-lp-card-hover" />
            <div className="h-3 w-2/3 rounded bg-lp-card-hover" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-3 w-16 rounded bg-lp-card-hover" />
              <div className="h-9 w-28 rounded-full bg-lp-card-hover" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ModulesSection() {
  const { data, isLoading, error, refetch } = useHomeModules();
  const courses = data?.courses ?? [];

  return (
    <section id="modul" className="bg-lp-bg-soft px-4 py-[140px] sm:px-6 max-[767px]:py-[90px]">
      <div className="lp-container">
        {/* Section header */}
        <header className="mb-16 text-center lp-reveal">
          <p className="mb-3 font-lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-lp-accent">
            01 — Modul Pembelajaran
          </p>
          <h2 className="font-lp-sans text-[clamp(32px,5vw,52px)] font-bold tracking-[-0.05em] leading-tight text-lp-text">
            Modul Pembelajaran Tersedia
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-lp-muted">
            Jelajahi modul pembelajaran yang sedang tersedia di platform. Akses ke setiap modul
            diberikan oleh admin sesuai dengan pendaftaran akunmu.
          </p>
        </header>

        {isLoading ? (
          <ModuleGridSkeleton />
        ) : error ? (
          <div role="alert" className="mx-auto max-w-md rounded-2xl border border-[#EF4444]/25 bg-[#EF4444]/10 px-6 py-8 text-center">
            <p className="text-sm font-medium text-[#F87171]">Gagal memuat modul pembelajaran.</p>
            <p className="mt-1 text-xs text-lp-muted">Silakan coba lagi.</p>
            <button
              onClick={refetch}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#F87171]/40 px-5 py-2 text-xs font-bold text-[#F87171] transition-colors hover:bg-[#EF4444]/20"
            >
              Coba Lagi
            </button>
          </div>
        ) : courses.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-lp-border px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lp-accent-soft text-lp-accent">
              <FiBookOpen className="text-xl" aria-hidden="true" />
            </div>
            <h3 className="font-lp-sans text-lg font-bold text-lp-text">Belum ada modul pembelajaran</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-lp-muted">
              Modul baru akan muncul di sini setelah dipublikasikan oleh admin.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-4">
              {courses.map((course, index) => (
                <ModuleCard key={course.id} course={course} index={index} />
              ))}
            </div>

            <div className="mt-14 text-center">
              <Link
                to="/modules"
                className="inline-flex items-center gap-2.5 rounded-full border border-lp-border bg-lp-card px-8 py-3.5 text-sm font-semibold text-lp-text transition-all hover:bg-lp-accent-soft hover:border-lp-border-hover hover:-translate-y-[2px]"
              >
                Lihat Semua Modul
                <FiArrowRight aria-hidden="true" />
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
