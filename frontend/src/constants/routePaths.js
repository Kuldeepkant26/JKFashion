/**
 * Every route in one place, so a path change is a single edit rather than a
 * search across the codebase.
 */
export const ROUTES = {
  // public marketing site
  HOME: '/',
  PRODUCTS: '/residential',
  ABOUT: '/about',

  // admin panel
  ADMIN_LOGIN: '/admin/login',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PRODUCTS: '/admin/products',
  ADMIN_ENQUIRIES: '/admin/enquiries',
  ADMIN_CONTENT: '/admin/content',
  ADMIN_SETTINGS: '/admin/settings',

  /**
   * Settings is a section, not a page: each concern gets its own tab so the
   * area can grow without any one screen becoming a scroll of unrelated
   * controls. /admin/settings itself redirects to the first tab.
   */
  ADMIN_SETTINGS_APPEARANCE: '/admin/settings/appearance',
  ADMIN_SETTINGS_TYPOGRAPHY: '/admin/settings/typography',
  ADMIN_SETTINGS_LAYOUT: '/admin/settings/layout',
  ADMIN_SETTINGS_GALLERY: '/admin/settings/gallery',
};
