import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useState, useEffect } from 'react';
import HeroSection from './HeroSection';
import ModulesSection from './ModulesSection';
import FeaturesSection from './FeaturesSection';
import HowItWorksSection from './HowItWorksSection';
import CTASection from './CTASection';
import Footer from './Footer';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docH > 0 ? (window.scrollY / docH) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    let obs;
    const timer = requestAnimationFrame(() => {
      const els = document.querySelectorAll('.lp-reveal');
      if (!els.length) return;
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.classList.add('visible');
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.12 }
      );
      els.forEach((el) => obs.observe(el));
    });
    return () => {
      cancelAnimationFrame(timer);
      if (obs) obs.disconnect();
    };
  }, []);

  return (
    <div className="lp-root min-h-screen bg-lp-bg font-lp-sans text-lp-text">
      <div className="lp-progress" style={{ width: `${progress}%` }} />

      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-container flex h-[82px] items-center justify-between max-[767px]:h-[70px]">
          <Link to="/" className="flex items-center gap-1 font-lp-mono text-lg tracking-tight">
            <span className="text-lp-accent">&lt;</span>
            <span className="font-semibold text-lp-text">LWO</span>
            <span className="text-lp-accent">/&gt;</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#modul" className="text-sm text-lp-muted transition-colors hover:text-lp-text">Modul</a>
            <a href="#fitur" className="text-sm text-lp-muted transition-colors hover:text-lp-text">Fitur</a>
            <a href="#cara-kerja" className="text-sm text-lp-muted transition-colors hover:text-lp-text">Cara Kerja</a>
            <Link to="/leaderboard" className="text-sm text-lp-muted transition-colors hover:text-lp-text">Leaderboard</Link>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="inline-flex h-[40px] items-center justify-center rounded-lg px-5 text-sm font-semibold text-lp-text transition-colors hover:bg-lp-accent-soft"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="inline-flex h-[40px] items-center justify-center rounded-lg bg-lp-text px-5 text-sm font-semibold text-lp-bg transition-colors hover:bg-lp-accent"
              >
                Daftar
              </Link>
            </div>
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-lp-muted hover:bg-lp-accent-soft md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-lp-border bg-lp-bg px-6 py-6 md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#modul" className="text-sm text-lp-muted hover:text-lp-text" onClick={() => setMobileMenuOpen(false)}>Modul</a>
              <a href="#fitur" className="text-sm text-lp-muted hover:text-lp-text" onClick={() => setMobileMenuOpen(false)}>Fitur</a>
              <a href="#cara-kerja" className="text-sm text-lp-muted hover:text-lp-text" onClick={() => setMobileMenuOpen(false)}>Cara Kerja</a>
              <Link to="/leaderboard" className="text-sm text-lp-muted hover:text-lp-text" onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
              <hr className="border-lp-border" />
              <Link to="/login" className="text-sm font-semibold text-lp-text" onClick={() => setMobileMenuOpen(false)}>Masuk</Link>
              <Link
                to="/register"
                className="rounded-lg bg-lp-text px-5 py-2.5 text-center text-sm font-semibold text-lp-bg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Daftar
              </Link>
            </div>
          </div>
        )}
      </nav>

      <main>
        <HeroSection />
        <ModulesSection />
        <FeaturesSection />
        <HowItWorksSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
