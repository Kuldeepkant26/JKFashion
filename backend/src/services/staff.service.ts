import type { Types } from "mongoose";
import { AdminUser, type IAdminUser, type SafeAdminUser } from "../models/adminUser.model.js";
import { ROLES } from "../config/constants.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Staff accounts — the people who can sign in to the admin panel.
 *
 * Every function here is reachable only by the owner (the routes enforce it).
 * The rules that keep the panel from locking itself out, or from quietly
 * minting a second owner, live in this file rather than the controller so a
 * future caller cannot skip them.
 */

/** Newest last: the list reads as the order people joined. */
export const listStaff = async (): Promise<SafeAdminUser[]> => {
  const users = await AdminUser.find().sort({ createdAt: 1 }).exec();
  return users.map((u) => u.toSafeObject());
};

const findOr404 = async (id: string): Promise<IAdminUser> => {
  const user = await AdminUser.findById(id).exec();
  if (!user) throw new ApiError(404, "That account no longer exists");
  return user;
};

export interface CreateStaffInput {
  name: string;
  email: string;
  password: string;
}

export const createStaff = async (input: CreateStaffInput): Promise<SafeAdminUser> => {
  const email = input.email.toLowerCase();

  /*
   * Checked here as well as by the unique index, so the message names the
   * problem. The index is still what makes it correct under a race.
   */
  const existing = await AdminUser.findOne({ email }).exec();
  if (existing) throw new ApiError(409, "An account with that email already exists");

  /*
   * The role is FORCED, never taken from the caller.
   *
   * The schema defaults `role` to MAIN_ADMIN, so an input-driven role here —
   * or simply forgetting to set one — would turn this endpoint into a way to
   * mint owners. Staff created through the panel are always EDITORs.
   */
  const user = await AdminUser.create({
    name: input.name,
    email,
    // Plaintext: the model's pre-save hook hashes it.
    passwordHash: input.password,
    role: ROLES.EDITOR,
    isProtected: false,
  });

  return user.toSafeObject();
};

export interface UpdateStaffInput {
  name?: string;
  isActive?: boolean;
}

export const updateStaff = async (
  id: string,
  patch: UpdateStaffInput,
  actingUserId: Types.ObjectId
): Promise<SafeAdminUser> => {
  const user = await findOr404(id);

  if (patch.name !== undefined) user.name = patch.name;

  if (patch.isActive !== undefined && patch.isActive !== user.isActive) {
    if (user.isProtected && !patch.isActive) {
      throw new ApiError(403, "The main administrator cannot be deactivated");
    }
    // Deactivating yourself ends your own session on the next request.
    if (String(user._id) === String(actingUserId) && !patch.isActive) {
      throw new ApiError(400, "You cannot deactivate your own account");
    }

    user.isActive = patch.isActive;

    /*
     * Drop the refresh tokens of a deactivated account. `protect` already
     * rejects them on the next request, but clearing these means the session
     * cannot be resurrected by reactivating the account later.
     */
    if (!patch.isActive) user.refreshTokens = [];
  }

  await user.save();
  return user.toSafeObject();
};

/** Owner-set password, for staff who have forgotten theirs. */
export const setPassword = async (id: string, password: string): Promise<SafeAdminUser> => {
  const user = await findOr404(id);

  // Assigning plaintext is correct — the pre-save hook hashes it.
  user.passwordHash = password;
  // Every existing session is invalidated: a password reset should end them.
  user.refreshTokens = [];
  await user.save();

  return user.toSafeObject();
};

export const deleteStaff = async (
  id: string,
  actingUserId: Types.ObjectId
): Promise<void> => {
  const user = await findOr404(id);

  if (user.isProtected) {
    throw new ApiError(403, "The main administrator cannot be deleted");
  }
  if (String(user._id) === String(actingUserId)) {
    throw new ApiError(400, "You cannot delete your own account");
  }

  await user.deleteOne();
};
