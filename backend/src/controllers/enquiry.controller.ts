import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as enquiryService from "../services/enquiry.service.js";
import * as notifyService from "../services/enquiryNotify.service.js";
import type { EnquiryStatus } from "../models/enquiry.model.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import { verifyTransport } from "../utils/mailer.js";
import { isSmtpConfigured } from "../config/env.js";

/**
 * Receive an enquiry from the public site. No session required.
 *
 * The response deliberately carries no database detail beyond an id and a
 * timestamp: this endpoint is reachable by anyone, and echoing the stored
 * document back would leak the schema for no benefit to the sender.
 */
export const createEnquiry = asyncHandler<Request>(async (req, res) => {
  const { name, email, phone, company, message } = req.body as {
    name: string;
    email: string;
    phone?: string;
    company?: string;
    message: string;
  };

  // Only the fields the validator vetted — never the raw body, which would let
  // a caller set `status` or any field added to the schema later.
  const enquiry = await enquiryService.createEnquiry({
    name,
    email,
    phone: phone || undefined,
    company: company || undefined,
    message,
  });

  /**
   * Notify the admin, but do not make the visitor wait for SMTP.
   *
   * The enquiry is already saved, which is the part that must not be lost. The
   * email is a convenience on top of it, so it is dispatched without `await`
   * and swallows its own errors — an unreachable mail host must not turn a
   * successful submission into a spinner or a 500.
   */
  void notifyService.notifyNewEnquiry(enquiry);

  res.status(201).json(
    new ApiResponse(
      201,
      { id: enquiry._id, createdAt: enquiry.createdAt },
      "Thank you — your enquiry has been sent"
    )
  );
});

/** The notification settings, for the admin Enquiries tab. */
export const getNotifySettings = asyncHandler<AuthedRequest>(async (_req, res) => {
  const settings = await notifyService.getSettings();

  res.status(200).json(
    new ApiResponse(200, {
      notifyEnabled: settings.notifyEnabled,
      recipients: settings.recipients,
      /**
       * Whether the server can actually send. Returned alongside the settings
       * so the screen can warn that a saved recipient list will not be
       * delivered until SMTP credentials are added, rather than letting the
       * owner believe notifications are live when they are not.
       */
      smtpConfigured: isSmtpConfigured(),
      updatedAt: settings.updatedAt,
    })
  );
});

/** Change who is notified. Owner-only, enforced by the router. */
export const updateNotifySettings = asyncHandler<AuthedRequest>(async (req, res) => {
  const { notifyEnabled, recipients } = req.body as {
    notifyEnabled?: boolean;
    recipients?: string[];
  };

  // Only forward what the caller sent — `undefined` means "leave alone", which
  // lets the screen toggle notifications without resending the address list.
  const patch: notifyService.EnquirySettingPatch = {};
  if (notifyEnabled !== undefined) patch.notifyEnabled = notifyEnabled;
  if (recipients !== undefined) patch.recipients = recipients;

  const settings = await notifyService.updateSettings(patch, req.user!._id as never);

  res.status(200).json(
    new ApiResponse(
      200,
      {
        notifyEnabled: settings.notifyEnabled,
        recipients: settings.recipients,
        smtpConfigured: isSmtpConfigured(),
        updatedAt: settings.updatedAt,
      },
      "Notification settings saved"
    )
  );
});

/**
 * Check the server's SMTP credentials, for the settings screen's test button.
 *
 * Verifies the connection rather than sending a real message: it answers "are
 * these credentials good" without putting a test email in the client's inbox
 * every time they open the tab.
 */
export const testNotifyTransport = asyncHandler<AuthedRequest>(async (_req, res) => {
  const result = await verifyTransport();

  res.status(200).json(new ApiResponse(200, result, result.message));
});

/** The admin list. Protected by the router. */
export const listEnquiries = asyncHandler<Request>(async (req, res) => {
  const { status, page, limit } = req.query as unknown as {
    status?: EnquiryStatus;
    page?: number;
    limit?: number;
  };

  const result = await enquiryService.listEnquiries({ status, page, limit });

  res.status(200).json(new ApiResponse(200, result));
});

export const updateEnquiry = asyncHandler<Request>(async (req, res) => {
  const { status } = req.body as { status: EnquiryStatus };
  const enquiry = await enquiryService.updateStatus(req.params.id as string, status);

  res.status(200).json(new ApiResponse(200, enquiry, "Enquiry updated"));
});

export const deleteEnquiry = asyncHandler<Request>(async (req, res) => {
  await enquiryService.deleteEnquiry(req.params.id as string);

  res.status(200).json(new ApiResponse(200, null, "Enquiry deleted"));
});
