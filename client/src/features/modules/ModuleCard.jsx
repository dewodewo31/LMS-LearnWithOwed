import { Link } from 'react-router-dom';
import { FiBookOpen, FiStar } from 'react-icons/fi';

const LEVEL_MAP = {
  beginner: { label: 'Pemula', color: 'text-emerald-400' },
  intermediate: { label: 'Menengah', color: 'text-amber-400' },
  advanced: { label: 'Lanjut', color: 'text-rose-400' },
};

export default function ModuleCard({ course, index = 0 }) {
  const level = LEVEL_MAP[course.level] || LEVEL_MAP.beginner;

  return (
    <Link
      to={`/modules/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-lp-border bg-lp-card transition-colors hover:border-lp-border-hover"
    >
      {/* Thumbnail area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-lp-bg-soft">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FiBookOpen className="text-4xl text-lp-border" aria-hidden="true" />
          </div>
        )}
        {course.isFeatured && (
          <span className="absolute top-3 right-3 inline-flex items-center gap-1 rounded-full bg-amber-500/90 px-2.5 py-1 font-lp-mono text-[9px] font-bold uppercase tracking-wider text-amber-950">
            <FiStar aria-hidden="true" className="fill-current" />
            Featured
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-5">
        {/* Category + Level */}
        <div className="flex items-center gap-2 text-[11px]">
          <span className="font-lp-mono font-medium uppercase tracking-[0.15em] text-lp-accent">
            {course.category || `Modul ${index + 1}`}
          </span>
          <span className="text-lp-border">·</span>
          <span className={`font-lp-mono font-medium uppercase tracking-wider ${level.color}`}>
            {level.label}
          </span>
        </div>

        {/* Title */}
        <h3 className="mt-2.5 line-clamp-2 font-lp-sans text-base font-bold leading-snug text-lp-text">
          {course.title}
        </h3>

        {/* Tentang Modul */}
        {course.shortDescription && (
          <div className="mt-3">
            <p className="font-lp-mono text-[10px] font-medium uppercase tracking-[0.12em] text-lp-muted">
              Tentang Modul
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-lp-muted">
              {course.shortDescription}
            </p>
          </div>
        )}

        {/* Poin Pembelajaran */}
        {course.learningObjectives?.length > 0 && (
          <div className="mt-3">
            <p className="font-lp-mono text-[10px] font-medium uppercase tracking-[0.12em] text-lp-muted">
              Poin Pembelajaran
            </p>
            <ul className="mt-1.5 space-y-1">
              {course.learningObjectives.slice(0, 3).map((obj, i) => (
                <li key={i} className="flex items-start gap-2 text-[12px] leading-snug text-lp-muted">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-lp-accent" />
                  <span className="line-clamp-1">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-lp-border pt-4">
          <span className="font-lp-mono text-[10px] uppercase tracking-wider text-lp-muted">
            {course.totalLessons || 0} lesson
          </span>
          <span className="font-lp-sans text-xs font-semibold text-lp-text transition-colors group-hover:text-lp-accent">
            Lihat Detail
          </span>
        </div>
      </div>
    </Link>
  );
}
