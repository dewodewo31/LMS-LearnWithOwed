import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { FiBookOpen } from 'react-icons/fi';
import { useAuth } from './AuthContext';
import Button from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Form';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setErrors({});
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Akun berhasil dibuat!');
      navigate('/student', { replace: true });
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setError(err.message);
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
          <h1 className="text-2xl font-extrabold text-ink">Buat Akun</h1>
          <p className="text-sm text-ink-soft">Course yang tersedia akan diberikan oleh administrator.</p>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-edge bg-surface p-6" noValidate>
          {error && (
            <p role="alert" className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm font-medium text-[#F87171]">
              {error}
            </p>
          )}
          <Field label="Nama lengkap" htmlFor="name" required error={errors.name}>
            <Input id="name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Email" htmlFor="email" required error={errors.email}>
            <Input id="email" type="email" autoComplete="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Password" htmlFor="password" required error={errors.password} hint="Minimal 8 karakter.">
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </Field>
          <Button type="submit" loading={loading} className="w-full">
            Daftar
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-ink-muted">
          Sudah punya akun?{' '}
          <Link to="/login" className="font-semibold text-primary-400 hover:text-primary-300">
            Masuk
          </Link>
        </p>
      </div>
    </main>
  );
}
