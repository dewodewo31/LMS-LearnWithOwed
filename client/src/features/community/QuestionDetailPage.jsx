import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FiAward, FiCheckCircle, FiEdit2, FiHelpCircle, FiMessageSquare, FiTrash2,
} from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import Button from '../../components/ui/Button';
import { ConfirmDialog } from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { Field, Textarea } from '../../components/ui/Form';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import StudentTopBar from '../../layouts/StudentTopBar';
import { initials } from '../../lib/format';
import { AttachmentList, AttachmentUploader } from './Attachments';

function AuthorLine({ author, createdAt }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-500/10 text-xs font-bold text-primary-400" aria-hidden="true">
        {initials(author?.name || 'U')}
      </span>
      <div className="min-w-0 text-xs">
        <p className="flex items-center gap-1.5 font-semibold text-ink-soft">
          <span className="truncate">{author?.name || 'User'}</span>
          {author?.role && author.role !== 'student' && (
            <span className="rounded-full bg-primary-500/10 px-1.5 py-0.5 text-[10px] font-bold capitalize text-primary-400">
              {author.role}
            </span>
          )}
        </p>
        <p className="text-ink-muted">{new Date(createdAt).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </div>
    </div>
  );
}

function AnswerCard({ answer, questionId, isStaff, currentUserId }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(answer.body);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['community-answers', questionId] });
    qc.invalidateQueries({ queryKey: ['community-question', questionId] });
    qc.invalidateQueries({ queryKey: ['community'] });
  };

  const editMut = useMutation({
    mutationFn: () => api.patch(`/answers/${answer.id}`, { body }),
    onSuccess: () => {
      toast.success('Answer updated');
      setEditing(false);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => api.delete(`/answers/${answer.id}`),
    onSuccess: () => {
      toast.success('Answer deleted');
      setConfirmDelete(false);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  if (answer.isVerified) {
    return null;
  }

  const isAuthor = String(answer.author?.id) === String(currentUserId);
  const canDelete = isAuthor || isStaff;

  return (
    <li className="px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <AuthorLine author={answer.author} createdAt={answer.createdAt} />
        <div className="flex shrink-0 items-center gap-1">
          {isStaff && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                api
                  .post(`/answers/${answer.id}/verify`)
                  .then(() => {
                    toast.success('Marked as verified answer');
                    invalidate();
                  })
                  .catch((err) => toast.error(err.message))
              }
            >
              <FiAward aria-hidden="true" /> Verify
            </Button>
          )}
          {isAuthor && !editing && (
            <Button variant="ghost" size="sm" onClick={() => { setBody(answer.body); setEditing(true); }}>
              <FiEdit2 aria-hidden="true" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-[#F87171] hover:bg-[#EF4444]/10">
              <FiTrash2 aria-hidden="true" />
              <span className="sr-only">Delete answer</span>
            </Button>
          )}
        </div>
      </div>

      {editing ? (
        <form
          className="mt-3 space-y-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (body.trim().length < 2) return toast.error('Answer must be at least 2 characters.');
            editMut.mutate();
          }}
        >
          <Field label="Your answer" htmlFor={`edit-answer-${answer.id}`}>
            <Textarea id={`edit-answer-${answer.id}`} rows={4} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)} disabled={editMut.isPending}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={editMut.isPending}>
              Save
            </Button>
          </div>
        </form>
      ) : (
        <p className="mt-3 whitespace-pre-wrap text-[15px] leading-relaxed text-ink-soft">{answer.body}</p>
      )}

      <AttachmentList attachments={answer.attachments} />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMut.mutate()}
        title="Delete answer"
        message="Are you sure? This action cannot be undone."
        loading={deleteMut.isPending}
      />
    </li>
  );
}

export default function QuestionDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [answerBody, setAnswerBody] = useState('');
  const [answerAttachments, setAnswerAttachments] = useState([]);
  const [page, setPage] = useState(1);
  const [confirmDeleteQuestion, setConfirmDeleteQuestion] = useState(false);

  const isStudent = user.role === 'student';
  const isStaff = user.role === 'admin' || user.role === 'mentor';

  const questionQ = useQuery({ queryKey: ['community-question', id], queryFn: () => api.get(`/questions/${id}`) });
  const answersQ = useQuery({
    queryKey: ['community-answers', id, page],
    queryFn: () => api.get(`/questions/${id}/answers?page=${page}&limit=20`),
  });

  const question = questionQ.data?.data?.question;
  const answers = answersQ.data?.data?.answers || [];
  const verifiedAnswer = answers.find((a) => a.isVerified);
  const regularAnswers = answers.filter((a) => !a.isVerified);
  const isQuestionAuthor = question && String(question.author?.id) === String(user.id);

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: ['community-question', id] });
    qc.invalidateQueries({ queryKey: ['community-answers', id] });
    qc.invalidateQueries({ queryKey: ['community'] });
  };

  const answerMut = useMutation({
    mutationFn: () =>
      api.post(`/questions/${id}/answers`, {
        body: answerBody,
        attachmentIds: answerAttachments.map((a) => a.id),
      }),
    onSuccess: () => {
      toast.success('Answer posted');
      setAnswerBody('');
      setAnswerAttachments([]);
      invalidateAll();
    },
    onError: (err) => {
      if (err.errors) toast.error(Object.values(err.errors)[0]);
      else toast.error(err.message);
    },
  });

  const deleteQuestionMut = useMutation({
    mutationFn: () => api.delete(`/questions/${id}`),
    onSuccess: () => {
      toast.success('Question deleted');
      qc.invalidateQueries({ queryKey: ['community'] });
      const cid = qc.getQueryData(['community-question', id])?.data?.question?.courseId;
      if (cid) window.location.assign(isStudent ? `/student/courses/${cid}/community` : `/dashboard/courses/${cid}/community`);
    },
    onError: (err) => toast.error(err.message),
  });

  if (questionQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (questionQ.error) {
    return <ErrorState message={questionQ.error.message} onRetry={questionQ.refetch} />;
  }

  const courseLink = isStudent ? `/student/courses/${question.courseId}/community` : `/dashboard/courses/${question.courseId}/community`;

  return (
    <div>
      <StudentTopBar
        backTo={courseLink}
        items={[
          { label: 'Community', to: courseLink, hideOnMobile: true },
          { label: question.title },
        ]}
      />

      {/* Desktop: two-column */}
      <div className="lg:grid lg:grid-cols-[1fr_300px] lg:gap-6">
        <main className="space-y-5">
          {/* Question */}
          <article className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-extrabold leading-tight text-ink sm:text-2xl">{question.title}</h1>
              {question.status === 'closed' && (
                <span className="shrink-0 rounded-full border border-edge bg-surface-hover px-2.5 py-0.5 text-xs font-medium text-ink-muted">Closed</span>
              )}
            </div>
            <div className="mt-3">
              <AuthorLine author={question.author} createdAt={question.createdAt} />
            </div>
            <p className="mt-4 whitespace-pre-wrap text-[16px] leading-[1.7] text-ink-soft">{question.body}</p>
            <AttachmentList attachments={question.attachments} />

            {(isQuestionAuthor || isStaff) && (
              <div className="mt-4 flex justify-end border-t border-edge pt-3">
                <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteQuestion(true)} className="text-[#F87171] hover:bg-[#EF4444]/10">
                  <FiTrash2 aria-hidden="true" /> Delete question
                </Button>
              </div>
            )}
          </article>

          {/* Answers */}
          <section aria-label="Answers">
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-ink">
              <FiMessageSquare className="text-ink-muted" aria-hidden="true" />
              {answersQ.data ? `${answersQ.data.meta.total} ${answersQ.data.meta.total === 1 ? 'Answer' : 'Answers'}` : 'Answers'}
            </h2>

            {answersQ.isLoading ? (
              <div className="space-y-3 rounded-2xl border border-edge bg-surface p-5">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : answersQ.error ? (
              <ErrorState message={answersQ.error.message} onRetry={answersQ.refetch} />
            ) : (
              <>
                {verifiedAnswer && (
                  <article className="mb-4 rounded-2xl border-2 border-[#22C55E]/20 bg-[#22C55E]/5 p-5">
                    <p className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#22C55E]/10 px-2.5 py-1 text-xs font-bold text-[#4ADE80]">
                      <FiCheckCircle aria-hidden="true" /> Verified Answer
                    </p>
                    <AuthorLine author={verifiedAnswer.author} createdAt={verifiedAnswer.createdAt} />
                    <p className="mt-3 whitespace-pre-wrap text-[16px] leading-[1.7] text-ink-soft">{verifiedAnswer.body}</p>
                    <AttachmentList attachments={verifiedAnswer.attachments} />
                    {isStaff && (
                      <div className="mt-3 flex justify-end">
                        <Button variant="ghost" size="sm" onClick={() => api.post(`/answers/${verifiedAnswer.id}/unverify`).then(() => { toast.success('Verification removed'); invalidateAll(); }).catch((err) => toast.error(err.message))}>
                          Remove verification
                        </Button>
                      </div>
                    )}
                  </article>
                )}

                {regularAnswers.length === 0 && !verifiedAnswer ? (
                  <div className="rounded-2xl border border-dashed border-edge bg-surface p-5">
                    <EmptyState
                      icon={FiHelpCircle}
                      title="No answers yet."
                      body="Know the solution? Help your classmate."
                    />
                  </div>
                ) : (
                  <ul className="divide-y divide-edge rounded-2xl border border-edge bg-surface">
                    {regularAnswers.map((a) => (
                      <AnswerCard
                        key={a.id}
                        answer={a}
                        questionId={id}
                        isStaff={isStaff}
                        currentUserId={user.id}
                      />
                    ))}
                  </ul>
                )}

                <div className="pt-2">
                  <Pagination meta={answersQ.data?.meta} onPage={setPage} />
                </div>
              </>
            )}
          </section>

          {/* Your answer */}
          <section aria-label="Write an answer" className="rounded-2xl border border-edge bg-surface p-5 sm:p-6">
            <h2 className="text-base font-bold text-ink">Your Answer</h2>
            {question.status === 'closed' ? (
              <p className="mt-3 rounded-lg bg-surface-hover px-4 py-3 text-sm text-ink-muted">
                This question is closed for new answers.
              </p>
            ) : (
              <form
                className="mt-3 space-y-3"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (answerBody.trim().length < 2) return toast.error('Answer must be at least 2 characters.');
                  answerMut.mutate();
                }}
              >
                <Field
                  label="Write your answer"
                  htmlFor="answer-body"
                  hint="Explain your approach clearly. A screenshot or short video can help."
                >
                  <Textarea
                    id="answer-body"
                    rows={5}
                    value={answerBody}
                    onChange={(e) => setAnswerBody(e.target.value)}
                    placeholder="Share what worked for you..."
                    maxLength={5000}
                  />
                </Field>
                <AttachmentUploader attachments={answerAttachments} onChange={setAnswerAttachments} max={2} disabled={answerMut.isPending} />
                <div className="flex justify-end">
                  <Button type="submit" loading={answerMut.isPending}>
                    Post Answer
                  </Button>
                </div>
              </form>
            )}
          </section>
        </main>

        {/* Desktop sidebar: question context */}
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-2xl border border-edge bg-surface p-5">
              <h3 className="mb-3 text-sm font-bold text-ink">Info Pertanyaan</h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Status</dt>
                  <dd className="font-medium text-ink">{question.status === 'closed' ? 'Ditutup' : 'Terbuka'}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-ink-muted">Jawaban</dt>
                  <dd className="font-medium text-ink">{answers.length}</dd>
                </div>
                {verifiedAnswer && (
                  <div className="flex justify-between">
                    <dt className="text-ink-muted">Terverifikasi</dt>
                    <dd className="font-medium text-[#4ADE80]">Ya</dd>
                  </div>
                )}
              </dl>
              <Link to={courseLink} className="mt-4 block text-center text-sm font-medium text-primary-400 hover:text-primary-300">
                Kembali ke Community
              </Link>
            </div>
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={confirmDeleteQuestion}
        onClose={() => setConfirmDeleteQuestion(false)}
        onConfirm={() => deleteQuestionMut.mutate()}
        title="Delete question"
        message="The question and all its answers will be removed. Are you sure? This action cannot be undone."
        loading={deleteQuestionMut.isPending}
      />
    </div>
  );
}
