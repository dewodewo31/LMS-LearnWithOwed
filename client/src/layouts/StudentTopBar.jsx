import { Link } from 'react-router-dom';
import { FiArrowLeft, FiChevronRight } from 'react-icons/fi';

/**
 * Shared student page top bar: back navigation + semantic breadcrumb.
 * Rendered inside the page container (max-w-[1280px]) so it always aligns
 * horizontally with page content. Global :focus-visible handles focus rings.
 * Docs: docs/UI-UX.md — Student Page Layout System.
 */
export default function StudentTopBar({ backTo, items }) {
  return (
    <div className="mb-6 flex min-w-0 items-center gap-1.5 lg:mb-8">
      {backTo && (
        <Link
          to={backTo}
          aria-label="Kembali"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink-soft transition-colors hover:bg-surface-hover hover:text-ink"
        >
          <FiArrowLeft className="text-lg" aria-hidden="true" />
        </Link>
      )}
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1">
          {items.map((item, i) => {
            const isLast = i === items.length - 1;
            return (
              <li
                key={`${i}-${item.label}`}
                className={`flex min-w-0 items-center gap-1 ${item.hideOnMobile ? 'hidden sm:flex' : ''}`}
              >
                {i > 0 && <FiChevronRight className="shrink-0 text-ink-muted" aria-hidden="true" />}
                {isLast || !item.to ? (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className="min-w-0 truncate text-sm font-semibold text-ink"
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.to}
                    className="min-w-0 truncate text-sm text-ink-muted transition-colors hover:text-ink-soft"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
