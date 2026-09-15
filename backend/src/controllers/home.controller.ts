import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import * as homeService from "../services/home.service.js";

/**
 * The hero content.
 *
 * One handler for both the website and the settings tab: unlike the process
 * section there is nothing hideable here, so there is no admin-only view to
 * separate out.
 */
export const getPublic = asyncHandler<Request>(async (_req, res) => {
  const section = await homeService.getSection();
  res.status(200).json(new ApiResponse(200, section));
});

/*
 * A whitelist rather than a spread of req.body: naming the fields is what keeps
 * the writable surface exactly this.
 */
const HERO_FIELDS = ["eyebrow", "title", "description", "ctaLabel", "imageAlt"] as const;

export const updateSection = asyncHandler<AuthedRequest>(async (req, res) => {
  // Only forward what was sent — undefined means "leave alone".
  const patch: homeService.SectionPatch = {};

  const hero = (req.body.hero ?? {}) as Record<string, unknown>;
  for (const field of HERO_FIELDS) {
    if (hero[field] !== undefined) {
      patch.hero = { ...patch.hero, [field]: hero[field] };
    }
  }

  const section = await homeService.updateSection(patch, req.user!._id as never);
  res.status(200).json(new ApiResponse(200, section, "Saved"));
});

/* ------------------------------------------------------------------ image */

export const setHeroImage = asyncHandler<AuthedRequest>(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please choose an image to upload");

  const section = await homeService.setHeroImage(req.file.buffer, req.file.originalname);
  res.status(200).json(new ApiResponse(200, section, "Image updated"));
});

export const clearHeroImage = asyncHandler<AuthedRequest>(async (_req, res) => {
  const section = await homeService.clearHeroImage();
  res.status(200).json(new ApiResponse(200, section, "Image removed"));
});
