import { useEffect, useState } from 'react';
import { hero } from '../../data/images.js';

/**
 * The hero's copy. Shared by every variant so the message does not depend on
 * which layout the owner picked.
 */
export const HERO_SLIDES = [
  {
    title: "WOMEN'S WEAR",
    description:
      'Schiffli-embroidered cotton and eyelet, cut into the dresses and separates our buyers build their season around — sampled to your reference and produced to the metre.',
  },
  {
    title: "MEN'S WEAR",
    description:
      'Tonal thread-work on breathable cotton, engineered for kurtas and shirting that hold their finish through a full production run.',
  },
  {
    title: 'COLOUR & YARN',
    description:
      'Every base matched to your shade card — viscose, cotton and metallic yarns processed in-house so colour stays consistent from first sample to final bulk.',
  },
  {
    title: 'BULK CAPACITY',
    description:
      'Sampling through to full production under one roof, across the whole colour range — predictable lead times and goods that ship when we say they will.',
  },
];

const INTERVAL_MS = 5000;

/**
 * One index drives both the copy and the artwork: they are two halves of the
 * same slide, so they have to advance on the same tick. The rotation is bounded
 * by the shorter of the two lists, so a mismatch degrades to fewer slides
 * rather than an undefined read.
 */
export const useHeroCarousel = () => {
  const images = hero.showcase;
  const slides = Math.min(HERO_SLIDES.length, images.length);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setIndex((p) => (p + 1) % slides), INTERVAL_MS);
    return () => clearInterval(timer);
  }, [slides]);

  return {
    images,
    slides: HERO_SLIDES,
    index,
    setIndex,
    count: slides,
    current: HERO_SLIDES[index] ?? HERO_SLIDES[0],
  };
};
