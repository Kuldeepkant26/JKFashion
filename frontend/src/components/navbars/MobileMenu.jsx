import { NAV_LINKS } from './useNavbar.js';
import SectionLink from './SectionLink.jsx';
import EnquireLink from './EnquireLink.jsx';
import { company, contact } from '../../data/site.js';

/**
 * The mobile navigation, shared by every navbar variant.
 *
 * A full-screen overlay rather than a side drawer: with only three
 * destinations a drawer spends most of its width on empty space, and the
 * overlay lets the links be set at a size that actually looks considered.
 *
 * Rendered (not unmounted) when closed so the fade can play in both
 * directions; `inert` keeps it out of the tab order and off screen readers
 * while it is invisible, which `hidden` alone would not allow us to animate.
 */
export default function MobileMenu({ open, onClose }) {
  return (
    <div
      id="site-mobile-menu"
      inert={open ? undefined : ''}
      aria-hidden={!open}
      /* Above the navbar (9999), not below it: the overlay carries its own
         logo and close button, so a bar showing through the top would be a
         duplicate of what the panel already provides. */
      className={`fixed inset-0 z-[10000] flex flex-col lg:hidden
                  transition-opacity duration-300 ease-out
                  ${open ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      style={{ background: 'var(--surface-primary)' }}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <span
          className="font-display text-lg font-bold"
          style={{ color: 'var(--text-primary)' }}
        >
          {company.name}
        </span>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="grid h-11 w-11 place-items-center rounded-full transition-colors"
          style={{ color: 'var(--text-primary)' }}
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
            <path
              d="M7 7l10 10M17 7L7 17"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>

      <nav className="flex flex-1 flex-col items-center justify-center gap-2 px-6">
        {NAV_LINKS.map((link, i) => (
          <SectionLink
            key={link.label}
            id={link.id}
            onNavigate={onClose}
            /* Staggered only while opening — on the way out they should all
               leave together rather than trailing one after another. */
            style={{
              transitionDelay: open ? `${80 + i * 60}ms` : '0ms',
              color: 'var(--text-primary)',
            }}
            className={`font-display text-4xl font-bold tracking-tight transition-all duration-500
                        sm:text-5xl ${open ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'}`}
          >
            {({ isActive }) => (
              <span className="relative block px-2 py-3">
                {link.label}
                <span
                  aria-hidden
                  className={`absolute inset-x-2 bottom-1.5 h-px origin-left transition-transform
                              duration-300 ${isActive ? 'scale-x-100' : 'scale-x-0'}`}
                  style={{ background: 'var(--brand-primary)' }}
                />
              </span>
            )}
          </SectionLink>
        ))}
        {/* Same destination as the desktop button; closing the menu first is
            what lets the scroll actually happen behind it. */}
        <EnquireLink
          onNavigate={onClose}
          className="mt-6 rounded-full px-8 py-3.5 font-body text-[12px] font-semibold
                     uppercase tracking-[0.2em] transition-transform duration-200"
          style={{ background: 'var(--gradient-brand)', color: 'var(--on-primary)' }}
        />
      </nav>

      <div
        className="px-6 pb-10 text-center font-body text-sm"
        style={{ color: 'var(--text-secondary)' }}
      >
        <a href={`mailto:${contact.email}`} className="block py-1">
          {contact.email}
        </a>
        <a href={`tel:${contact.phone.replace(/\s/g, '')}`} className="block py-1">
          {contact.phone}
        </a>
      </div>
    </div>
  );
}
