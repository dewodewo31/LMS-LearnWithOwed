import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({ meta, onPage }) {
  if (!meta || meta.totalPages <= 1) return null;
  const { page, totalPages } = meta;
  return (
    <nav className="flex items-center justify-between pt-4" aria-label="Paginasi">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-ink-muted"
      >
        <FiChevronLeft aria-hidden="true" /> Sebelumnya
      </button>
      <span className="text-xs text-ink-muted">
        Halaman {page} dari {totalPages}
      </span>
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-sm font-medium text-ink-soft hover:bg-surface-hover disabled:cursor-not-allowed disabled:text-ink-muted"
      >
        Berikutnya <FiChevronRight aria-hidden="true" />
      </button>
    </nav>
  );
}
