import { FiCheckCircle, FiClock, FiPlayCircle, FiXCircle, FiLock, FiCheckSquare, FiArchive, FiFileText, FiStar } from 'react-icons/fi';

const STYLES = {
  active: 'bg-primary-600/15 text-primary-300 border-primary-600/30',
  completed: 'bg-[#22C55E]/10 text-[#4ADE80] border-[#22C55E]/30',
  revoked: 'bg-[#EF4444]/10 text-[#F87171] border-[#EF4444]/30',
  pending: 'bg-[#F59E0B]/10 text-[#FBBF24] border-[#F59E0B]/30',
  expired: 'bg-surface text-ink-muted border-edge',
  published: 'bg-[#22C55E]/10 text-[#4ADE80] border-[#22C55E]/30',
  draft: 'bg-surface text-ink-soft border-edge',
  archived: 'bg-surface text-ink-muted border-edge',
  text: 'bg-primary-600/15 text-primary-300 border-primary-600/30',
  video: 'bg-primary-500/15 text-primary-400 border-primary-500/30',
  level: 'bg-surface text-ink-soft border-edge',
};

const ICONS = {
  active: FiPlayCircle,
  completed: FiCheckCircle,
  revoked: FiXCircle,
  pending: FiClock,
  expired: FiLock,
  published: FiCheckSquare,
  draft: FiFileText,
  archived: FiArchive,
  text: FiFileText,
  video: FiPlayCircle,
};

/** Status badge — ikon + teks, tidak color-only (docs/DESIGNV2.md §23). */
export default function Badge({ value, kind, className = '' }) {
  const style = STYLES[kind || value] || STYLES.level;
  const Icon = ICONS[kind === 'level' ? 'level' : value] || FiStar;
  const label = typeof value === 'string' ? value.charAt(0).toUpperCase() + value.slice(1) : value;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${style} ${className}`}>
      <Icon className="text-[13px]" aria-hidden="true" />
      {label}
    </span>
  );
}
