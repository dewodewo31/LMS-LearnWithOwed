import { useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FiArrowLeft, FiPlus, FiX, FiUploadCloud } from 'react-icons/fi';
import { api } from '../../lib/api';
import Button from '../../components/ui/Button';
import { Field, Input, Select, Textarea } from '../../components/ui/Form';
import RichTextEditor from '../../components/ui/RichTextEditor';
import { ErrorState, Skeleton } from '../../components/ui/States';

const toForm = (course) => ({
  id: course.id,
  title: course.title,
  shortDescription: course.shortDescription || '',
  category: course.category || '',
  level: course.level,
  language: course.language || 'id',
  thumbnail: course.thumbnail || '',
  requirements: course.requirements || [],
  learningObjectives: course.learningObjectives || [],
});

export default function CourseFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const { data: existing, isLoading, error, refetch } = useQuery({
    queryKey: ['course', id],
    queryFn: () => api.get(`/courses/${id}`),
    enabled: isEdit,
  });

  if (isEdit && isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-5">
        <Skeleton className="h-9 w-52" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }
  if (isEdit && error) return <ErrorState message={error.message} onRetry={refetch} />;

  const initial = isEdit ? toForm(existing.data.course) : null;
  const initialDescription = isEdit ? existing.data.course.description || '' : '';

  return <CourseForm key={id || 'new'} isEdit={isEdit} initial={initial} initialDescription={initialDescription} />;
}

function CourseForm({ isEdit, initial, initialDescription }) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fileRef = useRef(null);

  const [form, setForm] = useState(
    initial || {
      title: '',
      shortDescription: '',
      category: '',
      level: 'beginner',
      language: 'id',
      thumbnail: '',
      requirements: [],
      learningObjectives: [],
    }
  );
  const [description, setDescription] = useState(initialDescription);
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadThumbnail = async (file) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const d = await api.upload('/uploads/image', fd);
      setForm((f) => ({ ...f, thumbnail: d.data.url }));
      toast.success('Thumbnail terunggah');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErrors({});
    setError(null);
    setSaving(true);
    try {
      const payload = { ...form, description };
      const d = isEdit ? await api.patch(`/courses/${initial.id}`, payload) : await api.post('/courses', payload);
      qc.invalidateQueries({ queryKey: ['courses'] });
      qc.invalidateQueries({ queryKey: ['course'] });
      toast.success(isEdit ? 'Course diperbarui' : 'Course dibuat');
      navigate(`/dashboard/courses/${d.data.course.id}`);
    } catch (err) {
      if (err.errors) setErrors(err.errors);
      else setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link to="/dashboard/courses" className="inline-flex items-center gap-2 text-sm font-medium text-ink-muted hover:text-ink">
        <FiArrowLeft aria-hidden="true" /> Kembali ke Courses
      </Link>

      <header>
        <h1 className="text-[28px] font-extrabold leading-tight text-ink">{isEdit ? 'Edit Course' : 'Buat Course Baru'}</h1>
        <p className="mt-1 text-sm text-ink-soft">Lengkapi informasi course sebelum publish.</p>
      </header>

      <form onSubmit={submit} className="space-y-5 rounded-2xl border border-edge bg-surface p-6" noValidate>
        {error && (
          <p role="alert" className="rounded-lg bg-[#EF4444]/10 px-3 py-2 text-sm font-medium text-[#F87171]">
            {error}
          </p>
        )}

        <Field label="Judul course" htmlFor="title" required error={errors.title}>
          <Input id="title" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>

        <Field label="Deskripsi singkat" htmlFor="shortDescription" hint="Ditampilkan di kartu course. Maks 300 karakter.">
          <Textarea id="shortDescription" value={form.shortDescription} onChange={(e) => setForm({ ...form, shortDescription: e.target.value })} />
        </Field>

        <div className="grid gap-5 sm:grid-cols-3">
          <Field label="Kategori" htmlFor="category" error={errors.category}>
            <Input id="category" placeholder="mis. Programming" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </Field>
          <Field label="Level" htmlFor="level" required>
            <Select id="level" value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </Select>
          </Field>
          <Field label="Bahasa" htmlFor="language">
            <Select id="language" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })}>
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </Select>
          </Field>
        </div>

        <Field label="Thumbnail" htmlFor="thumbnail" error={errors.thumbnail} hint="JPEG/PNG/WebP, maks 2 MB. Dibutuhkan untuk publish.">
          <div className="flex items-center gap-4">
            {form.thumbnail ? (
              <img src={form.thumbnail} alt="Thumbnail course" className="h-16 w-28 rounded-lg border border-edge object-cover" />
            ) : (
              <div className="flex h-16 w-28 items-center justify-center rounded-lg border border-dashed border-edge bg-surface-hover text-ink-muted">
                <FiUploadCloud className="text-xl" aria-hidden="true" />
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              id="thumbnail"
              onChange={(e) => e.target.files?.[0] && uploadThumbnail(e.target.files[0])}
            />
            <Button type="button" variant="secondary" loading={uploading} onClick={() => fileRef.current?.click()}>
              <FiUploadCloud aria-hidden="true" /> Pilih Gambar
            </Button>
          </div>
        </Field>

        <Field label="Deskripsi lengkap" error={errors.description} hint="Materi ini tampil di halaman course. Dibutuhkan untuk publish.">
          <RichTextEditor value={description} onChange={setDescription} />
        </Field>

        <Field label="Learning objectives" hint="Satu poin per baris.">
          <div className="space-y-2">
            {(form.learningObjectives || []).map((obj, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={obj}
                  onChange={(e) => {
                    const arr = [...form.learningObjectives];
                    arr[i] = e.target.value;
                    setForm({ ...form, learningObjectives: arr });
                  }}
                  placeholder={`Poin ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, learningObjectives: form.learningObjectives.filter((_, j) => j !== i) })}
                  className="shrink-0 rounded-lg p-2 text-ink-muted hover:bg-surface-hover hover:text-ink-soft"
                  aria-label="Hapus poin"
                >
                  <FiX className="text-sm" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, learningObjectives: [...(form.learningObjectives || []), ''] })}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300"
            >
              <FiPlus className="text-base" /> Tambah poin
            </button>
          </div>
        </Field>

        <Field label="Requirements" hint="Satu poin per baris.">
          <div className="space-y-2">
            {(form.requirements || []).map((req, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  value={req}
                  onChange={(e) => {
                    const arr = [...form.requirements];
                    arr[i] = e.target.value;
                    setForm({ ...form, requirements: arr });
                  }}
                  placeholder={`Poin ${i + 1}`}
                />
                <button
                  type="button"
                  onClick={() => setForm({ ...form, requirements: form.requirements.filter((_, j) => j !== i) })}
                  className="shrink-0 rounded-lg p-2 text-ink-muted hover:bg-surface-hover hover:text-ink-soft"
                  aria-label="Hapus poin"
                >
                  <FiX className="text-sm" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, requirements: [...(form.requirements || []), ''] })}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-400 hover:text-primary-300"
            >
              <FiPlus className="text-base" /> Tambah poin
            </button>
          </div>
        </Field>

        <div className="flex justify-end gap-3 border-t border-edge pt-5">
          <Link to="/dashboard/courses">
            <Button type="button" variant="secondary">
              Batal
            </Button>
          </Link>
          <Button type="submit" loading={saving}>
            {isEdit ? 'Simpan Perubahan' : 'Buat Course'}
          </Button>
        </div>
      </form>
    </div>
  );
}
