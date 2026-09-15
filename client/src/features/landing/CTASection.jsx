import { Link } from 'react-router-dom';

export default function CTASection() {
  return (
    <section className="bg-lp-bg-soft px-4 py-[120px] sm:px-6 max-[767px]:py-[80px]">
      <div className="lp-container">
        <div className="rounded-2xl border border-lp-border bg-lp-card px-8 py-16 text-center sm:px-16 sm:py-20 lp-reveal">
          <h2 className="font-lp-sans text-[clamp(28px,5vw,56px)] font-extrabold leading-[0.95] tracking-[-0.05em] text-lp-text">
            Siap Memulai
            <br />
            <span className="text-lp-accent">Perjalanan Belajarmu?</span>
          </h2>

          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-lp-muted">
            Bergabung dengan LearnWithOwed dan mulai belajar programming
            dari nol hingga mahir. Gratis untuk memulai.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/register"
              className="inline-flex h-[48px] items-center justify-center rounded-lg bg-lp-text px-8 text-sm font-semibold text-lp-bg transition-colors hover:bg-lp-accent"
            >
              Daftar Sekarang
            </Link>
            <Link
              to="/login"
              className="inline-flex h-[48px] items-center justify-center rounded-lg border border-lp-border px-8 text-sm font-semibold text-lp-text transition-colors hover:bg-lp-accent-soft"
            >
              Sudah Punya Akun? Masuk
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
