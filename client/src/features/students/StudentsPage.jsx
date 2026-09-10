import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiPlus, FiSearch, FiTrash2, FiUsers } from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Form';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import Pagination from '../../components/ui/Pagination';
import { fmtDate } from '../../lib/format';

export default function StudentsPage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [modal, setModal] = useState(null); // {mode:'create'}|{mode:'edit',student}
  const [deactivate, setDeactivate] = useState(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['students', page, keyword],
    queryFn: () => api.get(`/students?page=${page}&limit=20${keyword ? `&keyword=${encodeURIComponent(keyword)}` : ''}`),
    placeholderData: (prev) => prev,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['students'] });

  const deactivateMut = useMutation({
    mutationFn: (student) => api.patch(`/students/${student.id}`, { isDeleted: true }),
    onSuccess: () => {
      toast.success('Student dinonaktifkan');
      setDeactivate(null);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const students = data?.data?.students || [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight text-ink">Students</h1>
          <p className="mt-1 text-sm text-ink-soft">
            {isAdmin ? 'Kelola akun student.' : 'Student yang terdaftar di course Anda.'}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => setModal({ mode: 'create' })}>
            <FiPlus aria-hidden="true" /> Tambah Student
          </Button>
        )}
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setKeyword(keywordInput);
          setPage(1);
        }}
        className="relative max-w-sm"
        role="search"
        aria-label="Cari student"
      >
        <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <Input placeholder="Cari nama atau email…" className="pl-9" value={keywordInput} onChange={(e) => setKeywordInput(e.target.value)} />
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : students.length === 0 ? (
        <EmptyState
          icon={FiUsers}
          title="Belum ada student"
          body={keyword ? 'Tidak ada student yang cocok dengan pencarian.' : isAdmin ? 'Tambah student untuk mulai mengelola akses course.' : 'Belum ada student yang ter-enroll di course Anda.'}
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-edge bg-surface-hover text-xs uppercase tracking-wide text-ink-muted">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Student</th>
                  <th scope="col" className="hidden px-5 py-3 font-semibold sm:table-cell">Bergabung</th>
                  {isAdmin && <th scope="col" className="px-5 py-3 font-semibold sr-only">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-surface-hover">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={s.name} src={s.photo} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{s.name}</p>
                          <p className="truncate text-xs text-ink-muted">{s.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-5 py-3 text-ink-muted sm:table-cell">{fmtDate(s.createdAt)}</td>
                    {isAdmin && (
                      <td className="px-5 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="secondary" onClick={() => setModal({ mode: 'edit', student: s })}>
                            Edit
                          </Button>
                          <button
                            onClick={() => setDeactivate(s)}
                            aria-label={`Nonaktifkan ${s.name}`}
                            className="rounded-lg p-2 text-ink-muted hover:bg-[#EF4444]/10 hover:text-[#F87171]"
                          >
                            <FiTrash2 aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      {modal && <StudentModal student={modal.student} onClose={() => setModal(null)} />}
      <ConfirmDialog
        open={Boolean(deactivate)}
        onClose={() => setDeactivate(null)}
        onConfirm={() => deactivateMut.mutate(deactivate)}
        title="Nonaktifkan student?"
        message={`${deactivate?.name} akan dinonaktifkan dan kehilangan akses login. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Nonaktifkan"
        loading={deactivateMut.isPending}
      />
    </div>
  );
}

function StudentModal({ student, onClose }) {
  const isEdit = Boolean(student);
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: student?.name || '',
    email: student?.email || '',
    password: '',
    phone: student?.phone || '',
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setErrors({});
    setError(null);
    setSaving(true);
    try {
      if (isEdit) {
        const payload = { name: form.name, phone: form.phone };
        if (form.password) payload.password = form.password;
        await api.patch(`/students/${student.id}`, payload);
      } else {
        await api.post('/students', form);
      }
      qc.invalidateQueries({ queryKey: ['students'] });
      toast.success(isEdit ? 'Student diperbarui' : 'Student dibuat');
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Student' : 'Tambah Student'}>
      <form onSubmit={save} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm font-medium text-[#F87171]">
            {error}
          </p>
        )}
        <Field label="Nama" htmlFor="s-name" required error={errors.name}>
          <Input id="s-name" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </Field>
        <Field label="Email" htmlFor="s-email" required error={errors.email}>
          <Input id="s-email" type="email" required disabled={isEdit} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <Field label="Telepon" htmlFor="s-phone">
          <Input id="s-phone" value={form.phone || ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </Field>
        <Field
          label={isEdit ? 'Password baru' : 'Password'}
          htmlFor="s-password"
          required={!isEdit}
          error={errors.password}
          hint={isEdit ? 'Kosongkan jika tidak diubah.' : 'Minimal 8 karakter.'}
        >
          <Input
            id="s-password"
            type="password"
            autoComplete="new-password"
            required={!isEdit}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>
        <div className="flex justify-end gap-2 border-t border-edge pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Simpan' : 'Buat Student'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
