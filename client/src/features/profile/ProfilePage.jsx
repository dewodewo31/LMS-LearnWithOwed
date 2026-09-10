import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiLogOut } from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Field, Input, Textarea } from '../../components/ui/Form';
import { fmtDate } from '../../lib/format';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', bio: user.bio || '' });
  const [pass, setPass] = useState({ currentPassword: '', newPassword: '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setErrors({});
    setSaving(true);
    try {
      await api.patch('/users/me', form);
      qc.invalidateQueries({ queryKey: ['me'] });
      toast.success('Profil diperbarui');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setErrors({});
    setSavingPass(true);
    try {
      await api.patch('/users/me', pass);
      setPass({ currentPassword: '', newPassword: '' });
      toast.success('Password diubah');
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else toast.error(err.message);
    } finally {
      setSavingPass(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 lg:max-w-3xl">
      <header>
        <h1 className="text-[28px] font-extrabold leading-tight text-ink">Profil</h1>
        <p className="mt-1 text-sm text-ink-soft">Kelola informasi akunmu.</p>
      </header>

      <section className="flex items-center gap-4 rounded-2xl border border-edge bg-surface p-5">
        <Avatar name={user.name} src={user.photo} size="lg" />
        <div>
          <p className="text-lg font-bold text-ink">{user.name}</p>
          <p className="text-sm text-ink-muted">{user.email}</p>
          <p className="mt-0.5 text-xs capitalize text-ink-muted">
            {user.role} · Bergabung {fmtDate(user.createdAt)}
          </p>
        </div>
      </section>

      <form onSubmit={saveProfile} className="space-y-4 rounded-2xl border border-edge bg-surface p-6" noValidate>
        <h2 className="text-base font-bold text-ink">Informasi</h2>
        <Field label="Nama" htmlFor="p-name" required error={errors.name}>
          <Input id="p-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email" htmlFor="p-email" hint="Email tidak dapat diubah tanpa verifikasi.">
          <Input id="p-email" value={user.email} disabled />
        </Field>
        <Field label="Telepon" htmlFor="p-phone" error={errors.phone}>
          <Input id="p-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field label="Bio" htmlFor="p-bio" error={errors.bio}>
          <Textarea id="p-bio" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={saving}>
            Simpan Profil
          </Button>
        </div>
      </form>

      <form onSubmit={savePassword} className="space-y-4 rounded-2xl border border-edge bg-surface p-6" noValidate>
        <h2 className="text-base font-bold text-ink">Ubah Password</h2>
        <Field label="Password saat ini" htmlFor="p-cur" required error={errors.currentPassword}>
          <Input
            id="p-cur"
            type="password"
            autoComplete="current-password"
            required
            value={pass.currentPassword}
            onChange={(e) => setPass({ ...pass, currentPassword: e.target.value })}
          />
        </Field>
        <Field label="Password baru" htmlFor="p-new" required error={errors.newPassword} hint="Minimal 8 karakter.">
          <Input
            id="p-new"
            type="password"
            autoComplete="new-password"
            required
            value={pass.newPassword}
            onChange={(e) => setPass({ ...pass, newPassword: e.target.value })}
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" loading={savingPass}>
            Ubah Password
          </Button>
        </div>
      </form>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#EF4444]/20 bg-[#EF4444]/5 px-4 py-3 text-sm font-semibold text-[#F87171] transition-colors hover:bg-[#EF4444]/10"
      >
        <FiLogOut aria-hidden="true" /> Keluar
      </button>
    </div>
  );
}
