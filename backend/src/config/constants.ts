export const ROLES = Object.freeze({
  /** The seeded owner. Cannot be deleted or deactivated — see `isProtected`. */
  MAIN_ADMIN: "MAIN_ADMIN",
  /** Can sign in and manage content, but not other administrators. */
  EDITOR: "EDITOR",
});

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_VALUES: Role[] = Object.values(ROLES);
