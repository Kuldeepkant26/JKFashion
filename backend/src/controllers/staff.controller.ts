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
  const { name, email, password, permissions } = req.body as {
    name: string;
    email: string;
    password?: string;
    permissions?: staffService.CreateStaffInput["permissions"];
  };

  /*
   * A generated password when none is given, so the owner is never forced to
   * invent one — and what they invent is usually weaker than this.
   */
  const generated = password ? null : staffService.generatePassword();

  // Only the vetted fields. Notably NOT `role` — the service forces EDITOR.
  const user = await staffService.createStaff({
    name,
    email,
    password: password ?? (generated as string),
    permissions,
  });

  /*
   * The plaintext is returned exactly once, and only when WE generated it.
   * It is never stored, so this response is the only chance to see it — the
   * screen says as much. Echoing back a password the caller already typed
   * would put it in a log or a proxy for no benefit.
   */
  res.status(201).json(
    new ApiResponse(201, { ...user, generatedPassword: generated }, "Account created")
  );
});

export const updateStaff = asyncHandler<AuthedRequest>(async (req, res) => {
  const { name, isActive, permissions } = req.body as {
    name?: string;
    isActive?: boolean;
    permissions?: staffService.UpdateStaffInput["permissions"];
  };

  // Only forward what was sent — undefined means "leave alone".
  const patch: staffService.UpdateStaffInput = {};
  if (name !== undefined) patch.name = name;
  if (isActive !== undefined) patch.isActive = isActive;
  if (permissions !== undefined) patch.permissions = permissions;

  const user = await staffService.updateStaff(
    req.params.id as string,
    patch,
    req.user!._id as never
  );

  res.status(200).json(new ApiResponse(200, user, "Account updated"));
});

export const setPassword = asyncHandler<AuthedRequest>(async (req, res) => {
  const { password } = req.body as { password?: string };

  // Generated when the owner does not supply one — same reasoning as create.
  const generated = password ? null : staffService.generatePassword();

  const user = await staffService.setPassword(
    req.params.id as string,
    password ?? (generated as string)
  );

  res.status(200).json(
    new ApiResponse(200, { ...user, generatedPassword: generated }, "Password changed")
  );
});

export const deleteStaff = asyncHandler<AuthedRequest>(async (req, res) => {
  await staffService.deleteStaff(req.params.id as string, req.user!._id as never);

  res.status(200).json(new ApiResponse(200, null, "Account deleted"));
});
