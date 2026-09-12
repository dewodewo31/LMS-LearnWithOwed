import { Link } from 'react-router-dom';
import { FiArrowRight, FiLayers, FiCode, FiDatabase, FiServer } from 'react-icons/fi';
import { useHomeModules } from '../modules/hooks';

export default function HeroSection() {
  const { data } = useHomeModules();
  const stats = data?.stats;
  return (
    <section className="relative overflow-hidden px-4 pt-32 pb-20 sm:px-6 sm:pt-40 sm:pb-28 lg:px-8 lg:pt-44 lg:pb-36">
      {/* Background glow */}
      <div className="lp-hero-glow absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />

      <div className="lp-container relative z-[2]">
        <div className="grid items-center gap-[70px] lg:grid-cols-[1.05fr_.95fr]">
          {/* Left — Content */}
          <div className="max-w-2xl">
            {/* Eyebrow */}
            <p className="mb-5 font-lp-mono text-[11px] font-medium uppercase tracking-[0.2em] text-lp-accent">
              Learning Management System
            </p>

            {/* Headline */}
            <h1 className="font-lp-sans text-[clamp(48px,8vw,120px)] font-extrabold leading-[0.9] tracking-[-0.075em] text-lp-text max-[767px]:text-center">
              Belajar
              <br />
              Programming
              <br />
              <span className="text-lp-accent">dengan Terstruktur</span>
            </h1>

            {/* Subheadline */}
            <p className="mt-7 max-w-xl text-[clamp(16px,2vw,20px)] font-medium leading-relaxed tracking-[-0.02em] text-lp-muted max-[767px]:mx-auto max-[767px]:text-center">
              Platform LMS untuk pembelajaran coding yang terstruktur, terarah, dan menyenangkan.
              Belajar dari nol hingga mahir bersama mentor berpengalaman.
            </p>

            {/* Buttons */}
            <div className="mt-10 flex items-center gap-3 max-[767px]:flex-col max-[767px]:items-stretch">
              <Link
                to="/register"
                className="inline-flex h-[48px] items-center justify-center gap-3 rounded-full bg-lp-text px-7 text-sm font-semibold text-lp-bg transition-all hover:bg-lp-accent hover:-translate-y-[3px]"
              >
                Mulai Belajar
                <FiArrowRight className="text-base" aria-hidden="true" />
              </Link>
              <a
                href="#modul"
                className="inline-flex h-[48px] items-center justify-center gap-3 rounded-full border border-lp-border px-7 text-sm font-semibold text-lp-text transition-all hover:bg-lp-accent-soft hover:border-lp-border-hover hover:-translate-y-[3px]"
              >
                <FiLayers className="text-base" aria-hidden="true" />
                Jelajahi Modul
              </a>
            </div>

            {/* Real platform stats — exact totals from the public API, only when published modules exist */}
            {stats && stats.totalCourses > 0 && (
              <div className="mt-14 grid grid-cols-3 gap-6 border-t border-lp-border pt-8 sm:gap-8">
                <div className="max-[767px]:text-center">
                  <p className="font-lp-sans text-2xl font-extrabold tracking-tight text-lp-text sm:text-4xl">{stats.totalCourses}</p>
                  <p className="mt-1 font-lp-mono text-[11px] uppercase tracking-widest text-lp-muted">Modul Pembelajaran</p>
                </div>
                <div className="max-[767px]:text-center">
                  <p className="font-lp-sans text-2xl font-extrabold tracking-tight text-lp-text sm:text-4xl">{stats.totalLessons}</p>
                  <p className="mt-1 font-lp-mono text-[11px] uppercase tracking-widest text-lp-muted">Total Lesson</p>
                </div>
                <div className="max-[767px]:text-center">
                  <p className="font-lp-sans text-2xl font-extrabold tracking-tight text-lp-text sm:text-4xl">{stats.categories}</p>
                  <p className="mt-1 font-lp-mono text-[11px] uppercase tracking-widest text-lp-muted">Kategori</p>
                </div>
              </div>
            )}
          </div>

          {/* Right — Visual */}
          <div className="relative hidden lg:block">
            {/* Main card */}
            <div className="relative rounded-2xl border border-lp-border bg-lp-card/90 p-6 shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-xl">
              {/* Terminal header */}
              <div className="mb-4 flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
                <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                <span className="ml-3 font-lp-mono text-[11px] text-lp-muted">terminal</span>
              </div>
              {/* Code lines */}
              <div className="space-y-2 font-lp-mono text-[13px] leading-relaxed">
                <p><span className="text-lp-accent">$</span> <span className="text-lp-text">npm create learnwithowed@latest</span></p>
                <p className="text-lp-muted">✓ Project initialized</p>
                <p><span className="text-lp-accent">$</span> <span className="text-lp-text">cd learnwithowed && npm run dev</span></p>
                <p className="text-lp-green">✓ Ready on http://localhost:5173</p>
              </div>
            </div>

            {/* Floating card — Tech stack */}
            <div className="absolute -top-4 -right-4 rounded-xl border border-lp-border bg-lp-card/90 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <FiCode className="text-lp-accent" />
                <span className="font-lp-mono text-[11px] text-lp-muted-light">React + Vite</span>
              </div>
            </div>

            {/* Floating card — Database */}
            <div className="absolute -bottom-3 -left-4 rounded-xl border border-lp-border bg-lp-card/90 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <FiDatabase className="text-lp-green" />
                <span className="font-lp-mono text-[11px] text-lp-muted-light">MongoDB</span>
              </div>
            </div>

            {/* Floating card — API */}
            <div className="absolute top-1/2 -right-8 rounded-xl border border-lp-border bg-lp-card/90 px-4 py-3 shadow-[0_12px_32px_rgba(0,0,0,0.4)] backdrop-blur-xl max-[1100px]:hidden">
              <div className="flex items-center gap-2">
                <FiServer className="text-[#f59e0b]" />
                <span className="font-lp-mono text-[11px] text-lp-muted-light">Express API</span>
              </div>
            </div>

            {/* Status badge */}
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2">
              <div className="inline-flex items-center gap-2 rounded-full border border-lp-border bg-lp-card/90 px-4 py-2 shadow-lg backdrop-blur-xl">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lp-green opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-lp-green" />
                </span>
                <span className="font-lp-mono text-[11px] font-medium uppercase tracking-wider text-lp-green">Platform Aktif</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
