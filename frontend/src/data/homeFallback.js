import { hero } from './images.js';

/**
 * What the hero shows when the API cannot be reached.
 *
 * It is the first thing on the page, so losing it to a network blip costs more
 * than showing slightly generic content. This mirrors the API's own shape and
 * the server-side defaults in backend/src/config/homeDefaults.ts — keep the two
 * in step.
 *
 * The image is a bundled asset rather than a URL, so the fallback needs no
 * network at all.
 */
export const HOME_FALLBACK = {
  hero: {
    eyebrow: 'TIME TO MEET YOUR',
    title: 'COLOUR & YARN',
    description:
      'Every base matched to your shade card — viscose, cotton and metallic yarns ' +
      'processed in-house so colour stays consistent from first sample to final bulk.',
    ctaLabel: 'View Our Work',
    image: {},
    imageAlt: 'Embroidered occasionwear from the JK Fashion range',
    /**
     * The bundled cut-out, used whenever no image has been uploaded. Kept
     * outside `image` so the variants never have to know whether the picture
     * came from Cloudinary or the bundle — see useHomeContentStore.
     */
    imageSrc: hero.showcase[2],
  },
};
