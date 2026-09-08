import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import * as enquiryService from "../services/enquiry.service.js";
import type { EnquiryStatus } from "../models/enquiry.model.js";

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

  res.status(201).json(
    new ApiResponse(
      201,
      { id: enquiry._id, createdAt: enquiry.createdAt },
      "Thank you — your enquiry has been sent"
    )
  );
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
