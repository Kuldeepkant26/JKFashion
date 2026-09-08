import { useLayoutStore } from '../../theme/useLayoutStore.js';
import ClassicSplit from './ClassicSplit.jsx';
import CentreStage from './CentreStage.jsx';
import FullBleed from './FullBleed.jsx';
import Editorial from './Editorial.jsx';

/**
 * Every hero variant, keyed by the id stored server-side.
 *
 * Adding one is: build the component, add it here, and add an entry to
 * HERO_VARIANTS in theme/layouts.js.
 */
const HERO_COMPONENTS = {
  'classic-split': ClassicSplit,
  'centre-stage': CentreStage,
  'full-bleed': FullBleed,
  editorial: Editorial,
};

/**
 * Renders whichever hero the owner selected, falling back to the original
 * layout rather than rendering nothing on an unrecognised id.
 */
export default function SiteHero() {
  const heroId = useLayoutStore((s) => s.heroId);
  const Hero = HERO_COMPONENTS[heroId] ?? ClassicSplit;

  return <Hero />;
}
