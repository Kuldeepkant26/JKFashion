import { useHeroCarousel } from './useHeroCarousel.js';

/**
 * The site's original hero: copy left, cut-out right.
 *
 * Kept verbatim — markup, class names and all — so the layout that was tuned
 * over several rounds (matched gutters, the `contain` fit that stops the
 * cut-out being cropped, the lifted baseline) survives the move into a
 * variant. Its styling still lives in css/Home.css.
 */
export default function ClassicSplit() {
  const { images, slides, index, setIndex, current } = useHeroCarousel();

  return (
    <section className="home-hero-screenshot">
      <div className="home-hero-screenshot-content">
        <div className="home-hero-screenshot-left">
          <div className="home-hero-screenshot-tagline-wrapper">
            <p className="home-hero-screenshot-tagline">TIME TO MEET YOUR</p>
            <div className="home-hero-screenshot-line" />
          </div>

          <h1 className="home-hero-screenshot-title" id="hero-title">
            <span key={index} className="hero-title-text">
              {current.title}
            </span>
          </h1>

          <p className="home-hero-screenshot-description">
            <span key={`desc-${index}`} className="hero-description-text">
              {current.description}
            </span>
          </p>

          <button className="home-hero-screenshot-btn" type="button">
            View Our Work
          </button>
        </div>

        <div className="home-hero-screenshot-right">
          <div className="home-hero-screenshot-image-wrapper">
            {images.map((src, i) => (
              <img
                key={src}
                src={src}
                alt="Embroidered occasionwear from the JK Fashion range"
                /* Only the first is eager: the rest are behind a cross-fade. */
                loading={i === 0 ? 'eager' : 'lazy'}
                className={`home-hero-screenshot-image ${i === index ? 'active' : ''}`}
              />
            ))}

            <div className="hero-carousel-indicators">
              {slides.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`carousel-indicator ${i === index ? 'active' : ''}`}
                  onClick={() => setIndex(i)}
                  aria-label={`Go to slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
