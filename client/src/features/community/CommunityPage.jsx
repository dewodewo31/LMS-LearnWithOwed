import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiCheckCircle, FiHelpCircle, FiMessageSquare, FiSearch } from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Pagination from '../../components/ui/Pagination';
import { Field, Input, Textarea } from '../../components/ui/Form';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';
import StudentTopBar from '../../layouts/StudentTopBar';
import { fmtDate } from '../../lib/format';
import { AttachmentUploader } from './Attachments';

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unanswered', label: 'Unanswered' },
  { value: 'answered', label: 'Answered' },
  { value: 'verified', label: 'Verified' },
];

const EMPTY_QUESTION = { title: '', body: '', attachments: [] };

function QuestionCard({ question, basePath }) {
  return (
    <li>
      <Link
        to={`/community/questions/${question.id}`}
        state={{ from: basePath }}
        className="block px-5 py-4 transition-colors hover:bg-surface-hover"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-[15px] font-semibold leading-snug text-ink">{question.title}</h3>
          {question.hasVerified && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-[#22C55E]/20 bg-[#22C55E]/10 px-2 py-0.5 text-[11px] font-semibold text-[#4ADE80]">
              <FiCheckCircle aria-hidden="true" /> Verified
            </span>
          )}
        </div>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-ink-muted">
          <span className="font-medium text-ink-soft">{question.author?.name || 'User'}</span>
          {question.author?.role && question.author.role !== 'student' && (
            <span className="capitalize text-primary-400">{question.author.role}</span>
          )}
          <span aria-hidden="true">·</span>
          <span>{fmtDate(question.createdAt)}</span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1">
            <FiMessageSquare aria-hidden="true" /> {question.answerCount}{' '}
            {question.answerCount === 1 ? 'Answer' : 'Answers'}
          </span>
          {question.status === 'closed' && <span className="text-ink-muted">· Closed</span>}
        </p>
      </Link>
    </li>
  );
}

function AskQuestionModal({ open, onClose, courseId }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(EMPTY_QUESTION);
  const [errors, setErrors] = useState({});

  const mutate = useMutation({
    mutationFn: () =>
      api.post(`/courses/${courseId}/questions`, {
        title: form.title,
        body: form.body,
        attachmentIds: form.attachments.map((a) => a.id),
      }),
    onSuccess: () => {
      toast.success('Question posted');
      setForm(EMPTY_QUESTION);
      setErrors({});
      onClose();
      qc.invalidateQueries({ queryKey: ['community', courseId] });
    },
    onError: (err) => {
      if (err.errors) setErrors(err.errors);
      else toast.error(err.message);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    const next = {};
    if (form.title.trim().length < 5) next.title = 'Title must be at least 5 characters.';
    if (form.body.trim().length < 10) next.body = 'Describe your problem in at least 10 characters.';
    setErrors(next);
    if (Object.keys(next).length === 0) mutate.mutate();
  };

  return (
    <Modal open={open} onClose={onClose} title="Ask a Question" size="lg">
      <form onSubmit={submit} noValidate>
        <div className="space-y-4">
          <Field label="Title" htmlFor="ask-title" error={errors.title} required>
            <Input
              id="ask-title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Why does my function return undefined?"
              maxLength={150}
            />
          </Field>
          <Field
            label="Description"
            htmlFor="ask-body"
            error={errors.body}
            required
            hint="Describe what you are trying to do and what went wrong. You can attach a screenshot or a short video if it helps explain the problem."
          >
            <Textarea
              id="ask-body"
              rows={6}
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder="What did you expect? What actually happened? Include the error message or the code you are running."
              maxLength={5000}
            />
          </Field>
          <AttachmentUploader attachments={form.attachments} onChange={(attachments) => setForm({ ...form, attachments })} max={3} disabled={mutate.isPending} />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose} disabled={mutate.isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={mutate.isPending}>
            Post Question
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default function CommunityPage() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const isStudent = user.role === 'student';

  const [filter, setFilter] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [askOpen, setAskOpen] = useState(searchParams.get('ask') === '1');

  useEffect(() => {
    const t = setTimeout(() => {
      setDebounced(keyword);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [keyword]);

  const courseQ = useQuery({ queryKey: ['course', courseId], queryFn: () => api.get(`/courses/${courseId}`) });
  const questionsQ = useQuery({
    queryKey: ['community', courseId, 'questions', { filter, keyword: debounced, page }],
    queryFn: () => {
      const params = new URLSearchParams({ filter, page: String(page), limit: '10' });
      if (debounced.trim()) params.set('keyword', debounced.trim());
      return api.get(`/courses/${courseId}/questions?${params.toString()}`);
    },
  });

  const course = courseQ.data?.data?.course;
  const questions = questionsQ.data?.data?.questions || [];
  const meta = questionsQ.data?.meta;
  const basePath = isStudent ? `/student/courses/${courseId}/community` : `/dashboard/courses/${courseId}/community`;

  const closeAsk = () => {
    setAskOpen(false);
    if (searchParams.get('ask')) setSearchParams({}, { replace: true });
  };

  if (courseQ.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  if (courseQ.error) {
    return <ErrorState message={courseQ.error.message} onRetry={courseQ.refetch} />;
  }

  return (
    <div>
      <StudentTopBar
        backTo={isStudent ? `/student/courses/${courseId}` : `/dashboard/courses/${courseId}`}
        items={
          isStudent
            ? [
                { label: 'Beranda', to: '/student', hideOnMobile: true },
                { label: course.title, to: `/student/courses/${courseId}` },
                { label: 'Community' },
              ]
            : [
                { label: course.title, to: `/dashboard/courses/${courseId}` },
                { label: 'Community' },
              ]
        }
      />

      <main>

        {/* Desktop: two-column with filters sidebar */}
        <div className="lg:grid lg:grid-cols-[1fr_280px] lg:gap-6">
          {/* Main content */}
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-2xl font-extrabold text-ink sm:text-3xl">Community</h1>
                <p className="mt-1 text-sm text-ink-muted">Ask questions and help your classmates in {course.title}.</p>
              </div>
              <Button onClick={() => setAskOpen(true)}>
                <FiHelpCircle aria-hidden="true" /> Ask a Question
              </Button>
            </div>

            {/* Search + filters — row on mobile, stacked on desktop sidebar */}
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative sm:max-w-xs sm:flex-1">
                <FiSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
                <Input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="Search questions..."
                  aria-label="Search questions"
                  className="pl-9"
                />
              </div>
              <div className="flex rounded-lg bg-surface p-1" role="tablist" aria-label="Filter questions">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    role="tab"
                    aria-selected={filter === f.value}
                    onClick={() => {
                      setFilter(f.value);
                      setPage(1);
                    }}
                    className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                      filter === f.value ? 'bg-surface-hover text-ink' : 'text-ink-muted hover:text-ink-soft'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 overflow-hidden rounded-2xl border border-edge bg-surface">
              {questionsQ.isLoading ? (
                <div className="space-y-3 p-5">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              ) : questionsQ.error ? (
                <div className="p-5">
                  <ErrorState message={questionsQ.error.message} onRetry={questionsQ.refetch} />
                </div>
              ) : questions.length === 0 ? (
                <div className="p-5">
                  {keyword.trim() || filter !== 'all' ? (
                    <EmptyState
                      icon={FiSearch}
                      title="No questions found"
                      body="Try a different keyword or filter."
                    />
                  ) : (
                    <EmptyState
                      icon={FiHelpCircle}
                      title="No questions yet."
                      body="Be the first to ask about this module."
                      action={
                        <Button size="sm" onClick={() => setAskOpen(true)}>
                          Ask a Question
                        </Button>
                      }
                    />
                  )}
                </div>
              ) : (
                <>
                  <ul className="divide-y divide-edge">
                    {questions.map((q) => (
                      <QuestionCard key={q.id} question={q} basePath={basePath} />
                    ))}
                  </ul>
                  <div className="px-5 pb-3">
                    <Pagination meta={meta} onPage={setPage} />
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Desktop: sidebar with course context */}
          <aside className="hidden lg:block">
            <div className="sticky top-20 space-y-4">
              <div className="rounded-2xl border border-edge bg-surface p-5">
                <h3 className="mb-3 text-sm font-bold text-ink">Tentang Course</h3>
                <p className="text-sm text-ink-muted">{course.title}</p>
                {course.mentor?.name && (
                  <p className="mt-2 text-xs text-ink-muted">Mentor: <span className="font-medium text-ink-soft">{course.mentor.name}</span></p>
                )}
                <p className="mt-1 text-xs text-ink-muted">{course.totalLessons} lessons · {course.category || '—'}</p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AskQuestionModal open={askOpen} onClose={closeAsk} courseId={courseId} />
    </div>
  );
}
