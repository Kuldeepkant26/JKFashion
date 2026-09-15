import { EnquirySetting, type IEnquirySetting } from "../models/enquirySetting.model.js";
import type { IEnquiry } from "../models/enquiry.model.js";
import { env, isSmtpConfigured } from "../config/env.js";
import { sendMail } from "../utils/mailer.js";
import { logger } from "../utils/logger.js";
import type { Types } from "mongoose";

const SINGLETON = { key: "enquiry" };

/**
 * The notification settings, creating the singleton on first read.
 *
 * Upsert-on-read for the same reason as the theme singleton: a fresh database
 * serves defaults rather than 404ing, so no seed step is needed.
 */
export const getSettings = async (): Promise<IEnquirySetting> =>
  EnquirySetting.findOneAndUpdate(
    SINGLETON,
    { $setOnInsert: { notifyEnabled: true, recipients: [] } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).exec() as Promise<IEnquirySetting>;

export interface EnquirySettingPatch {
  notifyEnabled?: boolean;
  recipients?: string[];
}

export const updateSettings = async (
  patch: EnquirySettingPatch,
  updatedBy: Types.ObjectId
): Promise<IEnquirySetting> => {
  const current = await getSettings();

  if (patch.notifyEnabled !== undefined) current.notifyEnabled = patch.notifyEnabled;

  if (patch.recipients !== undefined) {
    // De-duplicated after the schema lowercases, so "A@x.com" and "a@x.com"
    // cannot both sit in the list and double every notification.
    current.recipients = [...new Set(patch.recipients.map((r) => r.trim().toLowerCase()))];
  }

  current.updatedBy = updatedBy;
  await current.save();

  return current;
};

/** Escape before interpolating into the HTML body — this is visitor input. */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const formatDate = (date: Date): string =>
  date.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

/**
 * The notification body.
 *
 * Plain text and HTML are both provided: some mail clients — and most phone
 * notification previews — show the text part, and a notification whose preview
 * is blank defeats the point of sending it.
 */
const buildMail = (enquiry: IEnquiry) => {
  const rows: Array<[string, string]> = [
    ["Name", enquiry.name],
    ["Email", enquiry.email],
    ["Phone", enquiry.phone || "—"],
    ["Company", enquiry.company || "—"],
    ["Received", formatDate(enquiry.createdAt)],
  ];

  const text = [
    "New enquiry from the JK Fashion website",
    "",
    ...rows.map(([label, value]) => `${label}: ${value}`),
    "",
    "Message:",
    enquiry.message,
    "",
    `Reply directly to this email to reach ${enquiry.name}.`,
  ].join("\n");

  const html = `
<div style="margin:0;padding:24px;background:#faf7f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
    <div style="padding:20px 28px;background:#1c1917;">
      <p style="margin:0;color:#ffffff;font-size:15px;font-weight:600;letter-spacing:-0.01em;">
        New enquiry &middot; JK Fashion
      </p>
    </div>

    <div style="padding:28px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        ${rows
          .map(
            ([label, value]) => `
        <tr>
          <td style="padding:8px 0;color:#78716c;font-size:13px;width:88px;vertical-align:top;">${escapeHtml(
            label
          )}</td>
          <td style="padding:8px 0;color:#1c1917;font-size:14px;font-weight:500;">${escapeHtml(
            value
          )}</td>
        </tr>`
          )
          .join("")}
      </table>

      <div style="margin-top:20px;padding-top:20px;border-top:1px solid #e7e5e4;">
        <p style="margin:0 0 8px;color:#78716c;font-size:13px;">Message</p>
        <p style="margin:0;color:#1c1917;font-size:14px;line-height:1.65;white-space:pre-wrap;">${escapeHtml(
          enquiry.message
        )}</p>
      </div>

      <a href="mailto:${encodeURI(enquiry.email)}?subject=${encodeURIComponent(
        "Re: your enquiry — JK Fashion"
      )}"
         style="display:inline-block;margin-top:24px;padding:11px 20px;background:#1c1917;color:#ffffff;
                border-radius:10px;font-size:13px;font-weight:600;text-decoration:none;">
        Reply to ${escapeHtml(enquiry.name)}
      </a>
    </div>

    <div style="padding:16px 28px;background:#faf7f5;border-top:1px solid #e7e5e4;">
      <p style="margin:0;color:#a8a29e;font-size:12px;">
        Sent automatically from the JK Fashion website enquiry form.
      </p>
    </div>
  </div>
</div>`.trim();

  return { text, html };
};

/**
 * Exported for the notification preview/test tooling only — production code
 * should call notifyNewEnquiry, which applies the settings and the kill switch.
 */
export const buildEnquiryMail = buildMail;

/**
 * Notify the configured recipients about a new enquiry.
 *
 * Deliberately never throws. It is called after the enquiry has already been
 * saved and acknowledged, so any failure here must stay a logged warning — a
 * visitor whose message was stored should never see an error because our mail
 * host was down.
 */
export const notifyNewEnquiry = async (enquiry: IEnquiry): Promise<void> => {
  try {
    // The server-level kill switch wins over anything stored in the database.
    if (!env.notifyEnquiries) return;

    const settings = await getSettings();

    if (!settings.notifyEnabled || !settings.recipients.length) return;

    if (!isSmtpConfigured()) {
      logger.warn(
        `Enquiry ${String(enquiry._id)} saved, but SMTP is not configured — no email sent`
      );
      return;
    }

    const { text, html } = buildMail(enquiry);

    await sendMail({
      to: settings.recipients,
      subject: `New enquiry from ${enquiry.name}`,
      text,
      html,
      /**
       * Reply-To is the enquirer, so hitting Reply in the inbox reaches the
       * buyer rather than our own SMTP mailbox.
       */
      replyTo: enquiry.email,
    });
  } catch (error) {
    logger.error(
      `notifyNewEnquiry failed for ${String(enquiry._id)}: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
};
