import { initials } from '../../lib/format';

export default function Avatar({ name = '', src, size = 'md' }) {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-14 w-14 text-lg' };
  if (src) {
    return <img src={src} alt={name} className={`${sizes[size]} rounded-full object-cover`} />;
  }
  return (
    <div className={`${sizes[size]} flex items-center justify-center rounded-full bg-primary-600 font-display font-bold text-white`} aria-hidden="true">
      {initials(name)}
    </div>
  );
}
