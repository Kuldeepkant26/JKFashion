import { useSectionScroll } from './useSectionScroll.js';

/**
 * A navbar link that scrolls to a section instead of navigating.
 *
 * The site is one page, so every destination is a place on it. Rendered as a
 * real anchor with a `#id` href rather than a button: it stays middle-clickable
 * and copyable, and a browser without JavaScript still lands in the right
 * place.
 *
 * `className` and `style` accept a function of `{ isActive }`, mirroring
 * NavLink's API so the variants' existing styling works unchanged.
 */
export default function SectionLink({
  id,
  isActive = false,
  className,
  style,
  onNavigate,
  children,
}) {
  const scroll = useSectionScroll(id, { onNavigate });

  const resolve = (value) => (typeof value === 'function' ? value({ isActive }) : value);

  return (
    <a
      href={id ? `#${id}` : '#top'}
      onClick={scroll}
      aria-current={isActive ? 'page' : undefined}
      className={resolve(className)}
      style={resolve(style)}
    >
      {typeof children === 'function' ? children({ isActive }) : children}
    </a>
  );
}
