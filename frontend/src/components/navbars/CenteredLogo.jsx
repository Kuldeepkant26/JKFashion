import { Link } from 'react-router-dom';
import { NAV_LINKS, useNavScroll, useMobileMenu, useActiveSection } from './useNavbar.js';
import SectionLink from './SectionLink.jsx';
import MobileMenu from './MobileMenu.jsx';
import MenuButton from './MenuButton.jsx';
import { company } from '../../data/site.js';
import logo from '../../assets/jk-fashion-logo.png';

/**
 * A fashion masthead: logo centred, links split either side of it.
 *
 * The three destinations divide 2/1, so the right side is padded with the
 * enquiry link to keep the logo optically centred rather than drifting.
 *
 * Below `lg` this collapses to the ordinary logo-left arrangement — a centred
 * mark with a menu button beside it looks accidental on a narrow screen.
 */
export default function CenteredLogo() {
  const menu = useMobileMenu();
  const activeId = useActiveSection();
  const { scrolled, hidden } = useNavScroll({ menuOpen: menu.open });

  const [first, ...rest] = NAV_LINKS;

  const linkClass =
    'group relative py-1 font-body text-[12px] font-semibold uppercase tracking-[0.22em] ' +
    'transition-colors duration-200';

  const linkStyle = ({ isActive }) => ({
    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
  });

  const Underline = ({ active }) => (
    <span
      aria-hidden
      className={`absolute -bottom-0.5 left-0 h-px w-full origin-left transition-transform
                  duration-300 ease-out
                  ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'}`}
      style={{ background: 'var(--brand-primary)' }}
    />
  );

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[9999] transition-all duration-500 ease-out
                    ${hidden ? '-translate-y-full' : 'translate-y-0'}`}
        style={{
          background: scrolled
            ? 'color-mix(in oklab, var(--surface-primary) 92%, transparent)'
            : 'color-mix(in oklab, var(--surface-primary) 55%, transparent)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderBottom: scrolled ? '1px solid var(--navbar-glass-border)' : '1px solid transparent',
        }}
      >
        {/* ------------------------------------------------ desktop: centred */}
        <div className="mx-auto hidden max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center
                        gap-8 px-10 py-4 lg:grid">
          <nav className="flex items-center justify-end gap-9">
            <SectionLink
              id={first.id}
              isActive={activeId === first.id}
              className={linkClass}
              style={linkStyle}
            >
              {({ isActive }) => (
                <>
                  {first.label}
                  <Underline active={isActive} />
                </>
              )}
            </SectionLink>
          </nav>

          <Link to="/" className="flex justify-center" aria-label={company.name}>
            <img
              src={logo}
              alt={company.name}
              className="h-10 w-auto object-contain transition-transform duration-300
                         hover:scale-[1.04]"
            />
          </Link>

          <nav className="flex items-center justify-start gap-9">
            {rest.map((link) => (
              <SectionLink
                key={link.label}
                id={link.id}
                isActive={activeId === link.id}
                className={linkClass}
                style={linkStyle}
              >
                {({ isActive }) => (
                  <>
                    {link.label}
                    <Underline active={isActive} />
                  </>
                )}
              </SectionLink>
            ))}
          </nav>
        </div>

        {/* ------------------------------------------------- mobile: logo left */}
        <div className="flex items-center justify-between px-6 py-3.5 lg:hidden">
          <Link to="/" className="flex shrink-0 items-center" aria-label={company.name}>
            <img src={logo} alt={company.name} className="h-8 w-auto object-contain" />
          </Link>
          <MenuButton open={menu.open} onClick={menu.toggle} />
        </div>
      </header>

      <MobileMenu open={menu.open} onClose={menu.close} />
    </>
  );
}
