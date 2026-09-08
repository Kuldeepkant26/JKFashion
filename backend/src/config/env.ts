import dotenv from "dotenv";

dotenv.config();

const toInt = (value: string | undefined, fallback: number): number => {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const env = {
  port: toInt(process.env.PORT, 5001),
  nodeEnv: process.env.NODE_ENV ?? "development",
  mongoUri: process.env.MONGO_URI,

  /**
   * Comma-separated allowlist, so the panel can be opened from localhost and
   * from a phone on the LAN at the same time. Falls back to clientUrl.
   */
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  clientOrigins: (process.env.CLIENT_ORIGINS ?? process.env.CLIENT_URL ?? "http://localhost:5173")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? "15m",
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? "30d",
    refreshCookieName: "jk_refresh",
    refreshMaxAgeMs: toInt(process.env.JWT_REFRESH_MAX_AGE_DAYS, 30) * 24 * 60 * 60 * 1000,
  },

  /**
   * Cloudinary. Optional at boot — the site runs fine without it, and only the
   * gallery-upload endpoint refuses to work. That keeps a missing credential
   * from taking the whole API down, and it is why these are NOT in REQUIRED.
   */
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
    folder: process.env.CLOUDINARY_FOLDER ?? "jk-fashion/gallery",
  },

  seed: {
    adminName: process.env.SEED_ADMIN_NAME ?? "JK Fashion Admin",
    adminEmail: process.env.SEED_ADMIN_EMAIL ?? "admin@jkfashion.com",
    adminPassword: process.env.SEED_ADMIN_PASSWORD ?? "Admin@12345",
  },
} as const;

export const isProduction = env.nodeEnv === "production";

/** True once all three Cloudinary values are present. */
export const isCloudinaryConfigured = (): boolean =>
  Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret);

const REQUIRED: Array<[string, string | undefined]> = [
  ["MONGO_URI", env.mongoUri],
  ["JWT_ACCESS_SECRET", env.jwt.accessSecret],
  ["JWT_REFRESH_SECRET", env.jwt.refreshSecret],
];

/**
 * Fails at boot rather than at the first request. A missing secret surfacing
 * inside a jwt.sign() call at 2am is far harder to diagnose than a startup
 * message naming the variable.
 */
export const validateEnv = (): void => {
  const missing = REQUIRED.filter(([, value]) => !value).map(([name]) => name);

  if (missing.length) {
    throw new Error(
      `Missing required environment variable(s): ${missing.join(", ")}. ` +
        `Copy .env.example to .env and fill them in.`
    );
  }

  /**
   * Sharing one secret between the two token types means a refresh token is
   * accepted as an access token — the short access lifetime, which is the
   * entire point of the split, stops being enforced.
   */
  if (env.jwt.accessSecret === env.jwt.refreshSecret) {
    throw new Error("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must differ.");
  }

  if (isProduction) {
    if (env.seed.adminPassword === "Admin@12345") {
      throw new Error(
        "SEED_ADMIN_PASSWORD is still the default. Set a real one before deploying."
      );
    }

    // A short secret is brute-forceable offline once an attacker has any token.
    const tooShort = [
      ["JWT_ACCESS_SECRET", env.jwt.accessSecret],
      ["JWT_REFRESH_SECRET", env.jwt.refreshSecret],
    ].filter(([, value]) => (value ?? "").length < 32);

    if (tooShort.length) {
      throw new Error(
        `${tooShort.map(([n]) => n).join(", ")} must be at least 32 characters in production. ` +
          `Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
      );
    }
  }
};
