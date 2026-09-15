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

  /**
   * SMTP, for the enquiry notification mail. Optional at boot for the same
   * reason as Cloudinary: a site with no mail credentials should still accept
   * enquiries and show them in the panel — the notification is an extra, not
   * the record. `notifyEnquiries` is the kill switch for the whole feature.
   */
  smtp: {
    host: process.env.SMTP_HOST,
    port: toInt(process.env.SMTP_PORT, 587),
    /**
     * Implicit TLS (port 465) versus STARTTLS (587). Derived from the port
     * rather than asked for separately, because getting the two out of step is
     * the single most common way an otherwise-correct SMTP config fails to
     * connect. An explicit SMTP_SECURE still wins if it is set.
     */
    secure: process.env.SMTP_SECURE
      ? process.env.SMTP_SECURE === "true"
      : toInt(process.env.SMTP_PORT, 587) === 465,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,

    /**
     * The envelope From. Must be an address the SMTP account is allowed to
     * send as, or the provider will reject the message — which is why it
     * defaults to the login user rather than to something branded.
     */
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    fromName: process.env.SMTP_FROM_NAME ?? "JK Fashion Website",
  },

  /** Set false to keep SMTP configured but stop sending notifications. */
  notifyEnquiries: process.env.NOTIFY_ENQUIRIES !== "false",

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

/**
 * True once SMTP can actually connect and send. The admin settings screen
 * reports this, so an owner who saves a recipient list is told up front that
 * nothing will be delivered until the server is given credentials.
 */
export const isSmtpConfigured = (): boolean =>
  Boolean(env.smtp.host && env.smtp.user && env.smtp.password && env.smtp.from);

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
