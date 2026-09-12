import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function TopBar() {
  const { user } = useAuth();
  const panel = user ? (user.role === 'student' ? '/student' : '/dashboard') : '/login';
  return (
    <header className="sticky top-0 z-40 border-b border-lp-border bg-lp-bg/90 backdrop-blur">
      <div className="lp-container flex h-16 items-center justify-between">
        <Link to="/" className="font-lp-sans text-lg font-extrabold tracking-tight text-lp-text transition-colors hover:text-lp-accent">
          LearnWithOwed
        </Link>
        <Link
          to={panel}
          className="inline-flex items-center rounded-full border border-lp-border px-5 py-2 text-xs font-semibold text-lp-text transition-all hover:bg-lp-accent-soft hover:border-lp-border-hover"
        >
          {user ? 'Dashboard' : 'Masuk'}
        </Link>
      </div>
    </header>
  );
}
