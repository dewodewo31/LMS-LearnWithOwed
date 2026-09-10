import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiBell, FiBookOpen, FiGrid, FiHome, FiLogOut, FiMenu, FiUser, FiUserCheck, FiUsers, FiX } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import Avatar from '../components/ui/Avatar';
import NotificationBell from '../features/notifications/NotificationBell';

const NAV = {
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/dashboard/courses', label: 'Kursus', icon: FiBookOpen },
    { to: '/dashboard/students', label: 'Siswa', icon: FiUsers },
    { to: '/dashboard/enrollments', label: 'Enrollmen', icon: FiUserCheck },
    { to: '/profile', label: 'Profil', icon: FiUser },
  ],
  mentor: [
    { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/dashboard/courses', label: 'Kursus', icon: FiBookOpen },
    { to: '/dashboard/students', label: 'Siswa', icon: FiUsers },
    { to: '/profile', label: 'Profil', icon: FiUser },
  ],
  student: [
    { to: '/student', label: 'Beranda', icon: FiHome },
    { to: '/student/courses', label: 'Kursus', icon: FiBookOpen },
    { to: '/notifications', label: 'Notifikasi', icon: FiBell },
    { to: '/profile', label: 'Profil', icon: FiUser },
  ],
};

const BOTTOM_NAV = {
  student: [
    { to: '/student', label: 'Beranda', icon: FiHome },
    { to: '/student/courses', label: 'Kursus', icon: FiBookOpen },
    { to: '/notifications', label: 'Notifikasi', icon: FiBell },
    { to: '/profile', label: 'Profil', icon: FiUser },
  ],
  admin: [
    { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/dashboard/courses', label: 'Kursus', icon: FiBookOpen },
    { to: '/dashboard/enrollments', label: 'Enrollmen', icon: FiUserCheck },
    { to: '/profile', label: 'Profil', icon: FiUser },
  ],
  mentor: [
    { to: '/dashboard', label: 'Dashboard', icon: FiGrid },
    { to: '/dashboard/courses', label: 'Kursus', icon: FiBookOpen },
    { to: '/dashboard/students', label: 'Siswa', icon: FiUsers },
    { to: '/profile', label: 'Profil', icon: FiUser },
  ],
};

function Sidebar({ items, user, onClose, onLogout }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-edge bg-navy">
      {/* Brand */}
      <div className="flex items-center justify-between border-b border-edge px-5 py-4">
        <button onClick={() => items[0] && (window.location.href = items[0].to)} className="text-left" aria-label="Beranda">
          <p className="text-sm font-extrabold leading-tight text-ink">LearnWithOweed</p>
          <p className="text-[11px] font-medium uppercase tracking-widest text-primary-400">Learning Platform</p>
        </button>
        {onClose && (
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-hover lg:hidden" aria-label="Tutup menu">
            <FiX className="text-lg" />
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Navigasi sidebar">
        <ul className="space-y-1">
          {items.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={to === '/dashboard' || to === '/student'}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-600/15 text-primary-400'
                      : 'text-ink-muted hover:bg-surface-hover hover:text-ink-soft'
                  }`
                }
              >
                <Icon className="text-lg shrink-0" aria-hidden="true" />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* User info + logout */}
      <div className="border-t border-edge px-4 py-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.photo} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink">{user.name}</p>
            <p className="truncate text-xs text-ink-muted capitalize">{user.role}</p>
          </div>
          <button
            onClick={onLogout}
            className="shrink-0 rounded-lg p-2 text-ink-muted hover:bg-[#EF4444]/10 hover:text-[#F87171]"
            aria-label="Logout"
          >
            <FiLogOut className="text-lg" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const items = NAV[user.role] || NAV.student;
  const bottomItems = BOTTOM_NAV[user.role] || BOTTOM_NAV.student;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-navy">
      {/* Desktop sidebar — visible lg+ */}
      <div className="hidden lg:block">
        <Sidebar items={items} user={user} onLogout={handleLogout} />
      </div>

      {/* Mobile sidebar overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileMenuOpen(false)} />
          <Sidebar items={items} user={user} onClose={() => setMobileMenuOpen(false)} onLogout={handleLogout} />
        </div>
      )}

      {/* Main content area */}
      <div className="lg:ml-60">
        {/* Top header */}
        <header className="sticky top-0.5 z-40 flex items-center justify-between border-b border-edge bg-navy/90 px-4 py-3 backdrop-blur sm:px-6 lg:px-8">
          {/* Mobile: hamburger + brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="rounded-lg p-2 text-ink-muted hover:bg-surface-hover"
              aria-label="Buka menu"
            >
              <FiMenu className="text-lg" />
            </button>
            <button onClick={() => navigate(items[0].to)} className="text-left" aria-label="Beranda">
              <p className="text-sm font-extrabold leading-tight text-ink">LearnWithOweed</p>
              <p className="text-[11px] font-medium uppercase tracking-widest text-primary-400">Learning Platform</p>
            </button>
          </div>

          {/* Desktop: page context area (empty — pages handle their own headers) */}
          <div className="hidden lg:block" />

          {/* Right side: notification + avatar */}
          <div className="flex items-center gap-2">
            <NotificationBell />
            <button
              onClick={() => navigate('/profile')}
              className="rounded-full p-1 hover:bg-surface-hover"
              aria-label="Profil saya"
            >
              <Avatar name={user.name} src={user.photo} size="sm" />
            </button>
          </div>
        </header>

        {/* Page content — pb-28 clears the floating mobile bottom nav (lg+ has none) */}
        <main className="px-4 pb-28 pt-6 sm:px-6 lg:px-8 lg:pb-8 lg:pt-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom navigation — hidden lg+ */}
      <nav
        aria-label="Navigasi utama"
        className="fixed inset-x-0 bottom-4 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-1 rounded-full border border-edge bg-surface/95 px-2 py-1.5 shadow-lg backdrop-blur lg:hidden"
      >
        {bottomItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/dashboard' || to === '/student'}
            className={({ isActive }) =>
              `flex min-h-[44px] min-w-[44px] items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors ${
                isActive ? 'bg-primary-600 text-white' : 'text-ink-muted hover:bg-surface-hover hover:text-ink-soft'
              }`
            }
          >
            <Icon className="text-lg" aria-hidden="true" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
