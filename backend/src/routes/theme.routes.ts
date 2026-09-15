import { Router } from "express";
import * as themeController from "../controllers/theme.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updateThemeRules } from "../validators/theme.validator.js";
import { PERMISSIONS } from "../config/constants.js";

const router = Router();

/**
 * Public: the website fetches the active theme on first paint, with no session.
 * This is why the resource is mounted at the top level rather than under
 * /admin, whose router protects everything beneath it.
 */
router.get("/", themeController.getTheme);

/**
 * Gated on the SETTINGS permission, which the owner always holds and an editor
 * holds only if granted. Previously owner-only by role.
 */
router.put(
  "/",
  protect,
  requirePermission(PERMISSIONS.SETTINGS),
  updateThemeRules,
  validate,
  themeController.updateTheme
);

export default router;
