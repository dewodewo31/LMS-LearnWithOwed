import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen } from 'react-icons/fi';
import { useLessonsLeaderboard, useModulesLeaderboard } from './hooks';

const TABS = [
  { key: 'lessons', label: 'Most Lessons Learned' },
  { key: 'modules', label: 'Most Modules Enrolled' },
];

function PodiumAvatar({ student, rank }) {
  const size = rank === 1 ? 'h-20 w-20 text-2xl' : 'h-16 w-16 text-lg';
  const ring = rank === 1 ? 'ring-2 ring-amber-400/60' : 'ring-1 ring-lp-border';
  if (student.avatar) {
    return <img src={student.avatar} alt={student.displayName} className={`${size} rounded-full object-cover ${ring}`} />;
  }
  return (
    <div className={`${size} flex items-center justify-center rounded-full bg-primary-600 font-display font-bold text-white ${ring}`} aria-hidden="true">
      {student.displayName?.charAt(0)?.toUpperCase() || '?'}
    </div>
  );
}

function Podium({ entries, tab }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  const order = top3.length === 3 ? [1, 0, 2] : top3.length === 2 ? [0, 1] : [0];
  const unit = tab === 'lessons' ? 'Lessons' : 'Modules';

  return (
    <div className="flex items-end justify-center gap-4 sm:gap-6 md:gap-8" role="list" aria-label="Top 3">
      {order.map((idx) => {
        const entry = top3[idx];
        if (!entry) return null;
        const rank = entry.rank;
        const heights = { 1: 'pb-0', 2: 'pb-4', 3: 'pb-2' };
        return (
          <div key={entry.student.id} className={`flex flex-col items-center ${heights[rank]}`} role="listitem">
            <PodiumAvatar student={entry.student} rank={rank} />
            <p className="mt-3 max-w-[120px] truncate font-lp-sans text-sm font-bold text-lp-text sm:max-w-[160px]">
              {entry.student.displayName}
            </p>
            <p className="mt-0.5 font-lp-mono text-xs text-lp-muted">
              {entry.value} {entry.value === 1 ? unit.replace(/s$/, '') : unit}
            </p>
            <div className={`mt-2 font-lp-mono text-[11px] font-bold uppercase tracking-widest ${rank === 1 ? 'text-amber-400' : 'text-lp-muted-light'}`}>
              #{rank}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardRow({ entry, tab }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-lp-border bg-lp-card px-5 py-4 transition-colors hover:bg-lp-card-hover">
      <span className="w-8 text-center font-lp-mono text-sm font-bold text-lp-muted-light">#{entry.rank}</span>
      {entry.student.avatar ? (
        <img src={entry.student.avatar} alt={entry.student.displayName} className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 font-display text-sm font-bold text-white" aria-hidden="true">
          {entry.student.displayName?.charAt(0)?.toUpperCase() || '?'}
        </div>
      )}
      <span className="flex-1 truncate font-lp-sans text-sm font-semibold text-lp-text">{entry.student.displayName}</span>
      <span className="font-lp-mono text-sm font-bold text-lp-accent">
        {entry.value} {tab === 'lessons' ? (entry.value === 1 ? 'Lesson' : 'Lessons') : 'Modules'}
      </span>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-lp-border bg-lp-card px-5 py-4" aria-hidden="true">
      <div className="h-4 w-8 animate-pulse rounded bg-lp-card-hover" />
      <div className="h-10 w-10 animate-pulse rounded-full bg-lp-card-hover" />
      <div className="h-4 flex-1 animate-pulse rounded bg-lp-card-hover" />
      <div className="h-4 w-20 animate-pulse rounded bg-lp-card-hover" />
    </div>
  );
}

function PodiumSkeleton() {
  return (
    <div className="flex items-end justify-center gap-6" aria-hidden="true">
      {[2, 1, 3].map((r) => (
        <div key={r} className="flex flex-col items-center">
          <div className={`animate-pulse rounded-full bg-lp-card-hover ${r === 1 ? 'h-20 w-20' : 'h-16 w-16'}`} />
          <div className="mt-3 h-4 w-24 animate-pulse rounded bg-lp-card-hover" />
          <div className="mt-1 h-3 w-16 animate-pulse rounded bg-lp-card-hover" />
        </div>
      ))}
    </div>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState('lessons');
  const lessonsQuery = useLessonsLeaderboard(10);
  const modulesQuery = useModulesLeaderboard(10);

  const active = tab === 'lessons' ? lessonsQuery : modulesQuery;
  const entries = active.data ?? [];
  const loading = active.isLoading;
  const error = active.error;

  return (
    <div className="min-h-screen bg-lp-bg-soft">
      <header className="border-b border-lp-border bg-lp-bg/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-lp-muted transition-colors hover:text-lp-text"
          >
            <FiArrowLeft aria-hidden="true" />
            Kembali
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
        <header className="mb-10 text-center">
          <p className="mb-3 font-lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-lp-accent">
            Leaderboard
          </p>
          <h1 className="font-lp-sans text-[clamp(28px,5vw,44px)] font-bold tracking-[-0.05em] leading-tight text-lp-text">
            Papan Peringkat
          </h1>
          <p className="mt-4 text-base leading-relaxed text-lp-muted">
            Lihat para peserta yang membuat kemajuan terbanyak di platform.
          </p>
        </header>

        <div className="mb-8 flex justify-center" role="tablist" aria-label="Leaderboard kategori">
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                tab === t.key
                  ? 'bg-lp-text text-lp-bg'
                  : 'text-lp-muted hover:text-lp-text hover:bg-lp-accent-soft'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error ? (
          <div role="alert" className="mx-auto max-w-md rounded-2xl border border-[#EF4444]/25 bg-[#EF4444]/10 px-6 py-8 text-center">
            <p className="text-sm font-medium text-[#F87171]">Gagal memuat leaderboard.</p>
            <p className="mt-1 text-xs text-lp-muted">Silakan coba lagi.</p>
            <button
              onClick={() => active.refetch()}
              className="mt-4 inline-flex items-center gap-2 rounded-full border border-[#F87171]/40 px-5 py-2 text-xs font-bold text-[#F87171] transition-colors hover:bg-[#EF4444]/20"
            >
              Coba Lagi
            </button>
          </div>
        ) : loading ? (
          <div className="space-y-10">
            <PodiumSkeleton />
            <div className="space-y-3">
              {Array.from({ length: 7 }).map((_, i) => (
                <RowSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : entries.length === 0 ? (
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-lp-border px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-lp-accent-soft text-lp-accent">
              <FiBookOpen className="text-xl" aria-hidden="true" />
            </div>
            <h2 className="font-lp-sans text-lg font-bold text-lp-text">Belum ada data leaderboard</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-lp-muted">
              Mulai belajar untuk muncul di papan peringkat.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {entries.length >= 1 && (
              <section aria-label="Top 3">
                <Podium entries={entries} tab={tab} />
              </section>
            )}

            {entries.length > 3 && (
              <section className="space-y-3" aria-label="Peringkat lainnya">
                {entries.slice(3).map((entry) => (
                  <LeaderboardRow key={entry.student.id} entry={entry} tab={tab} />
                ))}
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
