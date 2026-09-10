export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-lg bg-surface ${className}`} aria-hidden="true" />;
}

export function SkeletonLines({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-label="Memuat">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

export function Spinner({ className = 'text-primary-500' }) {
  return (
    <div role="status" aria-label="Memuat" className={`inline-block h-6 w-6 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`} />
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-edge px-6 py-14 text-center">
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface text-primary-500">
          <Icon className="text-xl" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-bold text-ink">{title}</h3>
      {body && <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message = 'Gagal memuat data.', onRetry }) {
  return (
    <div role="alert" className="rounded-xl border border-[#EF4444]/25 bg-[#EF4444]/10 px-5 py-4">
      <p className="text-sm font-medium text-[#F87171]">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="mt-2 text-sm font-semibold text-[#F87171] underline underline-offset-2 hover:text-white">
          Coba lagi
        </button>
      )}
    </div>
  );
}
