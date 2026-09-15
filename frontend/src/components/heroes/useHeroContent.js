import { useHomeContentStore } from '../../theme/useHomeContentStore.js';

/**
 * The hero's copy and artwork, for whichever variant is rendering.
 *
 * One fixed message rather than a rotation. The section is the first thing a
 * buyer reads, and a headline that changes under them while they are reading it
 * costs more than the extra messages ever bought — the other three are better
 * served by the sections further down the page, which can be read at will.
 *
 * Shared by every variant so the message does not depend on which layout the
 * owner picked. The store is seeded with the built-in fallback, so this never
 * returns a half-built object and the variants need no loading state.
 */
export const useHeroContent = () => useHomeContentStore((s) => s.hero);
