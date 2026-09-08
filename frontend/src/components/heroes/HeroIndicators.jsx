/**
 * The carousel dots, shared by the hero variants that show them.
 *
 * The active dot stretches into a short bar rather than only changing colour,
 * so which slide you are on is readable at a glance without relying on the
 * palette — several presets put the accent very close to the surface.
 */
export default function HeroIndicators({ count, index, onSelect, className = '' }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          aria-label={`Go to slide ${i + 1}`}
          aria-current={i === index}
          className="grid h-6 w-6 place-items-center rounded-full transition-transform
                     hover:scale-110"
        >
          <span
            className="block rounded-full transition-all duration-300"
            style={{
              width: i === index ? 22 : 8,
              height: 8,
              background: i === index ? 'var(--brand-primary)' : 'transparent',
              border: '1px solid var(--brand-primary)',
              opacity: i === index ? 1 : 0.5,
            }}
          />
        </button>
      ))}
    </div>
  );
}
