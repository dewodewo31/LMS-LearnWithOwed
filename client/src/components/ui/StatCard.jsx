export default function StatCard({ icon: Icon, label, value, accent = false }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-edge bg-surface px-5 py-4">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${accent ? 'bg-primary-500/15 text-primary-400' : 'bg-primary-600/15 text-primary-300'}`}>
        <Icon className="text-lg" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-ink-muted">{label}</p>
        <p className="text-xl font-bold text-ink">{value}</p>
      </div>
    </div>
  );
}
