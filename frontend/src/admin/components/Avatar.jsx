/**
 * Initials in a tinted circle.
 *
 * Deliberately not an image: there is no avatar upload yet, and a placeholder
 * service would mean an external request that can fail and leave a broken
 * image in the panel.
 */
const initials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase() || '?';

const SIZES = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
};

export default function Avatar({ name, size = 'md', className = '' }) {
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full
                  bg-brand-pink-soft/40 font-body font-semibold text-brand-pink-dark
                  ${SIZES[size]} ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
