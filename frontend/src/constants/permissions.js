import { ROUTES } from './routePaths.js';

/**
 * Panel sections an owner can grant a staff account.
 *
 * Mirrors PERMISSIONS in the API's `config/constants.ts` — the API is the real
 * boundary, and any id here that it does not recognise is rejected by the
 * validator's allowlist.
 *
 * Staff is deliberately absent: granting it would let an editor create accounts
 * and set passwords, which is the ability to make themselves an owner.
 */
export const PERMISSIONS = [
  {
    id: 'INVENTORY',
    label: 'Inventory',
    hint: 'Production orders and buyer companies',
  },
  {
    id: 'ENQUIRIES',
    label: 'Enquiries',
    hint: 'Read and reply to website enquiries',
  },
  {
    id: 'CONTENT',
    label: 'Content',
    hint: 'Website copy and pages',
  },
  {
    id: 'SETTINGS',
    label: 'Settings',
    hint: 'Appearance, gallery, hero and process sections',
    /** Worth a second look: this section changes what visitors see. */
    sensitive: true,
  },
  {
    id: 'DASHBOARD',
    label: 'Dashboard',
    hint: 'Business totals and recent enquiries',
  },
];

export const PERMISSION_IDS = PERMISSIONS.map((p) => p.id);

/** True if this user may open `section`. Owners always may. */
export const hasPermission = (user, section) =>
  user?.role === 'MAIN_ADMIN' || (user?.permissions ?? []).includes(section);

/**
 * The first section this account can actually open.
 *
 * Order matters: it is the order a staff member most likely works in, so the
 * landing page is the one they would have clicked anyway. Falls back to the
 * no-access screen rather than looping — an account with every permission
 * revoked would otherwise be redirected for ever.
 */
export const landingRouteFor = (user) => {
  if (user?.role === 'MAIN_ADMIN') return ROUTES.ADMIN_DASHBOARD;

  const firstAllowed = [
    ['INVENTORY', ROUTES.ADMIN_INVENTORY],
    ['DASHBOARD', ROUTES.ADMIN_DASHBOARD],
    ['ENQUIRIES', ROUTES.ADMIN_ENQUIRIES],
    ['CONTENT', ROUTES.ADMIN_CONTENT],
    ['SETTINGS', ROUTES.ADMIN_SETTINGS],
  ].find(([section]) => hasPermission(user, section));

  return firstAllowed ? firstAllowed[1] : ROUTES.ADMIN_NO_ACCESS;
};
