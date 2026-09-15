import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiBookOpen } from 'react-icons/fi';
import { useAuth } from '../auth/AuthContext';
import { useLessonsLeaderboard, useModulesLeaderboard } from './hooks';

const TABS = [
  { key: 'lessons', label: 'Most Lessons Learned' },
  { key: 'modules', label: 'Most Modules Enrolled' },
];

const RANK_STYLES = {
  1: { accent: '#ffb703', ring: 'ring-[#ffb703]/60', text: 'text-[#d4a843]' },
  2: { accent: '#00b4d8', ring: 'ring-[#00b4d8]/50', text: 'text-[#00b4d8]' },
  3: { accent: '#2ec4b6', ring: 'ring-[#2ec4b6]/50', text: 'text-[#2ec4b6]' },
};

function PodiumAvatar({ student, rank, size }) {
  const cfg = RANK_STYLES[rank];
  const initial = student.displayName?.charAt(0)?.toUpperCase() || '?';
  const sizeClass = size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-14 w-14 text-base';

  if (student.avatar) {
    return (
      <div className="relative">
        <img src={student.avatar} alt={student.displayName} className={`${sizeClass} rounded-full object-cover ring-4 ${cfg.ring}`} />
      </div>
    );
  }
  return (
    <div className={`${sizeClass} flex items-center justify-center rounded-full bg-lp-accent-soft font-lp-sans font-bold text-lp-accent ring-4 ${cfg.ring}`} aria-hidden="true">
      {initial}
    </div>
  );
}

function Podium({ entries, tab, currentUserId }) {
  const top3 = entries.slice(0, 3);
  if (top3.length === 0) return null;

  const order = top3.length === 3 ? [1, 0, 2] : top3.length === 2 ? [0, 1] : [0];
  const unit = tab === 'lessons' ? 'Lessons' : 'Modules';

  return (
    <div className="flex items-start justify-center gap-3 sm:gap-5" role="list" aria-label="Top 3">
      {order.map((idx) => {
        const entry = top3[idx];
        if (!entry) return null;
        const rank = entry.rank;
        const cfg = RANK_STYLES[rank];
        const isChampion = rank === 1;
        const isCurrentUser = entry.student.id === currentUserId;
        const topOffset = isChampion ? '' : 'mt-8';

        return (
          <div key={entry.student.id} className={`flex flex-col items-center ${topOffset}`} role="listitem">
            <PodiumAvatar student={entry.student} rank={rank} size={isChampion ? 'lg' : 'sm'} />
            <p className="mt-3 max-w-[100px] truncate text-center font-lp-sans text-xs font-bold text-lp-text sm:max-w-[120px] sm:text-sm">
              {entry.student.displayName}
            </p>
            <p className={`mt-1 font-lp-mono text-base font-extrabold ${cfg.text} sm:text-lg`}>
              {entry.value}
            </p>
            <p className="mt-0.5 font-lp-mono text-[10px] text-[#8a99ad]">
              {entry.value === 1 ? unit.replace(/s$/, '') : unit}
            </p>
            {isCurrentUser && (
              <span className="mt-2 rounded-full bg-lp-accent-soft px-2 py-0.5 font-lp-mono text-[9px] font-bold text-lp-accent">
                Kamu
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LeaderboardRow({ entry, tab, maxVal, currentUserId }) {
  const rank = entry.rank;
  const cfg = RANK_STYLES[rank];
  const rankColor = cfg ? cfg.text : 'text-lp-muted-light';
  const unit = tab === 'lessons' ? (entry.value === 1 ? 'Lesson' : 'Lessons') : 'Modules';
  const initial = entry.student.displayName?.charAt(0)?.toUpperCase() || '?';
  const isCurrentUser = entry.student.id === currentUserId;
  const progress = maxVal > 0 ? (entry.value / maxVal) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 border-b border-lp-border py-3 last:border-b-0 sm:gap-4 ${isCurrentUser ? 'bg-lp-accent-soft/30 -mx-4 px-4 sm:-mx-5 sm:px-5' : ''}`}>
      <span className={`w-7 text-center font-lp-mono text-sm font-bold ${rankColor}`}>
        #{rank}
      </span>

      {entry.student.avatar ? (
        <img src={entry.student.avatar} alt={entry.student.displayName} className="h-8 w-8 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lp-accent-soft font-lp-sans text-xs font-bold text-lp-accent" aria-hidden="true">
          {initial}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate font-lp-sans text-sm font-medium text-lp-text">
            {entry.student.displayName}
          </span>
          {isCurrentUser && (
            <span className="shrink-0 rounded-full bg-lp-accent-soft px-1.5 py-0.5 font-lp-mono text-[8px] font-bold text-lp-accent">
              Kamu
            </span>
          )}
        </div>
        <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-lp-border">
          <div className="h-full rounded-full bg-lp-accent/60" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <span className="shrink-0 text-right font-lp-mono text-xs text-lp-muted">
        {entry.value} {unit}
      </span>
    </div>
  );
}

function RowSkeleton() {
  return (
    <div className="flex items-center gap-3 border-b border-lp-border py-3 last:border-b-0 sm:gap-4" aria-hidden="true">
      <div className="h-4 w-7 animate-pulse rounded bg-lp-card-hover" />
      <div className="h-8 w-8 animate-pulse rounded-full bg-lp-card-hover" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-lp-card-hover" />
        <div className="h-1 w-full animate-pulse rounded-full bg-lp-card-hover" />
      </div>
      <div className="h-3 w-16 animate-pulse rounded bg-lp-card-hover" />
    </div>
  );
}

function PodiumSkeleton() {
  return (
    <div className="flex items-end justify-center gap-5" aria-hidden="true">
      {[2, 1, 3].map((r) => (
        <div key={r} className="flex flex-col items-center">
          <div className={`animate-pulse rounded-full bg-lp-card-hover ${r === 1 ? 'h-20 w-20' : 'h-14 w-14'}`} />
          <div className="mt-3 h-3 w-20 animate-pulse rounded bg-lp-card-hover" />
          <div className="mt-1 h-4 w-12 animate-pulse rounded bg-lp-card-hover" />
        </div>
      ))}
    </div>
  );
}

function StickyYourRank({ entry, tab }) {
  if (!entry) return null;
  const unit = tab === 'lessons' ? (entry.value === 1 ? 'Lesson' : 'Lessons') : 'Modules';

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-lp-border bg-lp-card/95 px-4 py-3 backdrop-blur-sm sm:px-6">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="font-lp-mono text-sm font-bold text-lp-accent">#{entry.rank}</span>
          <span className="font-lp-sans text-sm font-medium text-lp-text">{entry.student.displayName}</span>
        </div>
        <span className="font-lp-mono text-xs text-lp-muted">
          {entry.value} {unit}
        </span>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState('lessons');
  const lessonsQuery = useLessonsLeaderboard(20);
  const modulesQuery = useModulesLeaderboard(20);

  const active = tab === 'lessons' ? lessonsQuery : modulesQuery;
  const entries = active.data ?? [];
  const loading = active.isLoading;
  const error = active.error;

  const maxVal = entries.length > 0 ? Math.max(...entries.map((e) => e.value)) : 0;
  const visible = entries.slice(0, 10);
  const top3 = visible.slice(0, 3);
  const rest = visible.slice(3);
  const currentUserId = user?._id || user?.id;
  const myEntry = entries.find((e) => e.student.id === currentUserId);
  const isInTop5 = myEntry && myEntry.rank <= 5;

  return (
    <div className="min-h-screen bg-lp-bg-soft pb-20">
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

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 sm:py-16">
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
            <div className="rounded-xl border border-lp-border bg-lp-card px-4 sm:px-5">
              {Array.from({ length: 5 }).map((_, i) => (
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
          <div className="space-y-8">
            {top3.length > 0 && (
              <section aria-label="Top 3">
                <Podium entries={entries} tab={tab} currentUserId={currentUserId} />
              </section>
            )}

            {rest.length > 0 && (
              <section className="rounded-xl border border-lp-border bg-lp-card px-4 sm:px-5" aria-label="Peringkat lainnya">
                {rest.map((entry) => (
                  <LeaderboardRow
                    key={entry.student.id}
                    entry={entry}
                    tab={tab}
                    maxVal={maxVal}
                    currentUserId={currentUserId}
                  />
                ))}
              </section>
            )}
          </div>
        )}
      </main>

      {!loading && !isInTop5 && myEntry && (
        <StickyYourRank entry={myEntry} tab={tab} />
      )}
    </div>
  );
}
