export default function Footer() {
  return (
    <footer className="border-t border-lp-border bg-lp-bg px-4 py-10 sm:px-6">
      <div className="lp-container">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          {/* Logo */}
          <div className="font-lp-mono text-sm tracking-tight">
            <span className="text-lp-accent">&lt;</span>
            <span className="font-semibold text-lp-text">LWO</span>
            <span className="text-lp-accent">/&gt;</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 font-lp-mono text-[11px] uppercase tracking-widest text-lp-muted">
            <a href="#" className="transition-colors hover:text-lp-text">Kebijakan Privasi</a>
            <a href="#" className="transition-colors hover:text-lp-text">Syarat & Ketentuan</a>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-lp-border pt-8 text-center">
          <p className="font-lp-mono text-[10px] uppercase tracking-[0.2em] text-lp-muted">
            &copy; {new Date().getFullYear()} LearnWithOweed &mdash; Built with React / Tailwind / Vite
          </p>
        </div>
      </div>
    </footer>
  );
}
