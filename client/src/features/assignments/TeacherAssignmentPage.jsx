import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FiArrowLeft, FiCheckCircle, FiDownload, FiFile, FiPaperclip, FiPlus, FiTrash2, FiUpload,
} from 'react-icons/fi';
import { api } from '../../lib/api';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Field, Input } from '../../components/ui/Form';
import RichTextEditor from '../../components/ui/RichTextEditor';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import { formatBytes, formatDateTime } from './constants';
import SubmissionStatusBadge from './SubmissionStatusBadge';

function toDatetimeLocal(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function TeacherAssignmentPage() {
  const { lessonId } = useParams();
  const assignmentQ = useQuery({
    queryKey: ['assignment', 'lesson', lessonId],
    queryFn: () => api.get(`/assignments/lessons/${lessonId}/assignment`),
  });
  const assignment = assignmentQ.data?.data?.assignment;

  if (assignmentQ.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (assignmentQ.error) return <ErrorState message={assignmentQ.error.message} onRetry={assignmentQ.refetch} />;

  return assignment ? (
    <div className="space-y-8">
      <AssignmentEditor key={assignment.id} lessonId={lessonId} assignment={assignment} />
      <SubmissionsSection assignmentId={assignment.id} />
    </div>
  ) : (
    <AssignmentEditor key="create" lessonId={lessonId} assignment={null} />
  );
}

/* ── Editor: create/update + files + publish ─────────────────────────────── */

const EMPTY = { title: '', instructions: '', deadline: '', criteria: [{ name: '', description: '' }] };

function AssignmentEditor({ lessonId, assignment }) {
  const qc = useQueryClient();
  const isEdit = Boolean(assignment);
  const [form, setForm] = useState(
    isEdit
      ? {
          title: assignment.title,
          instructions: assignment.instructions || '',
          deadline: toDatetimeLocal(assignment.deadline),
          criteria: assignment.assessmentCriteria.length ? assignment.assessmentCriteria.map((c) => ({ ...c })) : [{ name: '', description: '' }],
        }
      : EMPTY
  );
  const [error, setError] = useState(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['assignment', 'lesson', lessonId] });
    qc.invalidateQueries({ queryKey: ['assignment', assignment?.id] });
  };

  const saveMut = useMutation({
    mutationFn: (payload) =>
      isEdit ? api.patch(`/assignments/${assignment.id}`, payload) : api.post(`/assignments/lessons/${lessonId}/assignment`, payload),
    onSuccess: () => {
      toast.success(isEdit ? 'Assignment tersimpan' : 'Assignment dibuat — tambahkan file soal lalu publish');
      invalidate();
    },
    onError: (err) => setError(err.errors ? Object.values(err.errors)[0] : err.message),
  });

  const publishMut = useMutation({
    mutationFn: (status) => api.patch(`/assignments/${assignment.id}`, { status }),
    onSuccess: (d) => {
      toast.success(d.data.assignment.status === 'published' ? 'Assignment dipublish — student ter-enroll akan dinotifikasi' : 'Assignment dikembalikan ke draft');
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    const criteria = form.criteria.filter((c) => c.name.trim());
    if (!criteria.length) {
      setError('Minimal satu kriteria penilaian diperlukan');
      return;
    }
    saveMut.mutate({
      title: form.title,
      instructions: form.instructions,
      deadline: form.deadline || null,
      assessmentCriteria: criteria,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/dashboard/courses`} className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
            <FiArrowLeft aria-hidden="true" /> Dashboard
          </Link>
          <h1 className="mt-2 text-[26px] font-extrabold leading-tight text-ink">
            {isEdit ? assignment.title : 'Buat Assignment'}
          </h1>
          {isEdit && (
            <div className="mt-2 flex items-center gap-2">
              <Badge value={assignment.status} />
              <span className="text-xs text-ink-muted">Deadline: {assignment.deadline ? formatDateTime(assignment.deadline) : '—'}</span>
            </div>
          )}
        </div>
        {isEdit && (
          <div className="flex gap-2">
            {assignment.status !== 'published' ? (
              <Button size="sm" onClick={() => publishMut.mutate('published')} loading={publishMut.isPending}>
                <FiCheckCircle aria-hidden="true" /> Publish
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => publishMut.mutate('draft')} loading={publishMut.isPending}>
                Jadikan Draft
              </Button>
            )}
          </div>
        )}
      </div>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-edge bg-surface p-6" noValidate>
        {error && (
          <p role="alert" className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm font-medium text-[#F87171]">
            {error}
          </p>
        )}
        <Field label="Judul assignment" htmlFor="asg-title" required>
          <Input id="asg-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Contoh: Fix the Roblox Drop Game" />
        </Field>
        <Field label="Instruksi tugas" hint="Jelaskan tugas yang harus dikerjakan student.">
          <RichTextEditor value={form.instructions} onChange={(html) => setForm({ ...form, instructions: html })} />
        </Field>
        <Field label="Deadline (opsional)" htmlFor="asg-deadline" hint="Submission setelah deadline ditandai Late.">
          <Input id="asg-deadline" type="datetime-local" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className="max-w-xs" />
        </Field>

        <CriteriaEditor criteria={form.criteria} onChange={(criteria) => setForm({ ...form, criteria })} />

        <div className="flex justify-end border-t border-edge pt-4">
          <Button type="submit" loading={saveMut.isPending}>
            {isEdit ? 'Simpan Perubahan' : 'Buat Assignment'}
          </Button>
        </div>
      </form>

      {isEdit && <FilesSection assignment={assignment} onChanged={invalidate} />}
    </div>
  );
}

/* ── Assessment criteria editor ──────────────────────────────────────────── */

function CriteriaEditor({ criteria, onChange }) {
  const update = (i, patch) => onChange(criteria.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const remove = (i) => onChange(criteria.filter((_, idx) => idx !== i));
  const move = (i, dir) => {
    const target = i + dir;
    if (target < 0 || target >= criteria.length) return;
    const next = [...criteria];
    [next[i], next[target]] = [next[target], next[i]];
    onChange(next);
  };

  return (
    <fieldset>
      <legend className="mb-1.5 block text-sm font-medium text-ink">
        Kriteria penilaian <span className="text-[#EF4444]" aria-hidden="true">*</span>
      </legend>
      <p className="mb-3 text-xs text-ink-muted">Setiap kriteria dinilai dengan grade (A+, A, B+, B) dan feedback tertulis.</p>
      <div className="space-y-3">
        {criteria.map((c, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-edge bg-surface-hover/50 p-3 sm:flex-row sm:items-center">
            <span className="w-6 shrink-0 text-center text-xs font-bold text-ink-muted tabular-nums">{i + 1}</span>
            <div className="grid flex-1 gap-2 sm:grid-cols-2">
              <Input
                aria-label={`Nama kriteria ${i + 1}`}
                required
                value={c.name}
                onChange={(e) => update(i, { name: e.target.value })}
                placeholder="Contoh: Creativity"
              />
              <Input
                aria-label={`Deskripsi kriteria ${i + 1}`}
                value={c.description || ''}
                onChange={(e) => update(i, { description: e.target.value })}
                placeholder="Deskripsi / rubrik (opsional)"
              />
            </div>
            <div className="flex shrink-0 gap-1">
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Naikkan kriteria ${i + 1}`} className="rounded p-1.5 text-ink-muted hover:bg-surface-hover disabled:opacity-30">
                ↑
              </button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === criteria.length - 1} aria-label={`Turunkan kriteria ${i + 1}`} className="rounded p-1.5 text-ink-muted hover:bg-surface-hover disabled:opacity-30">
                ↓
              </button>
              <button type="button" onClick={() => remove(i)} disabled={criteria.length === 1} aria-label={`Hapus kriteria ${i + 1}`} className="rounded p-1.5 text-ink-muted hover:bg-[#EF4444]/10 hover:text-[#F87171] disabled:opacity-30">
                <FiTrash2 aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="secondary" size="sm" className="mt-3" onClick={() => onChange([...criteria, { name: '', description: '' }])}>
        <FiPlus aria-hidden="true" /> Tambah Kriteria
      </Button>
    </fieldset>
  );
}

/* ── Teacher files (starter code) ────────────────────────────────────────── */

function FilesSection({ assignment, onChanged }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const uploadMut = useMutation({
    mutationFn: (formData) => api.upload(`/assignments/${assignment.id}/attachments`, formData),
    onSuccess: () => {
      toast.success('File terlampir');
      onChanged();
    },
    onError: (err) => toast.error(err.message),
    onSettled: () => {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    },
  });

  const deleteMut = useMutation({
    mutationFn: (fileId) => api.delete(`/assignments/${assignment.id}/attachments/${fileId}`),
    onSuccess: () => {
      toast.success('Lampiran dihapus');
      onChanged();
    },
    onError: (err) => toast.error(err.message),
  });

  const onPick = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    setUploading(true);
    uploadMut.mutate(fd);
  };

  return (
    <section className="rounded-2xl border border-edge bg-surface p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-ink">File dari Teacher</h2>
          <p className="text-xs text-ink-muted">Starter code / materi soal yang bisa diunduh student (.lua, .js, .py, .zip, dst — maks 10 MB per file).</p>
        </div>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-primary-500">
          <FiUpload aria-hidden="true" /> Upload File
          <input ref={inputRef} type="file" multiple className="hidden" onChange={onPick} disabled={uploading} aria-label="Upload file soal" />
        </label>
      </div>

      {uploading && <p className="mb-3 text-xs text-ink-muted" role="status">Mengunggah…</p>}

      {assignment.attachments.length === 0 ? (
        <EmptyState icon={FiPaperclip} title="Belum ada file" body="Lampirkan starter code atau file soal untuk student." />
      ) : (
        <ul className="divide-y divide-edge">
          {assignment.attachments.map((f) => (
            <li key={f.id} className="flex items-center gap-3 py-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-400">
                <FiFile aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink" title={f.originalName}>{f.originalName}</p>
                <p className="text-xs text-ink-muted">{formatBytes(f.size)} · {formatDateTime(f.uploadedAt)}</p>
              </div>
              <a href={f.url} className="rounded-lg p-2 text-ink-muted hover:bg-surface-hover hover:text-ink-soft" aria-label={`Unduh ${f.originalName}`} download>
                <FiDownload aria-hidden="true" />
              </a>
              <button onClick={() => deleteMut.mutate(f.id)} disabled={deleteMut.isPending} aria-label={`Hapus ${f.originalName}`} className="rounded-lg p-2 text-ink-muted hover:bg-[#EF4444]/10 hover:text-[#F87171]">
                <FiTrash2 aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/* ── Submissions list ────────────────────────────────────────────────────── */

function gradeSummary(submission) {
  if (!submission?.assessment) return null;
  return submission.assessment.criteria.map((c) => c.grade).join(', ');
}

function SubmissionsSection({ assignmentId }) {
  const q = useQuery({
    queryKey: ['assignment', assignmentId, 'submissions'],
    queryFn: () => api.get(`/assignments/${assignmentId}/submissions`),
  });

  return (
    <section className="rounded-2xl border border-edge bg-surface">
      <div className="border-b border-edge px-5 py-4">
        <h2 className="text-base font-bold text-ink">Submissions</h2>
        <p className="text-xs text-ink-muted">Semua student ter-enroll beserta status pengumpulannya.</p>
      </div>
      {q.isLoading ? (
        <div className="space-y-3 p-5">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : q.error ? (
        <div className="p-5">
          <ErrorState message={q.error.message} onRetry={q.refetch} />
        </div>
      ) : q.data.data.submissions.length === 0 ? (
        <div className="p-5">
          <EmptyState title="Belum ada student ter-enroll" body="Student yang di-enroll admin ke course ini akan muncul di sini." />
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-edge text-xs uppercase tracking-wider text-ink-muted">
                  <th className="px-5 py-3 font-semibold">Student</th>
                  <th className="px-5 py-3 font-semibold">Submission</th>
                  <th className="px-5 py-3 font-semibold">Waktu</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Grade</th>
                  <th className="px-5 py-3 font-semibold text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {q.data.data.submissions.map(({ student, submission }) => (
                  <tr key={student.id}>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2.5">
                        <Avatar name={student.name} src={student.photo} size="sm" />
                        <span className="font-medium text-ink">{student.name}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-ink-soft">
                      {submission ? submission.attachments.map((a) => a.originalName).join(', ') : <span className="text-ink-muted">—</span>}
                    </td>
                    <td className="px-5 py-3 text-ink-muted tabular-nums">{submission ? formatDateTime(submission.submittedAt) : '—'}</td>
                    <td className="px-5 py-3">
                      {submission ? <SubmissionStatusBadge status={submission.status} isLate={submission.isLate} /> : <span className="text-xs text-ink-muted">Not Submitted</span>}
                    </td>
                    <td className="px-5 py-3 font-semibold text-ink">{gradeSummary(submission) || '—'}</td>
                    <td className="px-5 py-3 text-right">
                      {submission ? (
                        <Link to={`/dashboard/assignments/submissions/${submission.id}`}>
                          <Button variant="secondary" size="sm">Review</Button>
                        </Link>
                      ) : (
                        <span className="text-xs text-ink-muted">Belum mengumpulkan</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <ul className="divide-y divide-edge md:hidden">
            {q.data.data.submissions.map(({ student, submission }) => (
              <li key={student.id} className="space-y-2.5 px-4 py-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={student.name} src={student.photo} size="sm" />
                    <span className="truncate text-sm font-medium text-ink">{student.name}</span>
                  </span>
                  {submission ? <SubmissionStatusBadge status={submission.status} isLate={submission.isLate} /> : <span className="text-xs text-ink-muted">Not Submitted</span>}
                </div>
                {submission ? (
                  <>
                    <p className="truncate text-xs text-ink-soft" title={submission.attachments.map((a) => a.originalName).join(', ')}>
                      {submission.attachments.map((a) => a.originalName).join(', ')}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-ink-muted tabular-nums">{formatDateTime(submission.submittedAt)}{gradeSummary(submission) ? ` · ${gradeSummary(submission)}` : ''}</span>
                      <Link to={`/dashboard/assignments/submissions/${submission.id}`}>
                        <Button variant="secondary" size="sm">Review</Button>
                      </Link>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-ink-muted">Belum mengumpulkan</p>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
