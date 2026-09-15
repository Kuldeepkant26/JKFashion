import mongoose, { Schema, type Document, type Model } from "mongoose";
import bcrypt from "bcryptjs";
import {
  ROLES,
  ROLE_VALUES,
  PERMISSION_VALUES,
  DEFAULT_PERMISSIONS,
  type Role,
  type Permission,
} from "../config/constants.js";

export interface SafeAdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  permissions: Permission[];
  isActive: boolean;
  isProtected: boolean;
  lastLoginAt?: Date;
}

export interface IAdminUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  permissions: Permission[];
  refreshTokens: string[];
  isActive: boolean;
  isProtected: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  toSafeObject(): SafeAdminUser;
}

const adminUserSchema = new Schema<IAdminUser>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
    email: { type: String, required: true, trim: true, lowercase: true, unique: true, index: true },

    // select:false so a stray `findOne()` can never carry the hash into a
    // response. Reading it requires an explicit .select("+passwordHash").
    passwordHash: { type: String, required: true, select: false },

    role: { type: String, enum: ROLE_VALUES, default: ROLES.MAIN_ADMIN, index: true },

    /**
     * Which panel sections an EDITOR may open. Ignored for MAIN_ADMIN, who
     * reaches everything by role — see `effectivePermissions`, which is what
     * every caller should read rather than this field directly.
     */
    permissions: {
      type: [{ type: String, enum: PERMISSION_VALUES }],
      default: DEFAULT_PERMISSIONS,
    },

    /**
     * SHA-256 hashes of the refresh tokens currently valid for this account —
     * one per signed-in device. Storing them is what makes rotation and
     * server-side revocation possible; a stateless JWT alone cannot be revoked.
     */
    refreshTokens: { type: [String], default: [], select: false },

    isActive: { type: Boolean, default: true },

    /**
     * The seeded owner. Cannot be deactivated or deleted by anyone, so the
     * panel can never be locked out of itself by an admin removing the last
     * account that can sign in.
     */
    isProtected: { type: Boolean, default: false },

    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

/**
 * Hashing lives in the model rather than the service so no call site can
 * forget it — assigning a plaintext value to `passwordHash` and saving is
 * always correct.
 */
adminUserSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("passwordHash") || !this.passwordHash) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
  next();
});

adminUserSchema.methods.comparePassword = function comparePassword(
  candidate: string
): Promise<boolean> {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(candidate, this.passwordHash);
};

/**
 * What this account can actually reach.
 *
 * The owner gets everything by virtue of being the owner, rather than by
 * carrying a stored list that could drift out of step with PERMISSIONS as
 * sections are added. Only an editor's access is data.
 */
export const effectivePermissions = (user: {
  role: Role;
  permissions?: Permission[];
}): Permission[] =>
  user.role === ROLES.MAIN_ADMIN ? [...PERMISSION_VALUES] : user.permissions ?? [];

/** The only shape that should ever reach a response body. */
adminUserSchema.methods.toSafeObject = function toSafeObject(): SafeAdminUser {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    role: this.role,
    // Resolved, not raw: the client should never have to know that an owner's
    // stored list is meaningless.
    permissions: effectivePermissions({ role: this.role, permissions: this.permissions }),
    isActive: this.isActive,
    isProtected: this.isProtected,
    lastLoginAt: this.lastLoginAt,
  };
};

// `mongoose.models.X ||` guards against OverwriteModelError when tsx watch
// re-executes this module on hot reload.
export const AdminUser: Model<IAdminUser> =
  (mongoose.models.AdminUser as Model<IAdminUser>) ||
  mongoose.model<IAdminUser>("AdminUser", adminUserSchema);
