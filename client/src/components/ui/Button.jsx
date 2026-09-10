import { FiLoader } from 'react-icons/fi';

const VARIANTS = {
  primary: 'bg-primary-600 text-white hover:bg-primary-500 active:bg-primary-700 disabled:bg-primary-800 disabled:text-ink-muted',
  secondary: 'bg-surface text-ink-soft border border-edge hover:bg-surface-hover active:bg-edge disabled:text-ink-muted',
  ghost: 'text-ink-soft hover:bg-surface-hover active:bg-edge disabled:text-ink-muted',
  danger: 'bg-[#EF4444] text-white hover:bg-[#DC2626] active:bg-[#B91C1C] disabled:bg-[#7F1D1D]',
};

const SIZES = {
  sm: 'px-3.5 py-2 text-sm gap-1.5',
  md: 'px-5 py-2.5 text-sm gap-2',
};

export default function Button({ variant = 'primary', size = 'md', loading = false, disabled, className = '', children, ...props }) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex min-h-[44px] items-center justify-center rounded-full font-semibold transition-colors duration-150 disabled:cursor-not-allowed ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && <FiLoader className="animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
