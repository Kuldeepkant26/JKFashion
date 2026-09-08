import { useLayoutStore } from '../../theme/useLayoutStore.js';
import FloatingPill from './FloatingPill.jsx';
import MinimalRule from './MinimalRule.jsx';
import CenteredLogo from './CenteredLogo.jsx';
import EdgeBar from './EdgeBar.jsx';

/**
 * Every navbar variant, keyed by the id stored server-side.
 *
 * Adding one is: build the component, add it here, and add an entry to
 * NAVBAR_VARIANTS in theme/layouts.js. The admin picker and the API allowlist
 * both read from that array, so nothing else needs touching.
 */
const NAVBAR_COMPONENTS = {
  'floating-pill': FloatingPill,
  'minimal-rule': MinimalRule,
  'centered-logo': CenteredLogo,
  'edge-bar': EdgeBar,
};

/**
 * Renders whichever navbar the owner selected.
 *
 * Falls back to the first variant rather than rendering nothing if the id is
 * unrecognised — a site with no navigation is a far worse failure than a site
 * wearing the wrong bar.
 */
export default function SiteNavbar() {
  const navbarId = useLayoutStore((s) => s.navbarId);
  const Navbar = NAVBAR_COMPONENTS[navbarId] ?? FloatingPill;

  return <Navbar />;
}
