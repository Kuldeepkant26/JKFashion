import { Link, NavLink } from 'react-router-dom';
import { NAV_LINKS, useNavScroll, useMobileMenu } from './useNavbar.js';
import MobileMenu from './MobileMenu.jsx';
import MenuButton from './MenuButton.jsx';
import EnquireLink from './EnquireLink.jsx';
import { company, contact } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

/**
 * The most substantial of the four: a solid bar flush to the top, carrying a
 * slim contact strip above it.
 *
 * Aimed at the trade side of the site — a buyer looking for a phone number
 * finds it without scrolling, which the lighter variants deliberately do not
 * offer. The strip is desktop-only; on a phone it would eat a third of the
 * visible hero.
 */
export default function EdgeBar() {
  const menu = useMobileMenu();
  const { scrolled, hidden } = useNavScroll({ menuOpen: menu.open });

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[9999] transition-transform duration-500 ease-out
                    ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
      >
        {/* trade strip — collapses to nothing once scrolled, so the bar slims down */}
        <div
          className="hidden overflow-hidden transition-all duration-500 ease-out lg:block"
          style={{
            background: 'var(--brand-secondary)',
            height: scrolled ? 0 : 36,
            opacity: scrolled ? 0 : 1,
          }}
        >
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-10
                          font-body text-[11px] uppercase tracking-[0.2em]"
               style={{ color: 'color-mix(in oklab, var(--surface-primary) 85%, transparent)',
                        lineHeight: '36px' }}>
            <span>{company.tagline}</span>
            <span className="flex items-center gap-6">
              <a href={`mailto:${contact.email}`} className="transition-opacity hover:opacity-70">
                {contact.email}
              </a>
              <a
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="transition-opacity hover:opacity-70"
              >
                {contact.phone}
              </a>
            </span>
          </div>
        </div>

        <div
          className="transition-shadow duration-300"
          style={{
            background: 'color-mix(in oklab, var(--surface-primary) 95%, transparent)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--navbar-glass-border)',
            boxShadow: scrolled ? '0 4px 24px var(--navbar-glass-shadow)' : 'none',
          }}
        >
          <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-6 px-6
                          py-3 sm:px-10">
            <Link to="/" className="flex shrink-0 items-center" aria-label={company.name}>
              <img src={logo} alt={company.name} className="h-9 w-auto object-contain" />
            </Link>

            <nav className="hidden h-full items-stretch gap-8 lg:flex">
              {NAV_LINKS.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="group relative flex items-center font-body text-[12px] font-semibold
                             uppercase tracking-[0.2em] transition-colors duration-200"
                  style={({ isActive }) => ({
                    color: isActive ? 'var(--brand-primary)' : 'var(--text-secondary)',
                  })}
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      {/* Sits on the bar's own bottom edge, so it reads as a tab. */}
                      <span
                        aria-hidden
                        className={`absolute -bottom-[13px] left-0 h-[2px] w-full origin-center
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
                className="hidden px-6 py-2.5 font-body text-[12px] font-semibold uppercase
                           tracking-[0.2em] transition-opacity duration-200 hover:opacity-85 lg:block"
                style={{ background: 'var(--brand-primary)', color: 'var(--on-primary)' }}
              />
              <MenuButton open={menu.open} onClick={menu.toggle} />
            </div>
          </div>
        </div>
      </header>

      <MobileMenu open={menu.open} onClose={menu.close} />
    </>
  );
}
