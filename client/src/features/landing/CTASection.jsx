import { Link } from 'react-router-dom';
import { FiArrowRight } from 'react-icons/fi';

export default function CTASection() {
  return (
    <section className="bg-lp-bg-soft px-4 py-[140px] sm:px-6 max-[767px]:py-[90px]">
      <div className="lp-container">
        <div
          className="relative overflow-hidden rounded-[30px] border border-lp-border bg-lp-card px-8 py-20 text-center sm:px-16 sm:py-24 lp-reveal"
          style={{
            background: 'radial-gradient(circle at 80% 50%, rgba(124,58,237,0.12), transparent 60%), #11131a',
          }}
        >
          {/* Decorative text */}
          <p className="absolute top-8 right-8 font-lp-mono text-[10px] uppercase tracking-[0.3em] text-lp-border-hover max-[767px]:hidden">
            LET&apos;S BUILD TOGETHER
          </p>

          <h2 className="font-lp-sans text-[clamp(36px,6vw,80px)] font-extrabold leading-[0.95] tracking-[-0.07em] text-lp-text">
            Siap Memulai
            <br />
            Perjalanan
            <br />
            <span className="text-lp-accent">Belajarmu?</span>
          </h2>

          <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-lp-muted">
            Bergabung dengan LearnWithOwed dan mulai belajar programming
            dari nol hingga mahir. Gratis untuk memulai!
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex h-[48px] items-center justify-center gap-3 rounded-full bg-lp-text px-8 text-sm font-semibold text-lp-bg transition-all hover:bg-lp-accent hover:-translate-y-[3px]"
            >
              Daftar Sekarang
              <FiArrowRight className="text-base" aria-hidden="true" />
            </Link>
            <Link
              to="/login"
              className="inline-flex h-[48px] items-center justify-center gap-3 rounded-full border border-lp-border px-8 text-sm font-semibold text-lp-text transition-all hover:bg-lp-accent-soft hover:border-lp-border-hover hover:-translate-y-[3px]"
            >
              Sudah Punya Akun? Masuk
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
