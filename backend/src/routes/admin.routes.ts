import { Router } from "express";
import { query } from "express-validator";
import * as adminController from "../controllers/admin.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { PERMISSIONS } from "../config/constants.js";
import { DASHBOARD_RANGES } from "../services/dashboard.service.js";

const router = Router();

// Everything below requires a session, and the Dashboard section — the page
// hiding itself is only an affordance; this is the boundary.
router.use(protect);
router.use(requirePermission(PERMISSIONS.DASHBOARD));

router.get(
  "/dashboard",
  query("range")
    .optional()
    .toInt()
    .isIn([...DASHBOARD_RANGES])
    .withMessage(`Range must be one of ${DASHBOARD_RANGES.join(", ")} days`),
  validate,
  adminController.getDashboard
);

export default router;
