import { FiArrowDown, FiBookOpen } from 'react-icons/fi';
import { Spinner } from '../../components/ui/States';
import ModuleCard from './ModuleCard';
import TopBar from './TopBar';
import { useAllModules } from './hooks';

function ModuleGridSkeleton() {
  return (
    <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
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

export default function AllModulesPage() {
  const { data, isLoading, error, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } = useAllModules();
  const modules = data?.modules ?? [];

  const loadMore = () => {
    if (isFetchingNextPage) return;
    fetchNextPage();
  };

  return (
    <div className="min-h-screen bg-lp-bg-soft">
      <TopBar />
      <main className="px-4 py-16 sm:px-6 max-[767px]:py-12">
        <div className="lp-container">
          <header className="mb-14 max-[767px]:mb-10">
            <p className="mb-3 font-lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-lp-accent">
              Modul Pembelajaran
            </p>
            <h1 className="font-lp-sans text-[clamp(30px,5vw,48px)] font-bold tracking-[-0.05em] leading-tight text-lp-text">
              Semua Modul Pembelajaran
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-lp-muted">
              Jelajahi seluruh modul pembelajaran yang tersedia di platform. Akses ke setiap modul
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
          ) : modules.length === 0 ? (
            <div className="mx-auto max-w-md rounded-2xl border border-dashed border-lp-border px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lp-accent-soft text-lp-accent">
                <FiBookOpen className="text-xl" aria-hidden="true" />
              </div>
              <h2 className="font-lp-sans text-lg font-bold text-lp-text">Belum ada modul pembelajaran</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-lp-muted">
                Modul baru akan muncul di sini setelah dipublikasikan oleh admin.
              </p>
            </div>
          ) : (
            <>
              <div className="grid gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                {modules.map((course, index) => (
                  <ModuleCard key={course.id} course={course} index={index} />
                ))}
              </div>

              <div className="mt-14 flex flex-col items-center gap-3">
                {hasNextPage ? (
                  <button
                    onClick={loadMore}
                    disabled={isFetchingNextPage}
                    className="inline-flex items-center gap-2.5 rounded-full border border-lp-border bg-lp-card px-7 py-3 text-sm font-semibold text-lp-text transition-all hover:bg-lp-accent-soft hover:border-lp-border-hover disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Spinner className="h-4 w-4 text-lp-accent" />
                        Memuat modul…
                      </>
                    ) : (
                      <>
                        Muat Lebih Banyak
                        <FiArrowDown aria-hidden="true" />
                      </>
                    )}
                  </button>
                ) : (
                  <p className="font-lp-mono text-[11px] uppercase tracking-widest text-lp-muted-light">
                    Kamu telah melihat semua modul yang tersedia.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
