import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { useState, useEffect, useRef } from 'react';
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
  const cursorRef = useRef(null);

  /* Scroll state + progress */
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(docH > 0 ? (window.scrollY / docH) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /* Cursor glow — desktop only */
  useEffect(() => {
    const mql = window.matchMedia('(pointer: fine)');
    if (!mql.matches) return;
    const el = cursorRef.current;
    if (!el) return;
    let raf;
    const move = (e) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.left = e.clientX + 'px';
        el.style.top = e.clientY + 'px';
        el.classList.add('active');
      });
    };
    const leave = () => el.classList.remove('active');
    window.addEventListener('mousemove', move, { passive: true });
    window.addEventListener('mouseleave', leave);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseleave', leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Scroll reveal — IntersectionObserver (delayed to ensure children are mounted) */
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
      {/* Scroll progress */}
      <div className="lp-progress" style={{ width: `${progress}%` }} />

      {/* Cursor glow */}
      <div ref={cursorRef} className="lp-cursor-glow hidden lg:block" />

      {/* Navbar */}
      <nav className={`lp-nav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lp-container flex h-[82px] items-center justify-between max-[767px]:h-[70px]">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 font-lp-mono text-lg tracking-tight">
            <span className="text-lp-accent">&lt;</span>
            <span className="font-semibold text-lp-text">LWO</span>
            <span className="text-lp-accent">/&gt;</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 md:flex">
            <a href="#modul" className="text-sm text-lp-muted transition-colors hover:text-lp-text">Modul</a>
            <a href="#fitur" className="text-sm text-lp-muted transition-colors hover:text-lp-text">Fitur</a>
            <a href="#cara-kerja" className="text-sm text-lp-muted transition-colors hover:text-lp-text">Cara Kerja</a>
            <Link to="/leaderboard" className="text-sm text-lp-muted transition-colors hover:text-lp-text">Leaderboard</Link>
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="inline-flex h-[40px] items-center justify-center rounded-full px-5 text-sm font-semibold text-lp-text transition-all hover:bg-lp-accent-soft"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                className="inline-flex h-[40px] items-center justify-center rounded-full bg-lp-text px-5 text-sm font-semibold text-lp-bg transition-all hover:bg-lp-accent hover:-translate-y-0.5"
              >
                Daftar
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-lg p-2 text-lp-muted hover:bg-lp-accent-soft md:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX className="text-xl" /> : <FiMenu className="text-xl" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t border-lp-border bg-lp-bg/95 px-6 py-6 backdrop-blur-xl md:hidden">
            <div className="flex flex-col gap-4">
              <a href="#modul" className="text-sm text-lp-muted hover:text-lp-text" onClick={() => setMobileMenuOpen(false)}>Modul</a>
              <a href="#fitur" className="text-sm text-lp-muted hover:text-lp-text" onClick={() => setMobileMenuOpen(false)}>Fitur</a>
              <a href="#cara-kerja" className="text-sm text-lp-muted hover:text-lp-text" onClick={() => setMobileMenuOpen(false)}>Cara Kerja</a>
              <Link to="/leaderboard" className="text-sm text-lp-muted hover:text-lp-text" onClick={() => setMobileMenuOpen(false)}>Leaderboard</Link>
              <hr className="border-lp-border" />
              <Link to="/login" className="text-sm font-semibold text-lp-text" onClick={() => setMobileMenuOpen(false)}>Masuk</Link>
              <Link
                to="/register"
                className="rounded-full bg-lp-text px-5 py-2.5 text-center text-sm font-semibold text-lp-bg"
                onClick={() => setMobileMenuOpen(false)}
              >
                Daftar
              </Link>
            </div>
          </div>
        )}
      </nav>

      {/* Main content */}
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
