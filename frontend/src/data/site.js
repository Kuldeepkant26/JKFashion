/**
 * Single source of truth for JK Fashion's business details.
 *
 * Values marked TODO are placeholders — replace them with the client's real
 * details when they arrive. Everything on the site reads from here, so one
 * edit updates every page.
 */

export const company = {
  name: 'JK Fashion',
  shortName: 'JK',
  tagline: 'Crafted. Precise. Enduring.',
  established: 1998,             // TODO confirm with client
  yearsExperience: 25,           // TODO confirm with client
};

export const contact = {
  email: 'info@jkfashion.com',      // TODO confirm
  salesEmail: 'sales@jkfashion.com', // TODO confirm
  phone: '+91 98765 43210',                   // TODO confirm
  phoneHref: '+919876543210',                 // TODO confirm
  whatsapp: '919876543210',                   // TODO confirm
  address: 'Surat, Gujarat, India',           // TODO confirm
  addressFull: 'Surat, Gujarat 395006, India', // TODO confirm
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
