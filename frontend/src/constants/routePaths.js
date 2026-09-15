/**
 * Every route in one place, so a path change is a single edit rather than a
 * search across the codebase.
 */
export const ROUTES = {
  // public marketing site — a single page; the nav scrolls to sections on it
  HOME: '/',

  // admin panel
  ADMIN_LOGIN: '/admin/login',
  ADMIN: '/admin',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_INVENTORY_ORDERS: '/admin/inventory/orders',
  ADMIN_INVENTORY_COMPANIES: '/admin/inventory/companies',
  ADMIN_STAFF: '/admin/staff',
  ADMIN_ENQUIRIES: '/admin/enquiries',
  ADMIN_CONTENT: '/admin/content',
  ADMIN_SETTINGS: '/admin/settings',

  /**
   * Where an account with no granted sections lands. A real route rather than
   * a redirect target, so such an account gets an explanation instead of
   * bouncing between guards forever.
   */
  ADMIN_NO_ACCESS: '/admin/no-access',

  /**
   * Settings is a section, not a page: each concern gets its own tab so the
   * area can grow without any one screen becoming a scroll of unrelated
   * controls. /admin/settings itself redirects to the first tab.
   */
  ADMIN_SETTINGS_APPEARANCE: '/admin/settings/appearance',
  ADMIN_SETTINGS_TYPOGRAPHY: '/admin/settings/typography',
  ADMIN_SETTINGS_LAYOUT: '/admin/settings/layout',
  ADMIN_SETTINGS_GALLERY: '/admin/settings/gallery',
  ADMIN_SETTINGS_PROCESS: '/admin/settings/how-we-work',
  ADMIN_SETTINGS_HOME: '/admin/settings/hero-content',
};
