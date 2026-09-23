/**
 * JK Fashion's build-time business details.
 *
 * Values marked TODO are placeholders — replace them with the client's real
 * details when they arrive.
 *
 * Anything the owner must be able to change without a redeploy does not belong
 * here: it is served by the API and edited in the admin panel. See `contact`
 * below.
 */

export const company = {
  name: 'JK Fashion',
  shortName: 'JK',
  tagline: 'Crafted. Precise. Enduring.',
  established: 1998,             // TODO confirm with client
  yearsExperience: 25,           // TODO confirm with client
};

/**
 * Contact details are NOT here.
 *
 * The phone number, address and email are owner-editable in the admin panel
 * (Settings → Hero Content), so they live server-side and are read through
 * `useHomeContentStore`. Hard-coding them here again would give the site two
 * sources of truth, and the stale one always wins somewhere.
 *
 * The built-in values used when the API is unreachable are in
 * `data/homeFallback.js`; the link helpers are in `utils/contactLinks.js`.
 */
export const contact = {
  hours: 'Mon – Sat, 9:30 am – 6:30 pm IST',
  responseTime: "We'll get back to you within 24 working hours.",
};

export const social = {
  instagram: 'https://instagram.com',  // TODO confirm
  facebook: 'https://facebook.com',    // TODO confirm
  linkedin: 'https://linkedin.com',    // TODO confirm
};

export const stats = [
  { value: 25,      suffix: '+', label: 'Years in Embroidery' },
  { value: 40,      suffix: '+', label: 'Embroidery Machines' },
  { value: 60000,   suffix: '+', label: 'Sq. Ft. Manufacturing' },
  { value: 2000000, suffix: '+', label: 'Stitches Per Day' },
];

export default { company, contact, social, stats };
