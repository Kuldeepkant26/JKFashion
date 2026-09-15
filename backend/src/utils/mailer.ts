import nodemailer, { type Transporter } from "nodemailer";
import { env, isSmtpConfigured } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * One shared SMTP transport.
 *
 * Built lazily on first send rather than at boot: the API must start fine with
 * no mail credentials, and building the transport eagerly would either throw
 * there or hold a pooled connection open on a server that may never send a
 * single message.
 */
let transporter: Transporter | null = null;

const getTransport = (): Transporter | null => {
  if (!isSmtpConfigured()) return null;
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: { user: env.smtp.user, pass: env.smtp.password },

    /**
     * Pooled, because enquiries arrive one at a time with long gaps: without a
     * pool every notification pays a fresh TLS handshake.
     */
    pool: true,
    maxConnections: 1,

    /**
     * Short timeouts. This send is awaited inside an HTTP request, so an SMTP
     * host that has gone dark must fail fast rather than hold the visitor's
     * browser on a spinner until the platform's own timeout fires.
     */
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  return transporter;
};

export interface Mail {
  to: string[];
  subject: string;
  text: string;
  html: string;
  /** Where a human "Reply" should go — the enquirer, not the SMTP account. */
  replyTo?: string;
}

/**
 * Send, reporting failure as a return value rather than an exception.
 *
 * Every caller here is a side effect of some other operation that has already
 * succeeded and been persisted, so a mail failure must never be allowed to
 * propagate and turn a saved enquiry into a 500 for the visitor.
 */
export const sendMail = async (mail: Mail): Promise<boolean> => {
  const transport = getTransport();

  if (!transport) {
    logger.warn("SMTP is not configured — skipping notification email");
    return false;
  }

  if (!mail.to.length) return false;

  try {
    await transport.sendMail({
      from: { name: env.smtp.fromName, address: env.smtp.from as string },
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: mail.replyTo,
    });

    logger.info(`Notification email sent to ${mail.to.length} recipient(s)`);
    return true;
  } catch (error) {
    // Logged, not thrown: see the note above.
    logger.error(
      `Failed to send notification email: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return false;
  }
};

/**
 * Prove the credentials work, for the settings screen's "Send test" button.
 *
 * Unlike sendMail this reports the provider's own message, because here the
 * failure IS the answer the admin asked for — "could not connect" tells them
 * nothing about which of host, port or password is wrong.
 */
export const verifyTransport = async (): Promise<{ ok: boolean; message: string }> => {
  const transport = getTransport();

  if (!transport) {
    return {
      ok: false,
      message: "SMTP is not configured on the server. Ask your developer to set it up.",
    };
  }

  try {
    await transport.verify();
    return { ok: true, message: "Connected to the mail server successfully" };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not reach the mail server",
    };
  }
};
