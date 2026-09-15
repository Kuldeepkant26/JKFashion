import { Router } from "express";
import * as staffController from "../controllers/staff.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { ROLES } from "../config/constants.js";
import {
  createStaffRules,
  updateStaffRules,
  setPasswordRules,
  staffIdRules,
} from "../validators/staff.validator.js";

const router = Router();

/*
 * The gate is mounted once on the router rather than per route.
 *
 * This is the most sensitive surface in the API — it creates the accounts that
 * can sign in — so a route added later must not be able to ship without the
 * check. The same reasoning the settings section uses on the frontend.
 */
router.use(protect);
router.use(restrictTo(ROLES.MAIN_ADMIN));

router.get("/", staffController.listStaff);

router.post("/", createStaffRules, validate, staffController.createStaff);

// Literal path above the parameterised ones, so "/:id" cannot swallow it.
router.post("/:id/password", setPasswordRules, validate, staffController.setPassword);

router.patch("/:id", updateStaffRules, validate, staffController.updateStaff);

router.delete("/:id", staffIdRules, validate, staffController.deleteStaff);

export default router;
