import { useHeroCarousel } from './useHeroCarousel.js';
import HeroIndicators from './HeroIndicators.jsx';

/**
 * Artwork edge to edge, copy laid over a scrim.
 *
 * The cut-outs are transparent PNGs, so a plain `cover` would leave the figure
 * cropped and the background empty. Instead the image is anchored right and
 * given a tinted ground, with a gradient scrim on the left that keeps the copy
 * legible over whichever slide is showing.
 *
 * The ground is deliberately a PALE tint of the brand rather than the deep
 * one this layout would otherwise want. The cut-outs were keyed out of a
 * light checkerboard, so their anti-aliased edges still carry a trace of it —
 * invisible against a light page, but a clearly visible halo around every
 * figure on a dark one. Keeping the ground light is what stops that showing,
 * and it costs nothing: the scrim carries the contrast instead.
 */
export default function FullBleed() {
  const { images, index, setIndex, current, count } = useHeroCarousel();

  return (
    <section
      className="relative flex min-h-screen items-center overflow-hidden"
      style={{
        background:
          'linear-gradient(115deg, color-mix(in oklab, var(--brand-accent) 24%, var(--surface-primary)) 0%, color-mix(in oklab, var(--brand-accent) 12%, var(--surface-primary)) 52%, var(--surface-primary) 100%)',
      }}
    >
      {/* artwork */}
      <div className="absolute inset-y-0 right-0 w-full sm:w-[72%] lg:w-[58%]">
        {images.map((src, i) => (
          <img
            key={src}
            src={src}
            alt="Embroidered occasionwear from the JK Fashion range"
            loading={i === 0 ? 'eager' : 'lazy'}
            className="absolute inset-0 h-full w-full object-contain object-bottom
                       transition-all duration-1000 ease-out"
            style={{
              opacity: i === index ? 1 : 0,
              transform: i === index ? 'scale(1)' : 'scale(1.05)',
            }}
          />
        ))}
      </div>

      {/* scrim — strongest at the left, clearing before the figure */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(90deg, color-mix(in oklab, var(--surface-primary) 92%, transparent) 0%, color-mix(in oklab, var(--surface-primary) 62%, transparent) 44%, transparent 70%)',
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] px-6 pt-24 sm:px-10 lg:pt-0">
        <div className="max-w-xl">
          <p
            className="font-body text-[11px] font-semibold uppercase tracking-[0.34em]"
            style={{ color: 'var(--brand-primary)' }}
          >
            Time to meet your
          </p>

          <h1
            key={index}
            className="mt-4 font-display text-[clamp(2.5rem,7vw,5rem)] font-bold leading-[0.95]
                       tracking-tight"
            style={{ color: 'var(--text-primary)', animation: 'heroTextFadeIn 0.8s both' }}
          >
            {current.title}
          </h1>

          <p
            key={`d-${index}`}
            className="mt-5 max-w-lg font-body text-[15px] leading-relaxed sm:text-base"
            style={{
              color: 'var(--text-secondary)',
              animation: 'heroTextFadeIn 1s 0.15s both',
            }}
          >
            {current.description}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              className="rounded-full px-8 py-3.5 font-body text-[12px] font-semibold uppercase
                         tracking-[0.2em] transition-transform duration-200 hover:-translate-y-0.5"
              style={{ background: 'var(--brand-primary)', color: 'var(--on-primary)' }}
            >
              View Our Work
            </button>

            <HeroIndicators count={count} index={index} onSelect={setIndex} />
          </div>
        </div>
      </div>
    </section>
  );
}
