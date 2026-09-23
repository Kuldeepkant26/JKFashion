/**
 * Link targets derived from the owner's phone number.
 *
 * The number is stored exactly as it is typed in the admin panel, because that
 * is what visitors read — "9810014413" or "+91 98765 43210" are both valid to
 * display. Links cannot use it as-is, so the punctuation is stripped here, in
 * one place, rather than in each component that renders a number.
 *
 * Deriving beats storing: a second saved field for the dialable form would
 * drift out of step with the displayed one the first time the owner edited
 * only one of them.
 */

/** Digits and a leading +, which is all `tel:` should carry. */
export const telHref = (phone) => {
  const cleaned = String(phone ?? '').replace(/[^\d+]/g, '');
  return cleaned ? `tel:${cleaned}` : '';
};

/**
 * wa.me wants digits only, with a country code and no +.
 *
 * A number typed the way it is said aloud has no country code, and wa.me
 * resolves such a link to nothing — so a bare ten-digit number is assumed to
 * be Indian and gets 91 prefixed. A leading trunk 0 is dropped first, because
 * "098100 14413" is the same number written the way a landline is dialled.
 *
 * Anything longer is left exactly as typed: it already carries a country code,
 * and guessing at that point would break every non-Indian number.
 */
export const whatsappHref = (phone) => {
  const digits = String(phone ?? '')
    .replace(/\D/g, '')
    .replace(/^0+/, '');

  if (!digits) return '';
  const withCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCode}`;
};
