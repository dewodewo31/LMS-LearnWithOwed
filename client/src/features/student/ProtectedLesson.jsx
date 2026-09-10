import { useMemo } from 'react';

const isEventWithin = (e, el) => {
  const range = document.getSelection()?.rangeCount ? document.getSelection().getRangeAt(0) : null;
  if (range && el.contains(range.commonAncestorContainer)) return true;
  return el.contains(e.target);
};

/**
 * Protected lesson reading container (student consumption only — never wrap
 * admin/mentor CKEditor with this). Copy deterrence: contextmenu, copy/cut and
 * dragstart are blocked when originating inside this container. Selection stays
 * enabled for readability and assistive tooling.
 */
export function ProtectedLessonContent({ html, className = '' }) {
  const guard = (e) => {
    if (isEventWithin(e, e.currentTarget)) e.preventDefault();
  };

  return (
    <div className={`relative ${className}`}>
      <div
        className="lesson-content"
        onContextMenu={guard}
        onCopy={guard}
        onCut={guard}
        onDragStart={guard}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

/**
 * YouTube embed using officially supported player parameters only
 * (https://developers.google.com/youtube/player_parameters):
 * rel=0 limits end-screen related videos to the same channel; playsinline=1
 * keeps mobile playback inside the page. No fake controls, no download path —
 * YouTube embeds cannot prevent screen recording or external capture.
 */
export function ProtectedLessonVideo({ videoId, title, className = '' }) {
  const origin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : undefined), []);
  const params = new URLSearchParams({ rel: '0', playsinline: '1' });
  if (origin) params.set('origin', origin);

  return (
    <div className={`relative overflow-hidden rounded-2xl border border-edge bg-black ${className}`}>
      <iframe
        className="aspect-video w-full"
        src={`https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        loading="lazy"
      />
    </div>
  );
}
