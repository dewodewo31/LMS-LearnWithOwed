import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiArrowLeft, FiDownload, FiFile } from 'react-icons/fi';
import { api } from '../../lib/api';
import Avatar from '../../components/ui/Avatar';
import Button from '../../components/ui/Button';
import { Field, Select, Textarea } from '../../components/ui/Form';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { GRADES, formatBytes, formatDateTime } from './constants';
import SubmissionStatusBadge from './SubmissionStatusBadge';

export default function SubmissionReviewPage() {
  const { submissionId } = useParams();
  const q = useQuery({
    queryKey: ['assignment', 'submission', submissionId],
    queryFn: () => api.get(`/assignments/submissions/${submissionId}`),
  });

  const { submission, student, assignment } = q.data?.data || {};

  if (q.isLoading) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (q.error) return <ErrorState message={q.error.message} onRetry={q.refetch} />;

  return (
    <div className="space-y-6">
      <div>
        <Link to={`/dashboard/lessons/${assignment.lessonId}/assignment`} className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
          <FiArrowLeft aria-hidden="true" /> Kembali ke Assignment
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-[26px] font-extrabold leading-tight text-ink">{assignment.title}</h1>
          {submission && <SubmissionStatusBadge status={submission.status} isLate={submission.isLate} />}
        </div>
        <p className="mt-1 text-sm text-ink-muted">{assignment.courseTitle} · Lesson {assignment.lessonOrder ?? '—'}: {assignment.lessonTitle}</p>
      </div>

      {/* Assignment context */}
      <section className="rounded-2xl border border-edge bg-surface p-6">
        <h2 className="mb-3 text-base font-bold text-ink">Instruksi</h2>
        {assignment.instructions ? (
          <div className="lesson-content" dangerouslySetInnerHTML={{ __html: assignment.instructions }} />
        ) : (
          <p className="text-sm text-ink-muted">Tidak ada instruksi.</p>
        )}
        {assignment.attachments.length > 0 && (
          <div className="mt-4 border-t border-edge pt-4">
            <h3 className="mb-2 text-sm font-semibold text-ink">File dari Teacher</h3>
            <ul className="flex flex-wrap gap-2">
              {assignment.attachments.map((f) => (
                <li key={f.id}>
                  <a href={f.url} download className="inline-flex items-center gap-2 rounded-full border border-edge px-3 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-surface-hover">
                    <FiFile aria-hidden="true" /> {f.originalName} <FiDownload aria-hidden="true" className="text-ink-muted" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Student + submission */}
      <section className="rounded-2xl border border-edge bg-surface p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-3">
            <Avatar name={student?.name || ''} src={student?.photo} />
            <div>
              <p className="text-sm font-bold text-ink">{student?.name}</p>
              <p className="text-xs text-ink-muted">
                {submission ? `v${submission.version} · ${formatDateTime(submission.submittedAt)}` : ''}
                {submission?.isLate ? ' · TERLAMBAT' : ''}
              </p>
            </div>
          </span>
        </div>

        {submission?.note && (
          <div className="mt-4 rounded-xl bg-surface-hover/60 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Catatan student</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{submission.note}</p>
          </div>
        )}

        <div className="mt-4">
          <h3 className="mb-2 text-sm font-semibold text-ink">File submission</h3>
          {submission?.attachments.length ? (
            <ul className="flex flex-wrap gap-2">
              {submission.attachments.map((f) => (
                <li key={f.id}>
                  <a href={f.url} download className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-3 py-1.5 text-xs font-semibold text-primary-400 transition-colors hover:bg-primary-500/20">
                    <FiFile aria-hidden="true" /> {f.originalName} <span className="text-ink-muted">{formatBytes(f.size)}</span> <FiDownload aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Tidak ada file.</p>
          )}
        </div>

        {/* Version history */}
        {submission?.history?.length > 0 && (
          <details className="mt-4 border-t border-edge pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Riwayat versi sebelumnya ({submission.history.length})</summary>
            <ul className="mt-3 space-y-3">
              {submission.history.map((h) => (
                <li key={h.version} className="rounded-xl border border-edge px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-ink">Versi {h.version}</p>
                    <span className="text-xs text-ink-muted tabular-nums">{formatDateTime(h.submittedAt)}{h.isLate ? ' · Late' : ''}</span>
                  </div>
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {h.attachments.map((f) => (
                      <li key={f.id}>
                        <a href={f.url} download className="inline-flex items-center gap-1.5 rounded-full border border-edge px-3 py-1 text-xs text-ink-soft hover:bg-surface-hover">
                          <FiFile aria-hidden="true" /> {f.originalName}
                        </a>
                      </li>
                    ))}
                  </ul>
                  {h.assessment && (
                    <p className="mt-2 text-xs text-ink-muted">
                      Dinilai: {h.assessment.criteria.map((c) => `${c.name} ${c.grade}`).join(' · ')}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* Grading form — remounted per submission via key */}
      <GradingForm key={submission.id} submission={submission} assignment={assignment} />
    </div>
  );
}

function GradingForm({ submission, assignment }) {
  const qc = useQueryClient();
  const existing = submission.assessment;
  const byName = new Map((existing?.criteria || []).map((c) => [c.name, c]));
  const [grades, setGrades] = useState(() =>
    Object.fromEntries(assignment.assessmentCriteria.map((c) => [c.name, byName.get(c.name)?.grade || '']))
  );
  const [feedbacks, setFeedbacks] = useState(() =>
    Object.fromEntries(assignment.assessmentCriteria.map((c) => [c.name, byName.get(c.name)?.feedback || '']))
  );
  const [overall, setOverall] = useState(existing?.overallFeedback || '');
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const saveMut = useMutation({
    mutationFn: (payload) => api.patch(`/assignments/submissions/${submission.id}/assessment`, payload),
    onSuccess: () => {
      toast.success('Penilaian tersimpan — student akan dinotifikasi');
      qc.invalidateQueries({ queryKey: ['assignment', 'submission', submission.id] });
      qc.invalidateQueries({ queryKey: ['assignment'] });
      setSaved(true);
    },
    onError: (err) => setError(err.errors ? Object.values(err.errors)[0] : err.message),
  });

  const save = (e) => {
    e.preventDefault();
    setError(null);
    setSaved(false);
    const criteria = assignment.assessmentCriteria.map((c) => ({
      name: c.name,
      grade: grades[c.name],
      feedback: feedbacks[c.name] || '',
    }));
    if (criteria.some((c) => !c.grade)) {
      setError('Semua kriteria wajib memiliki grade');
      return;
    }
    saveMut.mutate({ criteria, overallFeedback: overall });
  };

  return (
    <section className="rounded-2xl border border-edge bg-surface p-6">
      <h2 className="text-base font-bold text-ink">Penilaian</h2>
      <form onSubmit={save} className="mt-4 space-y-5" noValidate>
        {error && (
          <p role="alert" className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm font-medium text-[#F87171]">
            {error}
          </p>
        )}
        {saved && (
          <p role="status" className="rounded-lg bg-[#22C55E]/10 px-3 py-2 text-sm font-medium text-[#4ADE80]">
            Penilaian tersimpan.
          </p>
        )}
        {assignment.assessmentCriteria.map((c, i) => (
          <div key={c.name} className="space-y-3 rounded-xl border border-edge p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-ink">
                  {i + 1}. {c.name}
                </p>
                {c.description && <p className="mt-0.5 text-xs text-ink-muted">{c.description}</p>}
              </div>
              <Field label="Grade" htmlFor={`grade-${i}`} required>
                <Select
                  id={`grade-${i}`}
                  value={grades[c.name] || ''}
                  onChange={(e) => setGrades({ ...grades, [c.name]: e.target.value })}
                  className="w-28"
                  required
                >
                  <option value="" disabled>Pilih…</option>
                  {GRADES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Feedback" htmlFor={`feedback-${i}`}>
              <Textarea
                id={`feedback-${i}`}
                rows={3}
                value={feedbacks[c.name] || ''}
                onChange={(e) => setFeedbacks({ ...feedbacks, [c.name]: e.target.value })}
                placeholder="Feedback untuk kriteria ini…"
              />
            </Field>
          </div>
        ))}

        <Field label="Overall feedback (opsional)" htmlFor="overall-feedback" hint="Kesan umum atas pekerjaan student.">
          <Textarea id="overall-feedback" rows={3} value={overall} onChange={(e) => setOverall(e.target.value)} placeholder="Contoh: Kerja bagus, lanjutkan perbaikan struktur kode…" />
        </Field>

        <div className="flex justify-end border-t border-edge pt-4">
          <Button type="submit" loading={saveMut.isPending}>
            {existing ? 'Update Penilaian' : 'Simpan Penilaian'}
          </Button>
        </div>
      </form>
    </section>
  );
}
