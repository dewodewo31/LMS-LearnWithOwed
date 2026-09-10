import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiPlus, FiSearch, FiTrash2, FiUserCheck } from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Form';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import Progress from '../../components/ui/Progress';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import Pagination from '../../components/ui/Pagination';
import { fmtDate } from '../../lib/format';

export default function EnrollmentsPage() {
  const { user } = useAuth();
  const isAdmin = user.role === 'admin';
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [remove, setRemove] = useState(null);

  const query = new URLSearchParams(
    Object.entries({ page, limit: 20, status, keyword }).filter(([, v]) => v)
  ).toString();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['enrollments', query],
    queryFn: () => api.get(`/enrollments?${query}`),
    placeholderData: (prev) => prev,
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses', 'for-filter'],
    queryFn: () => api.get('/courses?limit=100'),
    enabled: isAdmin,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['enrollments'] });
    qc.invalidateQueries({ queryKey: ['dashboard'] });
  };

  const statusMut = useMutation({
    mutationFn: ({ id, status: next }) => api.patch(`/enrollments/${id}`, { status: next }),
    onSuccess: (_, vars) => {
      toast.success(vars.status === 'revoked' ? 'Akses dicabut' : 'Akses diaktifkan');
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMut = useMutation({
    mutationFn: (id) => api.delete(`/enrollments/${id}`),
    onSuccess: () => {
      toast.success('Enrollment dihapus');
      setRemove(null);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const rows = data?.data?.enrollments || [];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] font-extrabold leading-tight text-ink">Enrollments</h1>
          <p className="mt-1 text-sm text-ink-soft">Kelola akses student terhadap course.</p>
        </div>
        {isAdmin && (
          <Button onClick={() => setEnrollOpen(true)}>
            <FiPlus aria-hidden="true" /> Enroll Student
          </Button>
        )}
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setKeyword(keywordInput);
          setPage(1);
        }}
        className="flex flex-wrap gap-3"
        role="search"
        aria-label="Filter enrollment"
      >
        <div className="relative min-w-0 flex-1 sm:max-w-xs">
          <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
          <Input
            aria-label="Cari student atau course"
            placeholder="Cari student / course…"
            className="pl-9"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
        </div>
        <Select aria-label="Filter status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
          <option value="">Semua status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="revoked">Revoked</option>
        </Select>
      </form>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error.message} onRetry={refetch} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={FiUserCheck}
          title="Belum ada enrollment"
          body={
            keyword || status
              ? 'Tidak ada enrollment yang cocok dengan filter.'
              : isAdmin
                ? 'Berikan akses course ke student dengan tombol "Enroll Student".'
                : 'Belum ada student yang ter-enroll di course Anda.'
          }
          action={
            isAdmin && !keyword && !status && (
              <Button onClick={() => setEnrollOpen(true)}>
                <FiPlus aria-hidden="true" /> Enroll Student
              </Button>
            )
          }
        />
      ) : (
        <>
          <div className="overflow-hidden rounded-2xl border border-edge bg-surface">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-edge bg-surface-hover text-xs uppercase tracking-wide text-ink-muted">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-semibold">Student</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Course</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                    <th scope="col" className="px-5 py-3 font-semibold">Progress</th>
                    <th scope="col" className="hidden px-5 py-3 font-semibold md:table-cell">Tgl Enroll</th>
                    {isAdmin && <th scope="col" className="px-5 py-3 font-semibold sr-only">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-edge">
                  {rows.map((e) => (
                    <tr key={e.id} className="hover:bg-surface-hover">
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-ink">{e.student.name}</p>
                        <p className="text-xs text-ink-muted">{e.student.email}</p>
                      </td>
                      <td className="px-5 py-3.5">
                        <p className="font-medium text-ink-soft">{e.course.title}</p>
                        <p className="text-xs text-ink-muted capitalize">{e.course.level}</p>
                      </td>
                      <td className="px-5 py-3.5"><Badge value={e.status} /></td>
                      <td className="w-40 px-5 py-3.5"><Progress percent={e.progress} /></td>
                      <td className="hidden px-5 py-3.5 text-ink-muted md:table-cell">{fmtDate(e.enrolledAt)}</td>
                      {isAdmin && (
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex justify-end gap-2">
                            {e.status === 'revoked' || e.status === 'pending' ? (
                              <Button size="sm" variant="secondary" onClick={() => statusMut.mutate({ id: e.id, status: 'active' })}>
                                Aktifkan
                              </Button>
                            ) : e.status === 'active' ? (
                              <Button size="sm" variant="secondary" onClick={() => statusMut.mutate({ id: e.id, status: 'revoked' })}>
                                Cabut Akses
                              </Button>
                            ) : null}
                            <button
                              onClick={() => setRemove(e)}
                              aria-label={`Hapus enrollment ${e.student.name}`}
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
          </div>
          <Pagination meta={data?.meta} onPage={setPage} />
        </>
      )}

      {enrollOpen && <EnrollDialog courses={coursesData?.data?.courses || []} onClose={() => setEnrollOpen(false)} />}

      <ConfirmDialog
        open={Boolean(remove)}
        onClose={() => setRemove(null)}
        onConfirm={() => removeMut.mutate(remove.id)}
        title="Hapus enrollment?"
        message={`Enrollment ${remove?.student.name} pada "${remove?.course.title}" akan dihapus permanen bila belum ada progress belajar.`}
        confirmLabel="Hapus"
        loading={removeMut.isPending}
      />
    </div>
  );
}

function EnrollDialog({ courses, onClose }) {
  const qc = useQueryClient();
  const [studentSearch, setStudentSearch] = useState('');
  const [form, setForm] = useState({ studentId: '', courseId: '', status: 'active' });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: studentsData, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', 'for-select', studentSearch],
    queryFn: () => api.get(`/students?limit=50${studentSearch ? `&keyword=${encodeURIComponent(studentSearch)}` : ''}`),
  });
  const students = studentsData?.data?.students || [];

  const courseOptions = useMemo(() => courses.map((c) => ({ value: c.id, label: `${c.title} (${c.status})` })), [courses]);

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError(null);
    setSaving(true);
    try {
      await api.post('/enrollments', form);
      qc.invalidateQueries({ queryKey: ['enrollments'] });
      qc.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Student enrolled successfully — akses course diberikan');
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Enroll Student">
      <form onSubmit={submit} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm font-medium text-[#F87171]">
            {error}
          </p>
        )}
        <Field label="Cari student" htmlFor="search-student">
          <Input
            id="search-student"
            placeholder="Ketik nama atau email…"
            value={studentSearch}
            onChange={(e) => setStudentSearch(e.target.value)}
          />
        </Field>
        <Field label="Student" htmlFor="enroll-student" required error={errors.studentId}>
          <Select id="enroll-student" required value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
            <option value="">{loadingStudents ? 'Memuat…' : 'Pilih student'}</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.email}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Course" htmlFor="enroll-course" required error={errors.courseId}>
          <Select id="enroll-course" required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
            <option value="">Pilih course</option>
            {courseOptions.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status" htmlFor="enroll-status">
          <Select id="enroll-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
            <option value="active">Active — akses langsung diberikan</option>
            <option value="pending">Pending</option>
          </Select>
        </Field>
        <div className="flex justify-end gap-2 border-t border-edge pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={saving}>
            Enroll Student
          </Button>
        </div>
      </form>
    </Modal>
  );
}
