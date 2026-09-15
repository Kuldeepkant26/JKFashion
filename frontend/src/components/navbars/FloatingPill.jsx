import { Link } from 'react-router-dom';
import { NAV_LINKS, useNavScroll, useMobileMenu, useActiveSection } from './useNavbar.js';
import SectionLink from './SectionLink.jsx';
import MobileMenu from './MobileMenu.jsx';
import MenuButton from './MenuButton.jsx';
import EnquireLink from './EnquireLink.jsx';
import { company } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

/**
 * A capsule that floats clear of the page edge.
 *
 * The bar sits ON the hero rather than above it, so the artwork runs to the
 * top of the viewport. That only reads well while the capsule stays visually
 * light — hence the blur and the restrained shadow, which firm up on scroll
 * once there is real content behind it.
 */
export default function FloatingPill() {
  const menu = useMobileMenu();
  const activeId = useActiveSection();
  const { scrolled, hidden } = useNavScroll({ menuOpen: menu.open });

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[9999] px-4 pt-3 transition-transform duration-500
                    ease-out sm:px-6 sm:pt-5
                    ${hidden ? '-translate-y-[140%]' : 'translate-y-0'}`}
      >
        <div
          className={`mx-auto flex max-w-5xl items-center justify-between gap-4 rounded-full
                      py-2.5 pl-5 pr-2.5 backdrop-blur-xl transition-all duration-300
                      ${scrolled ? 'shadow-lg' : 'shadow-md'}`}
          style={{
            background: scrolled
              ? 'color-mix(in oklab, var(--surface-primary) 88%, transparent)'
              : 'color-mix(in oklab, var(--surface-primary) 72%, transparent)',
            border: '1px solid var(--navbar-glass-border)',
          }}
        >
          <Link to="/" className="flex shrink-0 items-center" aria-label={company.name}>
            <img src={logo} alt={company.name} className="h-8 w-auto object-contain sm:h-9" />
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {NAV_LINKS.map((link) => (
              <SectionLink
                key={link.label}
                id={link.id}
                isActive={activeId === link.id}
                className={({ isActive }) =>
                  `relative rounded-full px-4 py-2 font-body text-[13px] font-semibold
                   uppercase tracking-[0.14em] transition-colors duration-200
                   ${isActive ? '' : 'hover:opacity-100'}`
                }
                style={({ isActive }) => ({
                  color: isActive ? 'var(--on-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--brand-primary)' : 'transparent',
                })}
              >
                {link.label}
              </SectionLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <EnquireLink
              className="hidden rounded-full px-5 py-2.5 font-body text-[13px] font-semibold
                         uppercase tracking-[0.14em] transition-transform duration-200
                         hover:-translate-y-px lg:block"
              style={{ background: 'var(--gradient-brand)', color: 'var(--on-primary)' }}
            />

            <MenuButton open={menu.open} onClick={menu.toggle} />
          </div>
        </div>
      </header>

      <MobileMenu open={menu.open} onClose={menu.close} />
    </>
  );
}
