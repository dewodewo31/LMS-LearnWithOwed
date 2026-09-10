import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { FiFilm, FiImage, FiLoader, FiPaperclip, FiX } from 'react-icons/fi';
import { api } from '../../lib/api';

const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_MB = 2;
const MAX_VIDEO_MB = 25;
const MAX_VIDEO_SECONDS = 30;
const ACCEPT = 'image/jpeg,image/png,image/webp,video/mp4,video/webm';

const probeVideoDuration = (file) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    video.src = url;
  });

/** Uploads become attachments owned by the current user; claimed server-side on submit. */
export function AttachmentUploader({ attachments, onChange, max = 3, disabled }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const remove = async (attachment) => {
    onChange(attachments.filter((a) => a.id !== attachment.id));
    try {
      await api.delete(`/uploads/community/${attachment.id}`);
    } catch {
      /* server stays source of truth (e.g. already claimed) */
    }
  };

  const handleFile = async (file) => {
    if (!file) return;
    if (file.type.startsWith('image/')) {
      if (!IMAGE_TYPES.includes(file.type)) return toast.error('Image must be JPEG, PNG, or WebP.');
      if (file.size > MAX_IMAGE_MB * 1024 * 1024) return toast.error(`Image must be smaller than ${MAX_IMAGE_MB} MB.`);
    } else if (file.type.startsWith('video/')) {
      if (!VIDEO_TYPES.includes(file.type)) return toast.error('Video must be MP4 or WebM.');
      if (file.size > MAX_VIDEO_MB * 1024 * 1024) return toast.error(`Video must be smaller than ${MAX_VIDEO_MB} MB.`);
      if (attachments.some((a) => a.kind === 'video')) return toast.error('Only one video can be attached.');
      const seconds = await probeVideoDuration(file);
      if (seconds !== null && seconds > MAX_VIDEO_SECONDS) {
        return toast.error('Video must be 30 seconds or shorter.');
      }
    } else {
      return toast.error('You can attach an image or a short video.');
    }
    if (attachments.length >= max) return toast.error(`Maximum ${max} attachments.`);

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.upload('/uploads/community', formData);
      onChange([...attachments, res.data.attachment]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        {attachments.map((a) => (
          <span
            key={a.id}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-edge bg-surface py-1 pl-2.5 pr-1 text-xs text-ink-soft"
          >
            {a.kind === 'video' ? <FiFilm aria-hidden="true" /> : <FiImage aria-hidden="true" />}
            <span className="max-w-[10rem] truncate">{a.url.split('/').pop()}</span>
            <button
              type="button"
              onClick={() => remove(a)}
              disabled={disabled}
              aria-label="Hapus lampiran"
              className="rounded-full p-0.5 text-ink-muted hover:bg-surface-hover hover:text-ink-soft"
            >
              <FiX aria-hidden="true" />
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading || attachments.length >= max}
          className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-edge px-3 py-1.5 text-xs font-medium text-ink-soft hover:border-primary-400 hover:text-primary-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? <FiLoader className="animate-spin" aria-hidden="true" /> : <FiPaperclip aria-hidden="true" />}
          Attach image or video
        </button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <p className="mt-1.5 text-xs text-ink-muted">
        Screenshot (JPEG/PNG/WebP, max 2 MB) or a short video (MP4/WebM, max 30 seconds). The server checks video duration.
      </p>
    </div>
  );
}

/** Read-only rendering of question/answer attachments (spec §14: calm, responsive, no autoplay). */
export function AttachmentList({ attachments = [] }) {
  if (!attachments.length) return null;
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      {attachments.map((a) =>
        a.kind === 'video' ? (
          <video
            key={a.id}
            src={a.url}
            controls
            playsInline
            preload="metadata"
            className="w-full rounded-lg border border-edge bg-black"
          />
        ) : (
          <a key={a.id} href={a.url} target="_blank" rel="noopener noreferrer" className="group block">
            <img
              src={a.url}
              alt="Attachment"
              loading="lazy"
              className="max-h-72 w-full rounded-lg border border-edge object-contain transition-colors group-hover:border-primary-300"
            />
          </a>
        )
      )}
    </div>
  );
}
