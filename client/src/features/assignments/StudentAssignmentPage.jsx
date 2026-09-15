import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FiArrowLeft, FiClipboard, FiDownload, FiFile, FiUpload,
} from 'react-icons/fi';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import { Field, Textarea } from '../../components/ui/Form';
import { ErrorState, Skeleton } from '../../components/ui/States';
import { ProtectedLessonContent } from '../student/ProtectedLesson';
import { formatBytes, formatDateTime } from './constants';
import SubmissionStatusBadge from './SubmissionStatusBadge';

const ACCEPT = '.lua,.js,.jsx,.ts,.tsx,.py,.php,.html,.css,.json,.zip,.txt,.md,.java,.c,.cpp,.cs,.rb,.go,.sql,.xml,.yml,.yaml';

function UploadForm({ assignmentId, onDone }) {
  const qc = useQueryClient();
  const inputRef = useRef(null);
  const [note, setNote] = useState('');
  const [error, setError] = useState(null);

  const submitMut = useMutation({
    mutationFn: (formData) => api.upload(`/assignments/${assignmentId}/submissions`, formData),
    onSuccess: () => {
      toast.success('Tugas berhasil dikumpulkan');
      qc.invalidateQueries({ queryKey: ['assignment', assignmentId] });
      onDone?.();
    },
    onError: (err) => setError(err.errors ? Object.values(err.errors)[0] : err.message),
  });

  const submit = (e) => {
    e.preventDefault();
    setError(null);
    const files = Array.from(inputRef.current?.files || []);
    if (!files.length) {
      setError('Pilih minimal satu file untuk dikumpulkan');
      return;
    }
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    if (note.trim()) fd.append('note', note.trim());
    submitMut.mutate(fd);
  };

  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      {error && (
        <p role="alert" className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm font-medium text-[#F87171]">
          {error}
        </p>
      )}
      <Field
        label="File jawaban"
        htmlFor="submission-files"
        required
        hint="Format: .lua, .js, .py, .zip, dll — maks 10 MB per file, hingga 5 file."
      >
        <input
          ref={inputRef}
          id="submission-files"
          type="file"
          multiple
          accept={ACCEPT}
          className="block w-full cursor-pointer rounded-lg border border-edge bg-surface px-4 py-2.5 text-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-primary-600 file:px-4 file:py-1.5 file:text-xs file:font-bold file:text-white hover:file:bg-primary-500"
        />
      </Field>
      <Field label="Catatan (opsional)" htmlFor="submission-note" hint="Jelaskan pendekatan atau kendala yang kamu hadapi.">
        <Textarea id="submission-note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Catatan untuk teacher…" />
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={submitMut.isPending}>
          <FiUpload aria-hidden="true" /> Kumpulkan Tugas
        </Button>
      </div>
    </form>
  );
}

function AssessmentResult({ assessment, criteria }) {
  const byName = new Map((assessment.criteria || []).map((c) => [c.name, c]));
  return (
    <section aria-label="Hasil penilaian" className="rounded-2xl border border-edge bg-surface p-6">
      <h2 className="text-base font-bold text-ink">Hasil Penilaian</h2>
      <p className="text-xs text-ink-muted">Dinilai {formatDateTime(assessment.gradedAt)}</p>
      <ul className="mt-4 space-y-4">
        {criteria.map((c, i) => {
          const graded = byName.get(c.name);
          return (
            <li key={c.name} className="rounded-xl border border-edge p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-ink">
                  {i + 1}. {c.name}
                </p>
                <span className="rounded-lg bg-primary-500/10 px-3 py-1 text-sm font-extrabold tabular-nums text-primary-400">
                  {graded?.grade || '—'}
                </span>
              </div>
              {graded?.feedback && (
                <div className="mt-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Feedback teacher</p>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{graded.feedback}</p>
                </div>
              )}
            </li>
          );
        })}
      </ul>
      {assessment.overallFeedback && (
        <div className="mt-4 rounded-xl bg-surface-hover/60 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-ink-muted">Overall feedback</p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-soft">{assessment.overallFeedback}</p>
        </div>
      )}
    </section>
  );
}

function VersionBlock({ version, submittedAt, isLate, attachments, note }) {
  return (
    <li className="rounded-xl border border-edge px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">Versi {version}</p>
        <span className="text-xs text-ink-muted tabular-nums">
          {formatDateTime(submittedAt)}
          {isLate ? ' · Late' : ''}
        </span>
      </div>
      <ul className="mt-2 flex flex-wrap gap-2">
        {attachments.map((f) => (
          <li key={f.id}>
            <a href={f.url} download className="inline-flex items-center gap-1.5 rounded-full border border-edge px-3 py-1 text-xs text-ink-soft transition-colors hover:bg-surface-hover">
              <FiFile aria-hidden="true" /> {f.originalName} <span className="text-ink-muted">{formatBytes(f.size)}</span>
            </a>
          </li>
        ))}
      </ul>
      {note && <p className="mt-2 whitespace-pre-wrap text-xs text-ink-muted">{note}</p>}
    </li>
  );
}

export default function StudentAssignmentPage() {
  const { assignmentId } = useParams();
  const [resubmitting, setResubmitting] = useState(false);
  const q = useQuery({
    queryKey: ['assignment', assignmentId],
    queryFn: () => api.get(`/assignments/${assignmentId}`),
  });

  if (q.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[880px] space-y-5 px-4 sm:px-6">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (q.error) {
    return (
      <div className="mx-auto w-full max-w-[880px] px-4 sm:px-6">
        <ErrorState message={q.error.message} onRetry={q.refetch} />
      </div>
    );
  }

  const { assignment, mySubmission } = q.data.data;
  const isLate = Boolean(mySubmission?.isLate && mySubmission.status === 'submitted');
  const deadlinePassed = assignment.deadline && new Date() > new Date(assignment.deadline);

  return (
    <div className="mx-auto w-full max-w-[880px] space-y-6 px-4 py-6 sm:px-6 lg:py-8">
      <StudentTopBarLink courseId={assignment.courseId} />

      <header>
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-primary-400">
          <FiClipboard aria-hidden="true" /> Assignment
        </p>
        <h1 className="mt-2 text-3xl font-extrabold leading-tight text-ink">{assignment.title}</h1>
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-ink-muted">
          <span>{assignment.courseTitle}</span>
          <span aria-hidden="true">·</span>
          <span>Lesson {assignment.lessonOrder ?? '—'}: {assignment.lessonTitle}</span>
          {assignment.mentor?.name && (
            <>
              <span aria-hidden="true">·</span>
              <span>Mentor: {assignment.mentor.name}</span>
            </>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {mySubmission ? (
            <SubmissionStatusBadge status={mySubmission.status} isLate={mySubmission.isLate} />
          ) : (
            <span className="inline-flex items-center rounded-full bg-surface-hover px-2.5 py-1 text-xs font-semibold text-ink-muted">Not Submitted</span>
          )}
          <span className="text-xs text-ink-muted">
            Deadline: {assignment.deadline ? formatDateTime(assignment.deadline) : 'tidak ada'}
            {deadlinePassed && !mySubmission ? ' · telah lewat (masih bisa mengumpulkan)' : ''}
          </span>
        </div>
      </header>

      {/* Instructions */}
      <section aria-label="Instruksi assignment" className="rounded-2xl border border-edge bg-surface p-5 lg:p-8">
        <h2 className="mb-3 text-base font-bold text-ink">Instruksi</h2>
        {assignment.instructions ? (
          <ProtectedLessonContent html={assignment.instructions} />
        ) : (
          <p className="text-sm text-ink-muted">Tidak ada instruksi tambahan.</p>
        )}

        {assignment.attachments.length > 0 && (
          <div className="mt-5 border-t border-edge pt-5">
            <h3 className="mb-2 text-sm font-bold text-ink">File dari Teacher</h3>
            <ul className="flex flex-wrap gap-2">
              {assignment.attachments.map((f) => (
                <li key={f.id}>
                  <a
                    href={f.url}
                    download
                    className="inline-flex items-center gap-2 rounded-full bg-primary-500/10 px-4 py-2 text-xs font-semibold text-primary-400 transition-colors hover:bg-primary-500/20"
                  >
                    <FiFile aria-hidden="true" /> {f.originalName}
                    <span className="text-ink-muted">{formatBytes(f.size)}</span>
                    <FiDownload aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* Assessment result */}
      {mySubmission?.assessment && (
        <AssessmentResult assessment={mySubmission.assessment} criteria={assignment.assessmentCriteria} />
      )}

      {/* Submission */}
      <section aria-label="Submission kamu" className="rounded-2xl border border-edge bg-surface p-5 lg:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">Submission Kamu</h2>
          {mySubmission && !resubmitting && (
            <Button variant="secondary" size="sm" onClick={() => setResubmitting(true)}>
              <FiUpload aria-hidden="true" /> Kumpulkan Versi Baru
            </Button>
          )}
        </div>

        {!mySubmission && !resubmitting ? (
          <div className="rounded-xl border border-dashed border-edge px-5 py-8 text-center">
            <p className="text-sm font-semibold text-ink">Kamu belum mengumpulkan tugas.</p>
            <p className="mt-1 text-xs text-ink-muted">Unduh file dari teacher di atas, kerjakan, lalu kumpulkan di sini.</p>
            <div className="mt-5">
              <UploadForm assignmentId={assignment.id} />
            </div>
          </div>
        ) : mySubmission && !resubmitting ? (
          <div className="space-y-4">
            <VersionBlock
              version={mySubmission.version}
              submittedAt={mySubmission.submittedAt}
              isLate={isLate}
              attachments={mySubmission.attachments}
              note={mySubmission.note}
            />
            {mySubmission.assessment && (
              <p className="rounded-xl bg-[#22C55E]/10 px-4 py-3 text-sm text-[#4ADE80]">
                Tugas sudah dinilai — lihat hasil penilaian di atas. Mengumpulkan versi baru akan mengubah status kembali menjadi Submitted.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <p className="rounded-xl bg-surface-hover/60 px-4 py-3 text-sm text-ink-soft">
              Mengumpulkan versi baru sebagai <strong>Versi {mySubmission ? mySubmission.version + 1 : 1}</strong>.
              Versi sebelumnya tetap tersimpan dan terlihat oleh teacher.
            </p>
            <UploadForm
              assignmentId={assignment.id}
              onDone={() => setResubmitting(false)}
            />
            {mySubmission && (
              <button type="button" onClick={() => setResubmitting(false)} className="text-sm font-medium text-ink-muted hover:text-ink">
                Batal
              </button>
            )}
          </div>
        )}

        {mySubmission?.history?.length > 0 && (
          <details className="mt-5 border-t border-edge pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-ink">Versi sebelumnya ({mySubmission.history.length})</summary>
            <ul className="mt-3 space-y-3">
              {mySubmission.history.map((h) => (
                <VersionBlock key={h.version} version={h.version} submittedAt={h.submittedAt} isLate={h.isLate} attachments={h.attachments} note={h.note} />
              ))}
            </ul>
          </details>
        )}
      </section>
    </div>
  );
}

function StudentTopBarLink({ courseId }) {
  return (
    <Link to={`/student/learn/${courseId}`} className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted transition-colors hover:text-ink">
      <FiArrowLeft aria-hidden="true" /> Kembali ke Course
    </Link>
  );
}
