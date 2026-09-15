/**
 * What the section contains before an admin has edited anything.
 *
 * Seeded on first read (the same upsert-on-read approach as the theme
 * singleton) so the public site renders a complete, truthful section on a
 * fresh database rather than an empty shell. The copy is deliberately generic
 * about imagery: the rows carry no media until the owner uploads their own.
 */
export const PROCESS_DEFAULTS = {
  label: "How We Work",
  title: "Inside Our Floor",
  intro:
    "From the first punched stitch to the packed carton, every order moves through " +
    "the same hands and the same checks. Here is what that looks like.",

  stepsHeading: "The Production Flow",
  steps: [
    {
      title: "Design Punching",
      summary: "Artwork becomes a stitch file",
      description:
        "The design is drawn and punched in our own studio, with density set for the " +
        "ground it will actually run on.",
      icon: "pen-tool",
      order: 0,
      isActive: true,
    },
    {
      title: "Embroidery Production",
      summary: "Run on calibrated machines",
      description:
        "Schiffli and multi-head machines run at controlled speed, keeping the base " +
        "stable across the full width.",
      icon: "cpu",
      order: 1,
      isActive: true,
    },
    {
      title: "Checking",
      summary: "Mended by hand, stitch by stitch",
      description:
        "Every metre is looked over and hand-corrected — loose ends trimmed, missed " +
        "stitches closed.",
      icon: "search",
      order: 2,
      isActive: true,
    },
    {
      title: "Inspection",
      summary: "Measured against the approved sample",
      description:
        "Width, repeat and shade are checked against the sample you signed off before " +
        "anything is cleared.",
      icon: "check-circle",
      order: 3,
      isActive: true,
    },
    {
      title: "Dispatch",
      summary: "Folded, packed, on its way",
      description:
        "Goods are folded, packed to your marking instructions and released with the " +
        "lot documented.",
      icon: "package",
      order: 4,
      isActive: true,
    },
  ],

  videoEnabled: true,
  videoHeading: "See the Floor in Motion",
  videoBody:
    "A short walk through the unit — the machines running, the mending tables, and " +
    "the people who do the work.",

  facilityEnabled: true,
  facilityHeading: "Our Factory & Our People",
  facilityBody:
    "The unit, the machines and the team who run them. These are our own floors, " +
    "not stock photographs.",
} as const;
