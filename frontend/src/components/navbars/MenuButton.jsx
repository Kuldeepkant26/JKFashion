/**
 * The mobile menu trigger, shared by every navbar variant.
 *
 * Two bars that cross into an X rather than the usual three: with the middle
 * bar gone there is nothing to fade out halfway through the animation, so the
 * transition stays clean at any speed.
 */
export default function MenuButton({ open, onClick, className = '' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={open ? 'Close menu' : 'Open menu'}
      aria-expanded={open}
      aria-controls="site-mobile-menu"
      className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition-colors
                  lg:hidden ${className}`}
      style={{ color: 'var(--text-primary)' }}
    >
      <span className="relative block h-4 w-5" aria-hidden="true">
        <span
          className="absolute left-0 block h-[1.5px] w-full rounded-full transition-all
                     duration-300 ease-out"
          style={{
            background: 'currentColor',
            top: open ? '50%' : '25%',
            transform: open ? 'translateY(-50%) rotate(45deg)' : 'none',
          }}
        />
        <span
          className="absolute left-0 block h-[1.5px] rounded-full transition-all duration-300
                     ease-out"
          style={{
            background: 'currentColor',
            top: open ? '50%' : '68%',
            width: open ? '100%' : '70%',
            transform: open ? 'translateY(-50%) rotate(-45deg)' : 'none',
          }}
        />
      </span>
    </button>
  );
}
