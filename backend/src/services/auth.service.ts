import { ApiError } from "../utils/ApiError.js";
import { env } from "../config/env.js";
import {
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/token.util.js";
import { AdminUser, type IAdminUser, type SafeAdminUser } from "../models/adminUser.model.js";

export interface SessionResult {
  user: SafeAdminUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * One device should not be able to accumulate unbounded refresh tokens, and an
 * old laptop's session should eventually fall off rather than live forever.
 */
const MAX_SESSIONS_PER_USER = 5;

const issueSession = async (user: IAdminUser): Promise<SessionResult> => {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  // Only the hash is stored, so a database leak yields no usable sessions.
  const existing = user.refreshTokens ?? [];
  user.refreshTokens = [...existing, hashToken(refreshToken)].slice(-MAX_SESSIONS_PER_USER);
  user.lastLoginAt = new Date();
  await user.save();

  return { user: user.toSafeObject(), accessToken, refreshToken };
};

export const login = async (email: string, password: string): Promise<SessionResult> => {
  const user = await AdminUser.findOne({ email: email.toLowerCase() }).select(
    "+passwordHash +refreshTokens"
  );

  /**
   * Identical error for "no such account" and "wrong password".
   *
   * Distinguishing them turns the login form into an account-enumeration
   * oracle: an attacker learns which addresses are registered and can target
   * those alone.
   */
  const invalid = new ApiError(401, "Invalid email or password");

  if (!user) throw invalid;
  if (!(await user.comparePassword(password))) throw invalid;
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated");

  return issueSession(user);
};

/**
 * Exchanges a refresh token for a new pair, invalidating the one presented.
 *
 * Rotation means a stolen token is single-use: whoever presents it second is
 * rejected, because the first use already removed it.
 */
export const refreshSession = async (presented: string | undefined): Promise<SessionResult> => {
  if (!presented) throw new ApiError(401, "No session to refresh");

  const payload = verifyRefreshToken(presented);
  const user = await AdminUser.findById(payload.sub).select("+refreshTokens");

  if (!user) throw new ApiError(401, "Account no longer exists");
  if (!user.isActive) throw new ApiError(403, "This account has been deactivated");

  const presentedHash = hashToken(presented);
  const known = (user.refreshTokens ?? []).includes(presentedHash);

  /**
   * A signature-valid token that is not in the stored set has already been
   * rotated away — it is a replay. Dropping every session forces a fresh
   * sign-in on all devices, which is the safe response to a possible theft.
   */
  if (!known) {
    user.refreshTokens = [];
    await user.save();
    throw new ApiError(401, "Session is no longer valid, please sign in again");
  }

  user.refreshTokens = (user.refreshTokens ?? []).filter((t) => t !== presentedHash);
  return issueSession(user);
};

export const logout = async (
  user: IAdminUser | undefined,
  presented: string | undefined
): Promise<void> => {
  if (!user || !presented) return;

  // Only this device's token is dropped — signing out of a laptop should not
  // end the session on a phone.
  const fresh = await AdminUser.findById(user._id).select("+refreshTokens");
  if (!fresh) return;

  const presentedHash = hashToken(presented);
  fresh.refreshTokens = (fresh.refreshTokens ?? []).filter((t) => t !== presentedHash);
  await fresh.save();
};

/** Cookie settings shared by every place the refresh cookie is written or cleared. */
export const refreshCookieName = env.jwt.refreshCookieName;
