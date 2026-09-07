# JK Fashion — Content Handoff

Template converted from the MM Developers real-estate site to a
schiffli embroidery / lace manufacturing business, branded **JK Fashion**.

Run locally: `npm run dev`   ·   Build: `npm run build`

---

## 1. Client details to fill in  ← DO THIS FIRST

Everything lives in **`src/data/site.js`**. Every `TODO` there is a guess —
replace it and the whole site updates. Nothing else needs editing for these.

| Field | Current placeholder |
|---|---|
| `contact.email` | info@jkfashion.com |
| `contact.salesEmail` | sales@jkfashion.com |
| `contact.phone` / `phoneHref` | +91 98765 43210 |
| `contact.whatsapp` | 919876543210 |
| `contact.address` / `addressFull` | Surat, Gujarat, India |
| `social.*` | placeholder instagram / facebook / linkedin |
| `company.established` / `yearsExperience` | 1998 / 25 |
| `stats[]` | 25 yrs · 40 machines · 60,000 sq ft · 2M stitches/day |

**The stats are invented.** Get the real machine count, floor area and
capacity from the client before this goes live — buyers in this trade
read those numbers closely and will notice if they don't add up.

## 2. Images

All photography is referenced from **`src/data/images.js`** — one file,
18 free-licence Unsplash placeholders, all verified loading.

To swap in the client's own photos:
1. Drop files into `src/assets/`
2. `import myPhoto from '../assets/my-photo.jpg'` at the top of `images.js`
3. Replace the URL string with `myPhoto`

Nothing else in the codebase changes.

Priority shots to request from the client: the machine floor, a few
finished fabric/lace close-ups, the design studio, and the packing area.

## 3. Testimonials — REPLACE BEFORE LAUNCH

`src/components/Testimonials.jsx` and `src/pages/Commercial.jsx` contain
placeholder quotes with the name "Placeholder Name". They are written to
show the layout and are marked with comment blocks in both files.

Replace with real, attributed quotes with the client's permission, or
delete the sections. Do not ship invented testimonials.

## 4. Logo & splash animation

The client's logo (`src/assets/jk-fashion-logo.png`) is used in the navbar,
the sidebar and the footer. Favicons were generated from it:
`public/favicon.png` (512px) and `public/apple-touch-icon.png` (180px).

The original upload was 1536x1024 / 1.37 MB; it is resized to 900px wide
(316 KB) for the web. The full-resolution original is not in the repo —
keep a copy if you need it for print.

**The splash screen is a logo-completion animation**, not the PNG. The mark
is rebuilt as inline SVG in `src/components/SplashScreen.jsx` so it can draw
itself:

1. `0.15s` — the pink brushstroke wipes on left-to-right
2. `0.95s` — the "JK" script draws stroke by stroke
3. `1.70s` — "JK / FASHION" fades up and the letterspacing opens out
4. `2.20s` — one quiet settle, then the screen lifts away

Total ~2.6s; `App.jsx` clears it at 3.0s / 3.55s. To retime, change the
`animation-delay` values in `src/css/SplashScreen.css` **and** the two
timeouts in `App.jsx` together, or the screen will cut the animation off.

The SVG is a hand-traced approximation of the logo's script, not an exact
vector of it. If the client can supply the logo as real vector artwork
(.ai / .svg / .eps), swapping those `<path>` elements in would make the
draw-on exact. Reduced-motion users get the finished logo with no animation.


## 5. Page structure

Routes were kept as-is to avoid breaking links; only labels changed.

| Route | Nav label | Content |
|---|---|---|
| `/` | HOME | hero carousel, what we make, process, gallery, stats, testimonials, FAQ |
| `/residential` | PRODUCTS | product range, featured designs, process, CTA |
| `/about` | ABOUT | story, timeline, values, selected work |

The Capabilities page (`/commercial`) was removed — its content duplicated
Home and Products. A catch-all route in `App.jsx` redirects any unknown path
(including old `/commercial` links) back to Home.

If you'd rather have a clean URL for Products (`/products` instead of
`/residential`), update the `path` in `App.jsx`, `Navbar.jsx` and `Footer.jsx`
together.

## 6. Removed files

Deleted as unused (verified by tracing the import graph from `main.jsx`):

- `pages/Commercial.jsx` + `css/Commercial.css` — the Capabilities page
- `components/CoreValues.jsx`, `OurStory.jsx`, `PhilosophyShowcase.jsx`,
  `SignatureApproach.jsx`, `VisionMission.jsx` — never imported anywhere
- `pages/Projects.jsx` — empty file, no route
- The six matching CSS files for the above

The old real-estate photos in `src/assets/` are also gone; the only asset
left is the JK Fashion logo.


## 7. Theme

The site is **light-mode only**. The dark/light toggle that came with the
template was removed: the `ThemeContext`, the navbar toggle button, and all
54 dark-mode CSS rules are gone.

The light palette lives in `:root` in `src/index.css`. Some components still
carry a `--light` suffix in their class names (e.g. `ventures-page--light`) —
those are now just static class names, not theme switches. Harmless to leave;
renaming them is optional cleanup.

## 8. Known cosmetic leftovers

- CSS class names still say `interior-*`, `websaas-*`, `mobiledev-*`. Purely internal, invisible to users — renaming is
  optional cleanup, not required.
- `npm run lint` reports pre-existing `no-unused-vars` on `motion` in
  several files. That's a template eslint-config quirk, not a new break.
