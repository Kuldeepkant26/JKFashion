import { facility } from './images.js';

/**
 * What the How We Work section shows when the API cannot be reached.
 *
 * The section is the main account of how the company actually works, so losing
 * it to a network blip costs more than showing slightly generic content. This
 * mirrors the API's own shape and the server-side defaults in
 * backend/src/config/processDefaults.ts — keep the two in step.
 *
 * Ids are synthetic but stable: the render path keys on `_id`, and a key that
 * changed between renders would remount every card.
 *
 * `videoEnabled` is false because there is no film to fall back to. That part
 * hides itself while the other two render in full.
 */
export const PROCESS_FALLBACK = {
  label: 'How We Work',
  title: 'Inside Our Floor',
  intro:
    'From the first punched stitch to the packed carton, every order moves through ' +
    'the same hands and the same checks. Here is what that looks like.',

  facilityEnabled: true,
  facilityHeading: 'Our Factory & Our People',
  facilityBody:
    'The unit, the machines and the team who run them. These are our own floors, ' +
    'not stock photographs.',
  facilityPhotos: [
    { _id: 'fallback-photo-1', caption: 'The unit', image: { url: facility.unitOne }, order: 0, isActive: true },
    { _id: 'fallback-photo-2', caption: 'On the floor', image: { url: facility.machines }, order: 1, isActive: true },
    { _id: 'fallback-photo-3', caption: 'Our team', image: { url: facility.team }, order: 2, isActive: true },
    { _id: 'fallback-photo-4', caption: 'Machining hall', image: { url: facility.unitTwo }, order: 3, isActive: true },
    { _id: 'fallback-photo-5', caption: 'Packed and ready', image: { url: facility.warehouse }, order: 4, isActive: true },
  ],

  videoEnabled: false,
  videoHeading: 'See the Floor in Motion',
  videoBody:
    'A short walk through the unit — the machines running, the mending tables, and ' +
    'the people who do the work.',
  video: {},
  videoPoster: {},

  stepsHeading: 'The Production Flow',
  steps: [
    {
      _id: 'fallback-step-1',
      title: 'Design Punching',
      summary: 'Artwork becomes a stitch file',
      description:
        'The design is drawn and punched in our own studio, with density set for the ' +
        'ground it will actually run on.',
      icon: 'pen-tool',
      order: 0,
      isActive: true,
    },
    {
      _id: 'fallback-step-2',
      title: 'Embroidery Production',
      summary: 'Run on calibrated machines',
      description:
        'Schiffli and multi-head machines run at controlled speed, keeping the base ' +
        'stable across the full width.',
      icon: 'cpu',
      order: 1,
      isActive: true,
    },
    {
      _id: 'fallback-step-3',
      title: 'Checking',
      summary: 'Mended by hand, stitch by stitch',
      description:
        'Every metre is looked over and hand-corrected — loose ends trimmed, missed ' +
        'stitches closed.',
      icon: 'search',
      order: 2,
      isActive: true,
    },
    {
      _id: 'fallback-step-4',
      title: 'Inspection',
      summary: 'Measured against the approved sample',
      description:
        'Width, repeat and shade are checked against the sample you signed off before ' +
        'anything is cleared.',
      icon: 'check-circle',
      order: 3,
      isActive: true,
    },
    {
      _id: 'fallback-step-5',
      title: 'Dispatch',
      summary: 'Folded, packed, on its way',
      description:
        'Goods are folded, packed to your marking instructions and released with the ' +
        'lot documented.',
      icon: 'package',
      order: 4,
      isActive: true,
    },
  ],
};
