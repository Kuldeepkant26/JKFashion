import { Router } from "express";
import * as enquiryController from "../controllers/enquiry.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { enquiryLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  createEnquiryRules,
  listEnquiryRules,
  updateEnquiryRules,
  enquiryIdRules,
} from "../validators/enquiry.validator.js";
import { ROLES } from "../config/constants.js";

const router = Router();

/**
 * Public: the website's enquiry form posts here with no session.
 *
 * Rate limited before validation so a flood costs a counter increment rather
 * than a full validation pass, and mounted at the top level rather than under
 * /admin, whose router protects everything beneath it.
 */
router.post("/", enquiryLimiter, createEnquiryRules, validate, enquiryController.createEnquiry);

// Everything below is the admin's view of the same resource.
router.get("/", protect, listEnquiryRules, validate, enquiryController.listEnquiries);

router.patch(
  "/:id",
  protect,
  updateEnquiryRules,
  validate,
  enquiryController.updateEnquiry
);

/** Destructive, so it is owner-only rather than any signed-in admin. */
router.delete(
  "/:id",
  protect,
  restrictTo(ROLES.MAIN_ADMIN),
  enquiryIdRules,
  validate,
  enquiryController.deleteEnquiry
);

export default router;
