import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../features/auth/AuthContext';
import { Spinner } from '../components/ui/States';

export function RequireAuth({ roles }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/" state={{ from: location.pathname }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={user.role === 'student' ? '/student' : '/dashboard'} replace />;
  return <Outlet />;
}

export function HomeRedirect() {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-navy">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/" replace />;
  return <Navigate to={user.role === 'student' ? '/student' : '/dashboard'} replace />;
}
