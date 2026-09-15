import { ENQUIRY_SECTION_ID } from '../EnquirySection.jsx';
import SectionLink from './SectionLink.jsx';

/**
 * The Enquire button, shared by every navbar variant.
 *
 * Now that the site is a single page this is an ordinary section link; the
 * navigate-then-poll dance it used to do existed only to reach the enquiry
 * form from About or Products, and both are gone.
 */
export default function EnquireLink({ className, style, children = 'Enquire', onNavigate }) {
  return (
    <SectionLink
      id={ENQUIRY_SECTION_ID}
      className={className}
      style={style}
      onNavigate={onNavigate}
    >
      {children}
    </SectionLink>
  );
}
