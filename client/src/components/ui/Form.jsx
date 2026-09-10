export function Field({ label, htmlFor, error, hint, required, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required && <span className="text-[#EF4444]" aria-hidden="true"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-ink-muted">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-xs font-medium text-[#EF4444]">
          {error}
        </p>
      )}
    </div>
  );
}

const base =
  'w-full rounded-lg border border-edge bg-surface px-4 py-2.5 text-sm text-ink placeholder:text-ink-muted focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-600/30 disabled:bg-surface-hover disabled:text-ink-muted transition-colors';

export function Input({ error, className = '', ...props }) {
  return <input className={`${base} ${error ? 'border-[#EF4444]' : ''} ${className}`} aria-invalid={!!error} {...props} />;
}

export function Select({ error, className = '', children, ...props }) {
  return (
    <select className={`${base} ${error ? 'border-[#EF4444]' : ''} ${className}`} aria-invalid={!!error} {...props}>
      {children}
    </select>
  );
}

export function Textarea({ error, rows = 4, className = '', ...props }) {
  return <textarea rows={rows} className={`${base} ${error ? 'border-[#EF4444]' : ''} ${className}`} aria-invalid={!!error} {...props} />;
}
