import { Router } from "express";
import * as themeController from "../controllers/theme.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updateThemeRules } from "../validators/theme.validator.js";
import { ROLES } from "../config/constants.js";

const router = Router();

/**
 * Public: the website fetches the active theme on first paint, with no session.
 * This is why the resource is mounted at the top level rather than under
 * /admin, whose router protects everything beneath it.
 */
router.get("/", themeController.getTheme);

/**
 * Owner-only. MAIN_ADMIN is the existing "super admin" — the seeded, protected
 * account — so this reuses that role rather than introducing a parallel one.
 */
router.put(
  "/",
  protect,
  restrictTo(ROLES.MAIN_ADMIN),
  updateThemeRules,
  validate,
  themeController.updateTheme
);

export default router;
