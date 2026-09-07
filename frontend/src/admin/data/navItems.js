import { ROUTES } from '../../constants/routePaths.js';

/**
 * Sidebar navigation.
 *
 * Icons are inline SVG path data rather than an icon component per item — it
 * keeps the nav a plain data array, which is what makes rendering it a single
 * map in the sidebar.
 */
export const NAV_ITEMS = [
  {
    to: ROUTES.ADMIN_DASHBOARD,
    label: 'Dashboard',
    icon: 'M2.5 2.5h6.5v6.5H2.5zM11 2.5h6.5v4H11zM11 8.5h6.5v9H11zM2.5 11h6.5v6.5H2.5z',
  },
  {
    to: ROUTES.ADMIN_PRODUCTS,
    label: 'Products',
    icon: 'M4 4h12v3H4zm0 5h12v7a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm4 2v2h4v-2z',
  },
  {
    to: ROUTES.ADMIN_ENQUIRIES,
    label: 'Enquiries',
    icon: 'M3 4h14a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1zm.8 2L10 10.2 16.2 6z',
  },
  {
    to: ROUTES.ADMIN_CONTENT,
    label: 'Content',
    icon: 'M5 2.5h7l4 4V17a.5.5 0 0 1-.5.5h-11A.5.5 0 0 1 4 17V3a.5.5 0 0 1 .5-.5zM11 3v4h4M6.5 10h7M6.5 13h5',
  },
  {
    to: ROUTES.ADMIN_SETTINGS,
    label: 'Settings',
    icon: 'M10 7.4a2.6 2.6 0 1 0 0 5.2 2.6 2.6 0 0 0 0-5.2zM9.2 2h1.6l.3 2a6 6 0 0 1 1.5.9l1.9-.8 1 1.7-1.5 1.3a6 6 0 0 1 0 1.8l1.5 1.3-1 1.7-1.9-.8a6 6 0 0 1-1.5.9l-.3 2H9.2l-.3-2a6 6 0 0 1-1.5-.9l-1.9.8-1-1.7 1.5-1.3a6 6 0 0 1 0-1.8L4.5 5.8l1-1.7 1.9.8a6 6 0 0 1 1.5-.9z',
  },
];
