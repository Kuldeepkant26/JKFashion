import { useHeroContent } from './useHeroContent.js';

/**
 * The site's original hero: copy left, cut-out right.
 *
 * Kept verbatim — markup, class names and all — so the layout that was tuned
 * over several rounds (matched gutters, the `contain` fit that stops the
 * cut-out being cropped, the lifted baseline) survives the move into a
 * variant. Its styling still lives in css/Home.css.
 */
export default function ClassicSplit() {
  const { eyebrow, title, description, ctaLabel, imageSrc, imageAlt } = useHeroContent();

  return (
    <section className="home-hero-screenshot">
      <div className="home-hero-screenshot-content">
        <div className="home-hero-screenshot-left">
          <div className="home-hero-screenshot-tagline-wrapper">
            <p className="home-hero-screenshot-tagline">{eyebrow}</p>
            <div className="home-hero-screenshot-line" />
          </div>

          <h1 className="home-hero-screenshot-title" id="hero-title">
            <span className="hero-title-text">{title}</span>
          </h1>

          <p className="home-hero-screenshot-description">
            <span className="hero-description-text">{description}</span>
          </p>

          <button className="home-hero-screenshot-btn" type="button">
            {ctaLabel}
          </button>
        </div>

        <div className="home-hero-screenshot-right">
          <div className="home-hero-screenshot-image-wrapper">
            {/*
              `active` is load-bearing, not left over from the carousel: the
              base rule keeps these images at opacity 0 so they can cross-fade,
              and only this class reveals one. Dropping it hides the artwork.
            */}
            <img
              src={imageSrc}
              alt={imageAlt}
              loading="eager"
              className="home-hero-screenshot-image active"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
