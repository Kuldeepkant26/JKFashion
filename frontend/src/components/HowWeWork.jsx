import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { FiPlay } from 'react-icons/fi';
import '../css/HowWeWork.css';
import * as processApi from '../api/process.api.js';
import { getProcessIcon } from '../data/processIcons.jsx';
import { PROCESS_FALLBACK } from '../data/processFallback.js';

/**
 * How We Work — one composed section, not three stacked blocks.
 *
 * The earlier version opened with a centred label/title/intro and then, with
 * nothing in between, a second centred heading for the photographs. Two
 * heading blocks back to back read as a mistake, because they are one: the
 * section announced itself twice before showing anything.
 *
 * So the parts are now interleaved rather than stacked. The header runs as an
 * asymmetric editorial masthead; the facility copy becomes a caption panel
 * sitting INSIDE the photo mosaic, which is where a caption belongs and which
 * removes the duplicate heading entirely; the stages are a numbered ledger
 * rather than a row of discs.
 *
 * All content is admin-editable (Settings → How We Work) and every field is
 * consumed exactly as before — this is a presentation change only. When the
 * API cannot be reached the section renders built-in content instead of
 * disappearing: it is the main account of how the company works, and a network
 * blip is a poor reason to remove it from the page.
 */

/* ========================================================================== */
/*  The floor — photographs, with the facility copy as their caption panel     */
/* ========================================================================== */

/**
 * A mosaic whose first cell is not a photograph but the facility copy.
 *
 * That placement is the fix for the double heading: `facilityHeading` still
 * renders, still comes from the API, but as the mosaic's own label rather than
 * as a second section title competing with the masthead above it. It is an h3
 * inside the panel, so the document outline stays correct.
 */
function FloorMosaic({ section, photos, variants, mediaVariants }) {
  if (!photos.length) return null;

  const hasCopy = Boolean(section.facilityHeading || section.facilityBody);

  return (
    <div className="hww-floor">
      <ul className="hww-mosaic">
        {hasCopy ? (
          <motion.li className="hww-mosaic-note" variants={variants}>
            <div className="hww-note-inner">
              <span className="hww-note-rule" aria-hidden="true" />
              {section.facilityHeading ? (
                <h3 className="hww-note-heading">{section.facilityHeading}</h3>
              ) : null}
              {section.facilityBody ? (
                <p className="hww-note-body">{section.facilityBody}</p>
              ) : null}
              <span className="hww-note-count" aria-hidden="true">
                {String(photos.length).padStart(2, '0')}
                <em>frames</em>
              </span>
            </div>
          </motion.li>
        ) : null}

        {photos.map((photo, index) => (
          <motion.li
            /* The first photograph runs tall so the grid has a focal point;
               everything after it falls into the standard cell. With the copy
               panel occupying a cell of its own the rhythm holds at any count. */
            className={`hww-frame ${index === 0 ? 'hww-frame-lead' : ''}`}
            key={photo._id}
            variants={mediaVariants}
          >
            <img
              src={photo.image.url}
              alt={photo.caption || 'Our factory and team'}
              loading="lazy"
              className="hww-frame-img"
            />
            {photo.caption ? (
              <span className="hww-frame-caption">
                <span className="hww-frame-caption-text">{photo.caption}</span>
              </span>
            ) : null}
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

/* ========================================================================== */
/*  The film                                                                  */
/* ========================================================================== */

/**
 * Media and copy on one shared baseline.
 *
 * Playback is click-to-start rather than autoplay — the footage carries sound,
 * and a video that starts talking on scroll is the single most reliable way to
 * make a visitor leave.
 */
function FilmPanel({ section, variants, mediaVariants }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);

  // Self-guarding rather than relying on the parent's check, so the component
  // cannot be made to dereference a missing url by a future caller.
  if (!section.video?.url) return null;

  const toggle = () => {
    const el = videoRef.current;
    if (!el) return;

    if (el.paused) {
      // play() rejects if the browser blocks it; without the catch that
      // surfaces as an unhandled rejection in the console.
      el.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      el.pause();
      setPlaying(false);
    }
  };

  return (
    <div className="hww-film">
      <motion.div className="hww-film-copy" variants={variants}>
        <span className="hww-film-tag" aria-hidden="true">Film</span>
        {section.videoHeading ? (
          <h3 className="hww-film-heading">{section.videoHeading}</h3>
        ) : null}
        {section.videoBody ? (
          <p className="hww-film-body">{section.videoBody}</p>
        ) : null}
      </motion.div>

      <motion.div className="hww-film-media" variants={mediaVariants}>
        <div className="hww-film-frame">
          <video
            ref={videoRef}
            className="hww-film-video"
            src={section.video.url}
            poster={section.videoPoster?.url || undefined}
            preload="metadata"
            playsInline
            controls={playing}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />

          {!playing ? (
            <button
              type="button"
              className="hww-film-play"
              onClick={toggle}
              aria-label="Play the factory walkthrough"
            >
              <span className="hww-film-play-icon">
                <FiPlay aria-hidden="true" />
              </span>
              <span className="hww-film-play-label">Watch the walkthrough</span>
            </button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}

/* ========================================================================== */
/*  The stages — a numbered ledger                                            */
/* ========================================================================== */

/**
 * Stages as rows rather than as a row of discs.
 *
 * A ledger scales where the old rail did not: five stages fitted its grid,
 * eight did not, and the connecting line had to be re-pinned at every
 * breakpoint to stay on the badges. Rows simply continue, so the admin can add
 * or remove stages without anyone revisiting the CSS.
 */
function StageLedger({ steps, heading, variants }) {
  if (!steps.length) return null;

  return (
    <div className="hww-stages">
      {heading ? (
        <motion.div className="hww-stages-head" variants={variants}>
          <h3 className="hww-stages-heading">{heading}</h3>
          <span className="hww-stages-meta" aria-hidden="true">
            {String(steps.length).padStart(2, '0')} stages
          </span>
        </motion.div>
      ) : null}

      <ol className="hww-ledger">
        {steps.map((stage, index) => {
          const Icon = getProcessIcon(stage.icon);

          return (
            <motion.li className="hww-row" key={stage._id} variants={variants}>
              {/* Decorative: the row is already ordered by the <ol>, so the
                  numeral is presentation and must not be read out twice. */}
              <span className="hww-row-index" aria-hidden="true">
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className="hww-row-icon" aria-hidden="true">
                <Icon />
              </span>

              <div className="hww-row-copy">
                <h4 className="hww-row-title">{stage.title}</h4>
                {stage.summary ? (
                  <p className="hww-row-summary">{stage.summary}</p>
                ) : null}
              </div>

              {stage.description ? (
                <p className="hww-row-description">{stage.description}</p>
              ) : null}

              <span className="hww-row-glow" aria-hidden="true" />
            </motion.li>
          );
        })}
      </ol>
    </div>
  );
}

/* ========================================================================== */

/** The navbar scrolls here. Exported so the link and the target cannot drift. */
export const PROCESS_SECTION_ID = 'our-process';

const HowWeWork = () => {
  const reduceMotion = useReducedMotion();

  /*
   * Seeded with the fallback rather than null, so the section is complete on
   * first paint and simply sharpens into the live content when it arrives —
   * no empty frame, and no layout shift from a section appearing late.
   */
  const [section, setSection] = useState(PROCESS_FALLBACK);

  const { ref, inView } = useInView({ threshold: 0.05, triggerOnce: true });

  useEffect(() => {
    let cancelled = false;

    processApi
      .get()
      .then((data) => {
        if (cancelled || !data) return;

        /*
         * Merge rather than replace. A section whose steps have all been
         * hidden would otherwise render an empty flow; falling back per-part
         * keeps the page honest about what the company does.
         */
        setSection({
          ...PROCESS_FALLBACK,
          ...data,
          steps: data.steps?.length ? data.steps : PROCESS_FALLBACK.steps,
          facilityPhotos: data.facilityPhotos?.length
            ? data.facilityPhotos
            : PROCESS_FALLBACK.facilityPhotos,
        });
      })
      .catch((error) => {
        // Keep the fallback on screen. Logged rather than surfaced: this is
        // marketing content, and a visitor can do nothing with the error.
        console.warn('How We Work: using built-in content —', error?.message ?? error);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const containerVariants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: reduceMotion ? 0 : 0.08, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: reduceMotion ? 0 : 0.75, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const mediaVariants = {
    hidden: { opacity: 0, scale: reduceMotion ? 1 : 0.96 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: reduceMotion ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const steps = section.steps ?? [];
  const photos = (section.facilityPhotos ?? []).filter((p) => p.image?.url);
  const hasVideo = section.videoEnabled && Boolean(section.video?.url);
  const showFacility = section.facilityEnabled && photos.length > 0;

  return (
    <section id={PROCESS_SECTION_ID} className="hww-section" aria-labelledby="hww-title">
      {/* Decorative field behind the masthead — keeps the section from
          starting on a hard flat edge without adding a divider rule. */}
      <span className="hww-aura" aria-hidden="true" />

      <motion.div
        className="hww-container"
        ref={ref}
        variants={containerVariants}
        initial="hidden"
        animate={inView ? 'visible' : 'hidden'}
      >
        <header className="hww-masthead">
          <motion.div className="hww-masthead-lead" variants={itemVariants}>
            {section.label ? (
              <p className="hww-label">
                <span className="hww-label-rule" aria-hidden="true" />
                {section.label}
              </p>
            ) : null}
            {section.title ? (
              <h2 className="hww-title" id="hww-title">
                {section.title}
              </h2>
            ) : null}
          </motion.div>

          {section.intro ? (
            <motion.div className="hww-masthead-aside" variants={itemVariants}>
              <p className="hww-intro">{section.intro}</p>
            </motion.div>
          ) : null}
        </header>

        {showFacility ? (
          <FloorMosaic
            section={section}
            photos={photos}
            variants={itemVariants}
            mediaVariants={mediaVariants}
          />
        ) : null}

        <StageLedger
          steps={steps}
          heading={section.stepsHeading}
          variants={itemVariants}
        />

        {hasVideo ? (
          <FilmPanel
            section={section}
            variants={itemVariants}
            mediaVariants={mediaVariants}
          />
        ) : null}
      </motion.div>
    </section>
  );
};

export default HowWeWork;
