import type { Request } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import * as galleryService from "../services/gallery.service.js";

/** Public: the grid the website renders. No session required. */
export const listPublic = asyncHandler<Request>(async (_req, res) => {
  const items = await galleryService.listPublic();
  res.status(200).json(new ApiResponse(200, { items }));
});

/** Admin: everything, including hidden rows. */
export const listAll = asyncHandler<AuthedRequest>(async (_req, res) => {
  const items = await galleryService.listAll();
  res.status(200).json(new ApiResponse(200, { items }));
});

export const createImage = asyncHandler<AuthedRequest>(async (req, res) => {
  if (!req.file) throw new ApiError(400, "Please choose an image to upload");

  const { title, caption } = req.body as { title?: string; caption?: string };

  const image = await galleryService.createImage({
    buffer: req.file.buffer,
    filename: req.file.originalname,
    // Falls back to the filename so a hurried upload still has a usable label
    // rather than being rejected for a field nobody wants to type.
    title: (title ?? "").trim() || req.file.originalname.replace(/\.[^.]+$/, ""),
    caption: caption?.trim() || undefined,
    uploadedBy: req.user!._id as never,
  });

  res.status(201).json(new ApiResponse(201, image, "Image uploaded"));
});

export const updateImage = asyncHandler<AuthedRequest>(async (req, res) => {
  const { title, caption, isActive } = req.body as {
    title?: string;
    caption?: string;
    isActive?: boolean;
  };

  // Only forward what was sent — undefined means "leave alone".
  const patch: galleryService.UpdateInput = {};
  if (title !== undefined) patch.title = title;
  if (caption !== undefined) patch.caption = caption;
  if (isActive !== undefined) patch.isActive = isActive;

  const image = await galleryService.updateImage(req.params.id as string, patch);
  res.status(200).json(new ApiResponse(200, image, "Image updated"));
});

export const deleteImage = asyncHandler<AuthedRequest>(async (req, res) => {
  await galleryService.deleteImage(req.params.id as string);
  res.status(200).json(new ApiResponse(200, null, "Image deleted"));
});

export const reorder = asyncHandler<AuthedRequest>(async (req, res) => {
  const { ids } = req.body as { ids: string[] };
  await galleryService.reorder(ids);

  const items = await galleryService.listAll();
  res.status(200).json(new ApiResponse(200, { items }, "Order saved"));
});
