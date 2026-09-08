import { Link, NavLink } from 'react-router-dom';
import { NAV_LINKS, useNavScroll, useMobileMenu } from './useNavbar.js';
import MobileMenu from './MobileMenu.jsx';
import MenuButton from './MenuButton.jsx';
import EnquireLink from './EnquireLink.jsx';
import { company } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

/**
 * The quietest variant: wide letter-spacing over a hairline rule.
 *
 * No fill and no shadow until you scroll — at the top of the page the only
 * structure is the rule itself, which lets the hero carry the composition.
 * Suits the pale, product-led palettes where a solid bar would sit heavily.
 */
export default function MinimalRule() {
  const menu = useMobileMenu();
  const { scrolled, hidden } = useNavScroll({ menuOpen: menu.open });

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[9999] transition-all duration-500 ease-out
                    ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
        style={{
          background: scrolled
            ? 'color-mix(in oklab, var(--surface-primary) 92%, transparent)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: `1px solid ${
            scrolled ? 'var(--navbar-glass-border)' : 'color-mix(in oklab, var(--brand-ink) 10%, transparent)'
          }`,
        }}
      >
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6 py-4 sm:px-10">
          <Link to="/" className="flex shrink-0 items-center" aria-label={company.name}>
            <img src={logo} alt={company.name} className="h-8 w-auto object-contain sm:h-9" />
          </Link>

          <nav className="hidden items-center gap-10 lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className="group relative py-1 font-body text-[12px] font-medium uppercase
                           tracking-[0.28em] transition-colors duration-200"
                style={({ isActive }) => ({
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                })}
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    {/* Wipes in from the left on hover, stays put when active. */}
                    <span
                      aria-hidden
                      className={`absolute -bottom-0.5 left-0 h-px w-full origin-left
                                  transition-transform duration-300 ease-out
                                  ${isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
                      style={{ background: 'var(--brand-primary)' }}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <EnquireLink
              className="hidden font-body text-[12px] font-semibold uppercase tracking-[0.28em]
                         transition-opacity duration-200 hover:opacity-70 lg:block"
              style={{ color: 'var(--brand-primary)' }}
            />
            <MenuButton open={menu.open} onClick={menu.toggle} />
          </div>
        </div>
      </header>

      <MobileMenu open={menu.open} onClose={menu.close} />
    </>
  );
}
