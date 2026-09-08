/**
 * Generates the display variants the site actually serves.
 *
 * The client photographs are ~2.5MB PNGs each. Shipping those directly means
 * ~10MB on a page that shows four of them at once. This emits two derivatives
 * per source:
 *
 *   <name>-thumb.jpg   520px  ~90KB   rack cards, thumbnails
 *   <name>-full.jpg   1400px ~560KB   the viewer, and the zoom lens source
 *
 * Uses `sips`, which ships with macOS — no dependency to install and nothing
 * added to the build. Re-run after dropping new photography into public/:
 *
 *   node scripts/gen-images.mjs
 *
 * Originals are left untouched so a better encoder can be swapped in later.
 */
import { execFileSync } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join, parse } from 'node:path';

const PUBLIC_DIR = new URL('../frontend/public/', import.meta.url).pathname;

/** Source photographs. Icons and already-generated variants are skipped. */
const SKIP = /^(favicon|apple-touch-icon)|-(thumb|full)\.jpg$/i;

const VARIANTS = [
  { suffix: 'thumb', size: 520, quality: 82 },
  { suffix: 'full', size: 1400, quality: 88 },
];

const kb = (bytes) => `${Math.round(bytes / 1024)}KB`;

const sources = readdirSync(PUBLIC_DIR).filter(
  (f) => /\.(png|jpe?g)$/i.test(f) && !SKIP.test(f)
);

if (!sources.length) {
  console.log('No source photographs found in frontend/public/');
  process.exit(0);
}

let before = 0;
let after = 0;

for (const file of sources) {
  const src = join(PUBLIC_DIR, file);
  const { name } = parse(file);
  before += statSync(src).size;

  const made = [];
  for (const { suffix, size, quality } of VARIANTS) {
    const out = join(PUBLIC_DIR, `${name}-${suffix}.jpg`);
    execFileSync('sips', [
      '-Z', String(size),
      '-s', 'format', 'jpeg',
      '-s', 'formatOptions', String(quality),
      src, '--out', out,
    ], { stdio: 'ignore' });

    const bytes = statSync(out).size;
    after += bytes;
    made.push(`${suffix} ${kb(bytes)}`);
  }

  console.log(`  ${file.padEnd(24)} ${kb(statSync(src).size).padStart(7)}  ->  ${made.join('  ')}`);
}

console.log(
  `\n${sources.length} source(s): ${kb(before)} -> ${kb(after)} ` +
  `(${Math.round((1 - after / before) * 100)}% smaller)`
);
