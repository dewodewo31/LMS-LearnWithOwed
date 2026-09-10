export default function Progress({ percent = 0, label, className = '' }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  return (
    <div className={className}>
      {label && (
        <div className="mb-1 flex items-center justify-between text-xs text-ink-muted">
          <span>{label}</span>
          <span className="font-semibold text-ink">{p}%</span>
        </div>
      )}
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-surface-hover"
        role="progressbar"
        aria-valuenow={p}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || 'Progress'}
      >
        <div className="h-full rounded-full bg-primary-500 transition-[width] duration-200" style={{ width: `${p}%` }} />
      </div>
    </div>
  );
}
