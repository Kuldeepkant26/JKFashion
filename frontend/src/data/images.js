/**
 * Central image library for JK Fashion.
 *
 * All photography on the site is referenced from here so it can be swapped in
 * one place. These are free-licence Unsplash placeholders chosen to match the
 * textile / embroidery / manufacturing subject matter.
 *
 * TO REPLACE WITH THE CLIENT'S OWN PHOTOS:
 *   1. Drop the files into `src/assets/`
 *   2. `import myPhoto from '../assets/my-photo.jpg'` at the top of this file
 *   3. Swap the URL string below for `myPhoto`
 * Nothing else in the codebase needs to change.
 */

const u = (id, w = 1200) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// ---------------------------------------------------------------- hero
/**
 * The four client photographs, served from `public/` and referenced by URL
 * path (Vite copies public/ through to the build unchanged).
 *
 * These point at the `-full.jpg` variants from scripts/gen-images.mjs, NOT the
 * originals: the source PNGs are ~2.5MB each and nothing on the site displays
 * them larger than the 1400px variant. The .png originals stay in public/ as
 * the masters the variants are regenerated from.
 *
 * `loom` and `threads` are kept for the retired AboutUs and InteriorShowcase
 * components, which are no longer rendered on any page; they point at client
 * photography rather than stock.
 */
export const hero = {
  /*
   * The hero cut-outs, in slide order.
   *
   * Each is the client's HeroSection<n>.png with its checkerboard keyed out.
   * That checkerboard was painted into the pixels rather than being real
   * transparency (the sources are RGB, no alpha channel), so it would have
   * rendered as a grey grid on the page. `scripts/keyout.py` removes it and
   * quantises the result to 256 colours: ~2.5MB each -> ~350-430KB, with the
   * alpha the layout needs. Re-run it when new artwork lands.
   */
  showcase: [
    '/HeroSection1-cutout.png',
    '/HeroSection3-cutout.png',
    '/HeroSection4-cutout.png',
  ],

  // Still used by the rack, About and the interior sections.
  womensWear:  '/jk_fashion_img1-full.jpg', // model, white eyelet dress
  mensWear:    '/jk_fashion2-full.jpg',     // model, embroidered kurta
  mensRange:   '/Men_Febric-full.jpg',      // kurta rack, full colour range
  womensRange: '/Women_febric-full.jpg',    // dress rack, full colour range

  // Aliases used elsewhere on the site.
  loom:    '/Men_Febric-full.jpg',
  threads: '/Women_febric-full.jpg',
};

// ------------------------------------------------------------- products
export const products = {
  // Client photograph. Served from `public/`, so it is referenced by URL path
  // rather than imported — Vite copies public/ through to the build as-is.
  schiffliFabric: '/jk_fashion_img1-full.jpg',
  cottonLace:     u('1605518216938-7c31b7b14ad0'),
  crochetLace:    u('1618354691373-d851c5c3a990'),
  gpoLace:        u('1544441893-675973e31985'),
  bridalLace:     u('1595777457583-95e059d581b8'),
  embroideredNet: u('1583846717393-dc2412c95ed7'),
  silkCoolYarn:   u('1490481651871-ab68de25d43d'),
  viscoseHosiery: u('1558618666-fcd25c85cd64'),
};

// -------------------------------------------------------------- process
export const process = {
  design:     u('1558655146-9f40138edfeb'), // design / punching on screen
  production: u('1489987707025-afc232f7ea0f'), // machines running
  checking:   u('1528938102132-4a9276b8e320'), // inspection
  finishing:  u('1581091226825-a6a2a5aee158'), // shearing / finishing
  dispatch:   u('1553413077-190dd305871c'), // packed goods
};

// -------------------------------------------------------------- gallery
export const gallery = [
  u('1605518216938-7c31b7b14ad0'),
  u('1620799140408-edc6dcb6d633'),
  u('1618354691373-d851c5c3a990'),
  u('1544441893-675973e31985'),
  u('1595777457583-95e059d581b8'),
  u('1583846717393-dc2412c95ed7'),
  u('1591195853828-11db59a44f6b'),
  u('1524578271613-d550eacf6090'),
  u('1490481651871-ab68de25d43d'),
  u('1558618666-fcd25c85cd64'),
  u('1528938102132-4a9276b8e320'),
  u('1567401893414-76b7b1e5a7a5'),
];

// ------------------------------------------------------------ facility
export const facility = {
  unitOne:   u('1581091226825-a6a2a5aee158'),
  unitTwo:   u('1565793298595-6a879b1d9492'),
  machines:  u('1489987707025-afc232f7ea0f'),
  warehouse: u('1553413077-190dd305871c'),
  team:      u('1521737604893-d14cc237f11d'),
};

export default { hero, products, process, gallery, facility };
