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
  /**
   * Production orders and the buyers they are for. Presented as "Orders";
   * the permission behind it is still called INVENTORY, which predates the
   * rename — see constants/permissions.js.
   */
  ADMIN_ORDERS: '/admin/orders',
  ADMIN_ORDERS_COMPANIES: '/admin/orders/companies',
  /** One buyer's dashboard. Build it with `companyPath(id)`. */
  ADMIN_ORDERS_COMPANY: '/admin/orders/companies/:id',
  /** Sampling, kept apart from production. */
  ADMIN_ORDERS_SAMPLES: '/admin/orders/sampling',
  /** Production orders. The path predates the tab's rename, and is bookmarked. */
  ADMIN_ORDERS_LIST: '/admin/orders/list',
  /** The figures, on their own tab rather than above the order list. */
  ADMIN_ORDERS_STATS: '/admin/orders/statistics',

  /**
   * The daily materials ledger — what stock is on the floor, what came in and
   * what went out. A different section from Orders, with its own permission.
   */
  ADMIN_INVENTORY: '/admin/inventory',
  ADMIN_INVENTORY_OVERVIEW: '/admin/inventory/overview',
  ADMIN_INVENTORY_MATERIALS: '/admin/inventory/materials',
  ADMIN_INVENTORY_REPORT: '/admin/inventory/report',
  ADMIN_INVENTORY_EXPENSES: '/admin/inventory/expenses',
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

/** A buyer's dashboard. `tab` and `open` deep-link to a sample or order in it. */
export const companyPath = (id, query) =>
  `/admin/orders/companies/${id}${query ? `?${new URLSearchParams(query)}` : ''}`;
