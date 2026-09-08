import { useHeroCarousel } from './useHeroCarousel.js';
import HeroIndicators from './HeroIndicators.jsx';
import { company } from '../../data/site.js';

/**
 * Oversized type with the artwork offset behind it.
 *
 * The headline deliberately overlaps the figure, which is what gives this one
 * its magazine feel — but it means the type has to stay readable over the
 * image. It sits on the left third, where the cut-outs are empty, and the
 * artwork is pushed right rather than centred to guarantee that stays true
 * across all four slides.
 */
export default function Editorial() {
  const { images, index, setIndex, current, count } = useHeroCarousel();

  return (
    <section
      className="relative flex min-h-screen items-center overflow-hidden"
      style={{ background: 'var(--surface-secondary)' }}
    >
      {/* A single oversized rule, the kind a print layout would use as a spine. */}
      <div
        aria-hidden
        className="absolute left-0 top-0 hidden h-full w-px lg:block"
        style={{
          left: 'clamp(2rem, 8vw, 7rem)',
          background:
            'linear-gradient(180deg, transparent, color-mix(in oklab, var(--brand-primary) 40%, transparent) 30%, color-mix(in oklab, var(--brand-primary) 40%, transparent) 70%, transparent)',
        }}
      />

      {/* artwork, offset right and behind the type */}
      <div className="absolute inset-y-0 right-0 w-[86%] sm:w-[70%] lg:w-[52%]">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt="Embroidered occasionwear from the JK Fashion range"
            loading={i === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-contain object-bottom
                       transition-all duration-[1200ms] ease-out"
            style={{
              opacity: i === index ? 1 : 0,
              transform: i === index ? 'translateY(0)' : 'translateY(14px)',
            }}
          />
        ))}
      </div>

      {/* Fades the artwork into the page on its left edge so the type has ground. */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, var(--surface-secondary) 0%, color-mix(in oklab, var(--surface-secondary) 72%, transparent) 38%, transparent 62%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] px-6 pt-28 sm:px-10 lg:pt-0">
        <div className="max-w-2xl">
          <div className="flex items-center gap-4">
            <span
              className="h-px w-12"
              style={{ background: 'var(--brand-primary)' }}
              aria-hidden
            />
            <p
              className="font-body text-[11px] font-semibold uppercase tracking-[0.34em]"
              style={{ color: 'var(--brand-primary)' }}
            >
              {company.name} — Est. {company.established}
            </p>
          </div>

          <h1
            key={index}
            className="mt-6 font-display text-[clamp(3rem,10vw,7.5rem)] font-bold
                       leading-[0.86] tracking-[-0.02em]"
            style={{ color: 'var(--text-primary)', animation: 'heroTextFadeIn 0.9s both' }}
          >
            {current.title}
          </h1>

          <div className="mt-8 flex max-w-md items-start gap-5">
            <span
              className="mt-2 h-px w-10 shrink-0"
              style={{ background: 'var(--brand-primary)', opacity: 0.5 }}
              aria-hidden
            />
            <p
              key={`d-${index}`}
              className="font-body text-[15px] leading-relaxed"
              style={{ color: 'var(--text-secondary)', animation: 'heroTextFadeIn 1s 0.2s both' }}
            >
              {current.description}
            </p>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-6">
            <button
              type="button"
              className="group flex items-center gap-3 font-body text-[12px] font-semibold
                         uppercase tracking-[0.22em]"
              style={{ color: 'var(--text-primary)' }}
            >
              View Our Work
              <span
                className="grid h-10 w-10 place-items-center rounded-full transition-transform
                           duration-300 group-hover:translate-x-1"
                style={{ background: 'var(--brand-primary)', color: 'var(--on-primary)' }}
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true">
                  <path
                    d="M4 10h11m0 0-4-4m4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                </svg>
              </span>
            </button>

            <HeroIndicators count={count} index={index} onSelect={setIndex} />
          </div>
        </div>
      </div>
    </section>
  );
}
