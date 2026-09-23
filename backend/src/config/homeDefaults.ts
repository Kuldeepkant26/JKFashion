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

  /*
   * The real business details, so a fresh database serves the truth rather than
   * a placeholder number someone might actually ring.
   *
   * `email` is deliberately empty: there is no published address yet, and the
   * site hides the line entirely rather than inventing one. Filling it in the
   * settings tab is all it takes to make it appear.
   */
  contact: {
    phone: "9810014413",
    address: "Faridabad, Haryana India",
    email: "",
  },
};
