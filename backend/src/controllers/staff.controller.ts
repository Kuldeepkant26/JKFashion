import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import type { AuthedRequest } from "../middlewares/auth.middleware.js";
import * as staffService from "../services/staff.service.js";

/** Everyone who can sign in. Owner-only — the router enforces it. */
export const listStaff = asyncHandler<AuthedRequest>(async (_req, res) => {
  const items = await staffService.listStaff();
  // An object, not a bare array — the house envelope shape.
  res.status(200).json(new ApiResponse(200, { items }));
});

export const createStaff = asyncHandler<AuthedRequest>(async (req, res) => {
  const { name, email, password } = req.body as {
    name: string;
    email: string;
    password: string;
  };

  // Only the vetted fields. Notably NOT `role` — the service forces EDITOR.
  const user = await staffService.createStaff({ name, email, password });

  res.status(201).json(new ApiResponse(201, user, "Account created"));
});

export const updateStaff = asyncHandler<AuthedRequest>(async (req, res) => {
  const { name, isActive } = req.body as { name?: string; isActive?: boolean };

  // Only forward what was sent — undefined means "leave alone".
  const patch: staffService.UpdateStaffInput = {};
  if (name !== undefined) patch.name = name;
  if (isActive !== undefined) patch.isActive = isActive;

  const user = await staffService.updateStaff(
    req.params.id as string,
    patch,
    req.user!._id as never
  );

  res.status(200).json(new ApiResponse(200, user, "Account updated"));
});

export const setPassword = asyncHandler<AuthedRequest>(async (req, res) => {
  const { password } = req.body as { password: string };

  const user = await staffService.setPassword(req.params.id as string, password);

  res.status(200).json(new ApiResponse(200, user, "Password changed"));
});

export const deleteStaff = asyncHandler<AuthedRequest>(async (req, res) => {
  await staffService.deleteStaff(req.params.id as string, req.user!._id as never);

  res.status(200).json(new ApiResponse(200, null, "Account deleted"));
});
