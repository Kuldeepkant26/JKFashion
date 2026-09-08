import { useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ROUTES } from '../../constants/routePaths.js';
import { ENQUIRY_SECTION_ID } from '../EnquirySection.jsx';

/**
 * The Enquire button, shared by every navbar variant.
 *
 * Scrolling to the section is not a plain `<a href="#enquiry">` for two
 * reasons: the section lives on the home page, so from About or Products this
 * has to navigate first and scroll once the page exists; and on desktop the
 * home page scrolls an INNER container rather than the window, so the browser's
 * own anchor jump lands nowhere. `scrollIntoView` walks up to whatever the real
 * scrolling ancestor is, which handles both cases.
 */
export default function EnquireLink({ className, style, children = 'Enquire', onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();

  const go = useCallback(
    (e) => {
      e.preventDefault();
      onNavigate?.();

      const scrollToSection = () => {
        const el = document.getElementById(ENQUIRY_SECTION_ID);
        if (!el) return false;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return true;
      };

      if (location.pathname === ROUTES.HOME) {
        scrollToSection();
        return;
      }

      navigate(ROUTES.HOME);

      /*
       * The section does not exist until the home route has rendered. Poll a
       * few frames rather than guessing a delay — the home page is lazy in
       * places and a fixed timeout is either too short on a slow device or a
       * visible pause on a fast one.
       */
      let attempts = 0;
      const tryScroll = () => {
        if (scrollToSection() || attempts > 40) return;
        attempts += 1;
        requestAnimationFrame(tryScroll);
      };
      requestAnimationFrame(tryScroll);
    },
    [location.pathname, navigate, onNavigate]
  );

  return (
    <a href={`/#${ENQUIRY_SECTION_ID}`} onClick={go} className={className} style={style}>
      {children}
    </a>
  );
}
