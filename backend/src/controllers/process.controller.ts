import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import * as processService from "../services/process.service.js";

/** Public: what the website renders. No session required. */
export const getPublic = asyncHandler<Request>(async (_req, res) => {
  const section = await processService.getPublicSection();
  res.status(200).json(new ApiResponse(200, section));
});

/** Admin: everything, including hidden rows. */
export const getAdmin = asyncHandler<AuthedRequest>(async (_req, res) => {
  const section = await processService.getSection();
  res.status(200).json(new ApiResponse(200, section));
});

const TEXT_FIELDS = [
  "label",
  "title",
  "intro",
  "stepsHeading",
  "videoEnabled",
  "videoHeading",
  "videoBody",
  "facilityEnabled",
  "facilityHeading",
  "facilityBody",
] as const;

export const updateSection = asyncHandler<AuthedRequest>(async (req, res) => {
  // Only forward what was sent — undefined means "leave alone".
  const patch: processService.SectionPatch = {};
  for (const field of TEXT_FIELDS) {
    if (req.body[field] !== undefined) {
      (patch as Record<string, unknown>)[field] = req.body[field];
    }
  }

  const section = await processService.updateSection(patch, req.user!._id as never);
  res.status(200).json(new ApiResponse(200, section, "Section saved"));
});

/* ------------------------------------------------------------------ steps */

export const addStep = asyncHandler<AuthedRequest>(async (req, res) => {
  const { title, summary, description, icon } = req.body as {
    title: string;
    summary?: string;
    description?: string;
    icon?: string;
  };

  const section = await processService.addStep({ title, summary, description, icon });
  res.status(201).json(new ApiResponse(201, section, "Step added"));
});

export const updateStep = asyncHandler<AuthedRequest>(async (req, res) => {
  const { title, summary, description, icon, isActive } = req.body as {
    title?: string;
    summary?: string;
    description?: string;
    icon?: string;
    isActive?: boolean;
  };

  const patch: processService.StepPatch = {};
  if (title !== undefined) patch.title = title;
  if (summary !== undefined) patch.summary = summary;
  if (description !== undefined) patch.description = description;
  if (icon !== undefined) patch.icon = icon;
  if (isActive !== undefined) patch.isActive = isActive;

  const section = await processService.updateStep(req.params.stepId as string, patch);
  res.status(200).json(new ApiResponse(200, section, "Step saved"));
});

export const deleteStep = asyncHandler<AuthedRequest>(async (req, res) => {
  const section = await processService.deleteStep(req.params.stepId as string);
  res.status(200).json(new ApiResponse(200, section, "Step removed"));
});

export const reorderSteps = asyncHandler<AuthedRequest>(async (req, res) => {
  const { ids } = req.body as { ids: string[] };
  const section = await processService.reorderSteps(ids);
  res.status(200).json(new ApiResponse(200, section, "Order saved"));
});

/* ------------------------------------------------------------------ video */

export const setVideo = asyncHandler<AuthedRequest>(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please choose a video to upload");

  const section = await processService.setVideo(req.file.buffer, req.file.originalname);
  res.status(200).json(new ApiResponse(200, section, "Video uploaded"));
});

export const clearVideo = asyncHandler<AuthedRequest>(async (_req, res) => {
  const section = await processService.clearVideo();
  res.status(200).json(new ApiResponse(200, section, "Video removed"));
});

export const setVideoPoster = asyncHandler<AuthedRequest>(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please choose an image to upload");

  const section = await processService.setVideoPoster(
    req.file.buffer,
    req.file.originalname
  );

  res.status(200).json(new ApiResponse(200, section, "Cover image updated"));
});

/* --------------------------------------------------------------- facility */

export const addFacilityPhoto = asyncHandler<AuthedRequest>(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please choose an image to upload");

  const { caption } = req.body as { caption?: string };

  const section = await processService.addFacilityPhoto(
    req.file.buffer,
    req.file.originalname,
    caption?.trim() ?? ""
  );

  res.status(201).json(new ApiResponse(201, section, "Photo added"));
});

export const updateFacilityPhoto = asyncHandler<AuthedRequest>(async (req, res) => {
  const { caption, isActive } = req.body as { caption?: string; isActive?: boolean };

  const patch: processService.FacilityPatch = {};
  if (caption !== undefined) patch.caption = caption;
  if (isActive !== undefined) patch.isActive = isActive;

  const section = await processService.updateFacilityPhoto(
    req.params.photoId as string,
    patch
  );

  res.status(200).json(new ApiResponse(200, section, "Photo saved"));
});

export const deleteFacilityPhoto = asyncHandler<AuthedRequest>(async (req, res) => {
  const section = await processService.deleteFacilityPhoto(req.params.photoId as string);
  res.status(200).json(new ApiResponse(200, section, "Photo removed"));
});

export const reorderFacilityPhotos = asyncHandler<AuthedRequest>(async (req, res) => {
  const { ids } = req.body as { ids: string[] };
  const section = await processService.reorderFacilityPhotos(ids);
  res.status(200).json(new ApiResponse(200, section, "Order saved"));
});
