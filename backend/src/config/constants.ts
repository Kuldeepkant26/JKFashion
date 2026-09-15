export const ROLES = Object.freeze({
  /** The seeded owner. Cannot be deleted or deactivated — see `isProtected`. */
  MAIN_ADMIN: "MAIN_ADMIN",
  /** Can sign in and manage content, but not other administrators. */
  EDITOR: "EDITOR",
});

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES: Role[] = Object.values(ROLES);

/**
 * The panel sections an owner can grant an editor.
 *
 * Deliberately NOT a section for Staff. Granting it would let an editor create
 * accounts and set passwords — which is the ability to mint another owner, and
 * therefore a privilege escalation dressed up as a checkbox. The owner keeps
 * that one, and it is enforced by this list's contents rather than by a check
 * somewhere that could be forgotten.
 */
export const PERMISSIONS = Object.freeze({
  INVENTORY: "INVENTORY",
  ENQUIRIES: "ENQUIRIES",
  CONTENT: "CONTENT",
  SETTINGS: "SETTINGS",
  DASHBOARD: "DASHBOARD",
});

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_VALUES: Permission[] = Object.values(PERMISSIONS);

/**
 * What a newly created editor gets. Inventory only — the section staff were
 * limited to before permissions existed, so an account created today behaves
 * exactly as one created yesterday until the owner decides otherwise.
 */
export const DEFAULT_PERMISSIONS: Permission[] = [PERMISSIONS.INVENTORY];
