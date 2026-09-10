import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FiBookOpen } from 'react-icons/fi';
import { useAuth } from './AuthContext';
import Button from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Form';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success('Selamat datang kembali!');
      const dest = user.role === 'student' ? '/student' : '/dashboard';
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-navy px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-white shadow-sm">
            <FiBookOpen className="text-2xl" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-extrabold text-ink">Masuk ke LMS</h1>
          <p className="text-sm text-ink-soft">Belajar dengan nyaman, setiap hari.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-edge bg-surface p-6" noValidate>
          {error && (
            <p role="alert" className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm font-medium text-[#F87171]">
              {error}
            </p>
          )}
          <Field label="Email" htmlFor="email">
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Password" htmlFor="password">
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Masuk
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          Belum punya akun?{' '}
          <Link to="/register" className="font-semibold text-primary-400 hover:text-primary-300">
            Daftar sebagai student
          </Link>
        </p>
      </div>
    </main>
  );
}
