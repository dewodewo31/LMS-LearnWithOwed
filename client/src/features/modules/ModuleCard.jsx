import { Link } from 'react-router-dom';
import { FiArrowRight, FiBookOpen, FiLayers, FiStar } from 'react-icons/fi';

const pad = (n) => String(n).padStart(2, '0');

export default function ModuleCard({ course, index = 0 }) {
  return (
    <Link
      to={`/modules/${course.slug}`}
      className="group flex flex-col overflow-hidden rounded-[20px] border border-lp-border bg-lp-card transition-all duration-300 hover:border-lp-border-hover hover:-translate-y-1.5"
    >
      <div className="relative aspect-video overflow-hidden">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-lp-accent-soft">
            <FiBookOpen className="text-3xl text-lp-accent" aria-hidden="true" />
            <span className="font-lp-mono text-[10px] uppercase tracking-[0.25em] text-lp-muted-light">
              {course.category || 'Modul Pembelajaran'}
            </span>
          </div>
        )}
        {course.isFeatured && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 px-3 py-1 font-lp-mono text-[10px] font-bold uppercase tracking-wider text-amber-950 shadow-[0_2px_12px_rgba(245,158,11,0.45)] ring-1 ring-yellow-300/50">
            <FiStar aria-hidden="true" className="fill-current text-[11px]" />
            FEATURED
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-6">
        <p className="font-lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-lp-accent">
          {course.category || `Modul ${pad(index + 1)}`}
        </p>
        <h3 className="mt-2 line-clamp-2 font-lp-sans text-lg font-bold leading-snug text-lp-text">
          {course.title}
        </h3>
        {course.shortDescription && (
          <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-lp-muted">{course.shortDescription}</p>
        )}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          {course.totalLessons > 0 ? (
            <span className="inline-flex items-center gap-1.5 font-lp-mono text-[11px] uppercase tracking-widest text-lp-muted-light">
              <FiLayers aria-hidden="true" />
              {course.totalLessons} {course.totalLessons === 1 ? 'Lesson' : 'Lessons'}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex items-center gap-2 rounded-full bg-lp-text px-5 py-2.5 text-xs font-bold text-lp-bg transition-colors group-hover:bg-lp-accent">
            Lihat Modul
            <FiArrowRight aria-hidden="true" />
          </span>
        </div>
      </div>
    </Link>
  );
}
