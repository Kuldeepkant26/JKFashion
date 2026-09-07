import crypto from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../config/env.js";

export interface AccessTokenPayload {
  sub: string;
  role: string;
}

export interface RefreshTokenPayload {
  sub: string;
  jti: string;
}

interface TokenSubject {
  _id: unknown;
  role: string;
}

export const signAccessToken = (user: TokenSubject): string =>
  jwt.sign({ sub: String(user._id), role: user.role }, env.jwt.accessSecret as string, {
    expiresIn: env.jwt.accessExpiresIn,
  } as SignOptions);

/**
 * The `jti` makes every refresh token unique.
 *
 * Without it, two refreshes issued within the same second produce a byte-identical
 * JWT, so rotation would remove the token it just issued and leave the previous
 * one replayable — the exact failure rotation exists to prevent.
 */
export const signRefreshToken = (user: TokenSubject): string =>
  jwt.sign({ sub: String(user._id), jti: crypto.randomUUID() }, env.jwt.refreshSecret as string, {
    expiresIn: env.jwt.refreshExpiresIn,
  } as SignOptions);

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.jwt.accessSecret as string) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): RefreshTokenPayload =>
  jwt.verify(token, env.jwt.refreshSecret as string) as RefreshTokenPayload;

/**
 * SHA-256, so refresh tokens are never stored in plaintext.
 *
 * A database leak then yields hashes rather than usable sessions. No salt is
 * needed: the input is already 200+ bits of unguessable entropy, so a rainbow
 * table is not a threat here the way it is for passwords.
 */
export const hashToken = (token: string): string =>
  crypto.createHash("sha256").update(token).digest("hex");
