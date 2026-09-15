import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiArrowLeft, FiArrowDown, FiArrowUp, FiClipboard, FiEdit2, FiFileText, FiMessageSquare, FiPlay, FiPlus, FiTrash2 } from 'react-icons/fi';
import { api } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { Field, Input, Select } from '../../components/ui/Form';
import RichTextEditor from '../../components/ui/RichTextEditor';
import Modal, { ConfirmDialog } from '../../components/ui/Modal';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States';

const EMPTY_LESSON = { title: '', contentType: 'text', textContent: '', youtubeUrl: '', isPublished: true };

export default function CourseManagePage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const { user } = useAuth();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`),
  });

  const [lessonModal, setLessonModal] = useState(null); // { mode:'create' } | { mode:'edit', lesson }
  const [deleteLesson, setDeleteLesson] = useState(null);
  const [deleteCourse, setDeleteCourse] = useState(false);
  const [publishErrors, setPublishErrors] = useState(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['course', id] });
    qc.invalidateQueries({ queryKey: ['courses'] });
  };

  const publishMut = useMutation({
    mutationFn: () => api.post(`/courses/${id}/publish`),
    onSuccess: () => {
      setPublishErrors(null);
      toast.success('Course published successfully');
      invalidate();
    },
    onError: (err) => {
      if (err.errors) setPublishErrors(Object.values(err.errors));
      else toast.error(err.message);
    },
  });

  const archiveMut = useMutation({
    mutationFn: () => api.post(`/courses/${id}/archive`),
    onSuccess: () => {
      toast.success('Course diarsipkan');
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteCourseMut = useMutation({
    mutationFn: () => api.delete(`/courses/${id}`),
    onSuccess: () => {
      toast.success('Course dihapus');
      qc.invalidateQueries({ queryKey: ['courses'] });
      window.location.assign('/dashboard/courses');
    },
    onError: (err) => toast.error(err.message),
  });

  const deleteLessonMut = useMutation({
    mutationFn: (lessonId) => api.delete(`/lessons/${lessonId}`),
    onSuccess: () => {
      toast.success('Lesson dihapus');
      setDeleteLesson(null);
      invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const reorderMut = useMutation({
    mutationFn: (lessons) =>
      api.patch(`/courses/${id}/lessons/reorder`, {
        orders: lessons.map((l, i) => ({ id: l._id, order: i + 1 })),
      }),
    onSuccess: invalidate,
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl space-y-5">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (error) return <ErrorState message={error.message} onRetry={refetch} />;

  const { course, lessons } = data.data;
  const move = (index, dir) => {
    const next = [...lessons];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    reorderMut.mutate(next);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Link to="/dashboard/courses" className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
        <FiArrowLeft aria-hidden="true" /> Kembali ke Courses
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-[28px] font-extrabold leading-tight text-ink">{course.title}</h1>
            <Badge value={course.status} />
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            {course.category || 'Tanpa kategori'} · {course.level} · {course.totalLessons} lessons · Mentor: {course.mentor?.name || '—'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/dashboard/courses/${id}/community`}>
            <Button variant="secondary" size="sm">
              <FiMessageSquare aria-hidden="true" /> Community
            </Button>
          </Link>
          <Link to={`/dashboard/courses/${id}/edit`}>
            <Button variant="secondary" size="sm">
              <FiEdit2 aria-hidden="true" /> Edit Info
            </Button>
          </Link>
          {course.status !== 'published' ? (
            <Button size="sm" onClick={() => publishMut.mutate()} loading={publishMut.isPending}>
              Publish
            </Button>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => archiveMut.mutate()} loading={archiveMut.isPending}>
              Arsipkan
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => setDeleteCourse(true)}>
            <FiTrash2 aria-hidden="true" /> Hapus
          </Button>
        </div>
      </header>

      {publishErrors && (
        <div role="alert" className="rounded-2xl border border-[#F59E0B]/20 bg-[#F59E0B]/5 px-5 py-4">
          <p className="text-sm font-semibold text-[#FBBF24]">Course belum bisa dipublish:</p>
          <ul className="mt-1.5 list-inside list-disc text-sm text-[#FBBF24]/80">
            {publishErrors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {course.description && (
        <section className="rounded-2xl border border-edge bg-surface p-6">
          <h2 className="mb-3 text-base font-bold text-ink">Deskripsi</h2>
          <div className="lesson-content" dangerouslySetInnerHTML={{ __html: course.description }} />
        </section>
      )}

      <section className="rounded-2xl border border-edge bg-surface">
        <div className="flex items-center justify-between border-b border-edge px-5 py-4">
          <h2 className="text-base font-bold text-ink">Lessons</h2>
          <Button size="sm" onClick={() => setLessonModal({ mode: 'create' })}>
            <FiPlus aria-hidden="true" /> Tambah Lesson
          </Button>
        </div>

        {lessons.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={FiFileText}
              title="Belum ada lesson"
              body="Tambahkan lesson pertama — course butuh minimal satu lesson untuk bisa dipublish."
              action={
                <Button size="sm" onClick={() => setLessonModal({ mode: 'create' })}>
                  <FiPlus aria-hidden="true" /> Tambah Lesson
                </Button>
              }
            />
          </div>
        ) : (
          <ul className="divide-y divide-edge">
            {lessons.map((l, i) => (
              <li key={l._id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex flex-col">
                  <button
                    onClick={() => move(i, -1)}
                    disabled={i === 0 || reorderMut.isPending}
                    aria-label={`Naikkan ${l.title}`}
                    className="rounded p-0.5 text-ink-muted hover:bg-surface-hover hover:text-ink-soft disabled:opacity-30"
                  >
                    <FiArrowUp aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => move(i, 1)}
                    disabled={i === lessons.length - 1 || reorderMut.isPending}
                    aria-label={`Turunkan ${l.title}`}
                    className="rounded p-0.5 text-ink-muted hover:bg-surface-hover hover:text-ink-soft disabled:opacity-30"
                  >
                    <FiArrowDown aria-hidden="true" />
                  </button>
                </div>
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-500/10 text-primary-400">
                  {l.contentType === 'video' ? <FiPlay aria-hidden="true" /> : l.contentType === 'assignment' ? <FiClipboard aria-hidden="true" /> : <FiFileText aria-hidden="true" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{l.title}</p>
                  <p className="text-xs text-ink-muted">
                    Lesson {l.order}
                    {l.duration ? ` · ${l.duration} menit` : ''}
                    {!l.isPublished && ' · Draft'}
                  </p>
                </div>
                <Badge value={l.contentType} />
                {l.contentType === 'assignment' && (
                  <Link
                    to={`/dashboard/lessons/${l._id}/assignment`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-primary-500/10 px-3 py-1.5 text-xs font-semibold text-primary-400 transition-colors hover:bg-primary-500/20"
                  >
                    <FiClipboard aria-hidden="true" /> Kelola Assignment
                  </Link>
                )}
                <button
                  onClick={() => setLessonModal({ mode: 'edit', lesson: l })}
                  aria-label={`Edit ${l.title}`}
                  className="rounded-lg p-2 text-ink-muted hover:bg-surface-hover hover:text-ink-soft"
                >
                  <FiEdit2 aria-hidden="true" />
                </button>
                <button
                  onClick={() => setDeleteLesson(l)}
                  aria-label={`Hapus ${l.title}`}
                  className="rounded-lg p-2 text-ink-muted hover:bg-[#EF4444]/10 hover:text-[#F87171]"
                >
                  <FiTrash2 aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {lessonModal && (
        <LessonModal
          courseId={id}
          lesson={lessonModal.lesson}
          canPublishLesson={course.status === 'published' ? user.role !== 'student' : true}
          onClose={() => setLessonModal(null)}
        />
      )}

      <ConfirmDialog
        open={Boolean(deleteLesson)}
        onClose={() => setDeleteLesson(null)}
        onConfirm={() => deleteLessonMut.mutate(deleteLesson._id)}
        title="Hapus lesson?"
        message={`Lesson "${deleteLesson?.title}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus Lesson"
        loading={deleteLessonMut.isPending}
      />

      <ConfirmDialog
        open={deleteCourse}
        onClose={() => setDeleteCourse(false)}
        onConfirm={() => deleteCourseMut.mutate()}
        title="Hapus course?"
        message={`Course "${course.title}" akan disembunyikan (soft delete). Course dengan enrollment sebaiknya diarsipkan saja.`}
        confirmLabel="Hapus Course"
        loading={deleteCourseMut.isPending}
      />
    </div>
  );
}

function LessonModal({ courseId, lesson, onClose }) {
  const qc = useQueryClient();
  const isEdit = Boolean(lesson);
  const [form, setForm] = useState(
    isEdit
      ? { title: lesson.title, contentType: lesson.contentType, textContent: lesson.textContent || '', youtubeUrl: lesson.youtubeUrl || '', isPublished: lesson.isPublished }
      : EMPTY_LESSON
  );
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setErrors({});
    setError(null);
    setSaving(true);
    try {
      const payload =
        form.contentType === 'video'
          ? { title: form.title, contentType: 'video', youtubeUrl: form.youtubeUrl, duration: null, isPublished: form.isPublished }
          : form.contentType === 'assignment'
            ? { title: form.title, contentType: 'assignment', isPublished: form.isPublished }
            : { title: form.title, contentType: 'text', textContent: form.textContent, isPublished: form.isPublished };
      if (isEdit) await api.patch(`/lessons/${lesson._id}`, payload);
      else await api.post(`/courses/${courseId}/lessons`, payload);
      qc.invalidateQueries({ queryKey: ['course', courseId] });
      toast.success(isEdit ? 'Lesson diperbarui' : 'Lesson ditambahkan');
      onClose();
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={isEdit ? 'Edit Lesson' : 'Tambah Lesson'} size="lg">
      <form onSubmit={save} className="space-y-4" noValidate>
        {error && (
          <p role="alert" className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm font-medium text-[#F87171]">
            {error}
          </p>
        )}
        <Field label="Judul lesson" htmlFor="lesson-title" required error={errors.title}>
          <Input id="lesson-title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Tipe konten" htmlFor="lesson-type">
          <Select
            id="lesson-type"
            value={form.contentType}
            disabled={isEdit}
            onChange={(e) => setForm({ ...form, contentType: e.target.value })}
          >
            <option value="text">Rich text</option>
            <option value="video">Video (YouTube)</option>
            <option value="assignment">Assignment</option>
          </Select>
        </Field>

        {form.contentType === 'assignment' && (
          <p className="rounded-lg bg-primary-500/10 px-3 py-2 text-xs text-primary-400">
            Lesson ini bertipe assignment. Setelah lesson dibuat, klik "Kelola Assignment" untuk
            mengisi instruksi, file soal, dan kriteria penilaian.
          </p>
        )}

        {form.contentType === 'text' ? (
          <Field label="Konten" error={errors.textContent}>
            <RichTextEditor value={form.textContent} onChange={(html) => setForm({ ...form, textContent: html })} />
          </Field>
        ) : (
          <Field
            label="URL YouTube"
            htmlFor="youtube"
            required
            error={errors.youtubeUrl}
            hint="Contoh: https://www.youtube.com/watch?v=VIDEO_ID atau https://youtu.be/VIDEO_ID"
          >
            <Input id="youtube" value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} />
          </Field>
        )}

        <label className="flex items-center gap-2 text-sm text-ink-soft">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            className="h-4 w-4 rounded border-edge bg-surface text-primary-600 focus:ring-primary-500"
          />
          Tampilkan lesson ini ke student
        </label>

        <div className="flex justify-end gap-2 border-t border-edge pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Simpan' : 'Tambah Lesson'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
