import mongoose, { Schema, type Document, type Model } from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, ROLE_VALUES, type Role } from "../config/constants.js";

export interface SafeAdminUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  isProtected: boolean;
  lastLoginAt?: Date;
}

export interface IAdminUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
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

/** The only shape that should ever reach a response body. */
adminUserSchema.methods.toSafeObject = function toSafeObject(): SafeAdminUser {
  return {
    id: String(this._id),
    name: this.name,
    email: this.email,
    role: this.role,
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
