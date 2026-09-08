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
export const hero = {
  loom:        u('1489987707025-afc232f7ea0f', 1920), // textile machinery
  threads:     u('1591195853828-11db59a44f6b', 1920), // spools of thread
  lace:        u('1605518216938-7c31b7b14ad0', 1920), // fine lace detail
  fabricRolls: u('1524578271613-d550eacf6090', 1920), // rolls of fabric
  stitching:   u('1528938102132-4a9276b8e320', 1920), // stitching close-up
  atelier:     u('1567401893414-76b7b1e5a7a5', 1920), // workshop / atelier
};

// ------------------------------------------------------------- products
export const products = {
  // Client photograph. Served from `public/`, so it is referenced by URL path
  // rather than imported — Vite copies public/ through to the build as-is.
  schiffliFabric: '/jk_fashion_img1.png',
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
