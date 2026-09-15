/**
 * What the hero contains before an admin has edited anything.
 *
 * Seeded on first read (the same upsert-on-read approach as the theme and
 * process singletons) so the public site renders complete, truthful content on
 * a fresh database rather than an empty shell.
 *
 * The image ref is left empty: the frontend falls back to its own bundled
 * cut-out until the owner uploads their own, so there is nothing to seed here
 * that would only be a broken link.
 */
export const HOME_DEFAULTS = {
  hero: {
    eyebrow: "TIME TO MEET YOUR",
    title: "COLOUR & YARN",
    description:
      "Every base matched to your shade card — viscose, cotton and metallic " +
      "yarns processed in-house so colour stays consistent from first sample " +
      "to final bulk.",
    ctaLabel: "View Our Work",
    imageAlt: "Embroidered occasionwear from the JK Fashion range",
  },
};
