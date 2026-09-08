import { useHeroCarousel } from './useHeroCarousel.js';
import HeroIndicators from './HeroIndicators.jsx';

/**
 * Centred copy with the artwork beneath it.
 *
 * The one variant whose desktop and mobile compositions are the same shape,
 * which makes it the safest choice when most traffic is on phones: nothing has
 * to be re-thought at the breakpoint, it simply gets narrower.
 */
export default function CentreStage() {
  const { images, index, setIndex, current, count } = useHeroCarousel();

  return (
    <section
      className="relative flex min-h-screen flex-col items-center overflow-hidden
                 px-6 pt-28 sm:px-10 sm:pt-32"
      style={{ background: 'var(--surface-primary)' }}
    >
      {/* A wash behind the artwork, so the cut-out is not floating on flat white. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[62%]"
        style={{
          background:
            'radial-gradient(ellipse at 50% 100%, color-mix(in oklab, var(--brand-accent) 26%, transparent) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 flex w-full max-w-3xl flex-col items-center text-center">
        <p
          className="font-body text-[11px] font-semibold uppercase tracking-[0.34em]"
          style={{ color: 'var(--brand-primary)' }}
        >
          Time to meet your
        </p>

        <h1
          key={index}
          className="mt-4 font-display text-[clamp(2.75rem,8vw,5.5rem)] font-bold leading-[0.95]
                     tracking-tight"
          style={{ color: 'var(--text-primary)', animation: 'heroTextFadeIn 0.8s both' }}
        >
          {current.title}
        </h1>

        <p
          key={`d-${index}`}
          className="mt-5 max-w-xl font-body text-[15px] leading-relaxed sm:text-base"
          style={{ color: 'var(--text-secondary)', animation: 'heroTextFadeIn 1s 0.15s both' }}
        >
          {current.description}
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            className="rounded-full px-8 py-3.5 font-body text-[12px] font-semibold uppercase
                       tracking-[0.2em] transition-transform duration-200 hover:-translate-y-0.5"
            style={{ background: 'var(--gradient-brand)', color: 'var(--on-primary)' }}
          >
            View Our Work
          </button>
        </div>

        <HeroIndicators
          count={count}
          index={index}
          onSelect={setIndex}
          className="mt-8 justify-center"
        />
      </div>

      {/*
        Artwork sits in the remaining height and is allowed to bleed off the
        bottom: the cut-outs are full-length figures, and letting the feet run
        past the fold keeps them at a readable scale on a laptop.
      */}
      <div className="relative z-[5] mt-6 h-[46vh] w-full max-w-4xl sm:mt-8 sm:h-[52vh]">
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
              transform: i === index ? 'scale(1)' : 'scale(1.04)',
            }}
          />
        ))}
      </div>
    </section>
  );
}
