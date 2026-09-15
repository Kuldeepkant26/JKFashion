import { Router } from "express";
import * as enquiryController from "../controllers/enquiry.controller.js";
import { protect, restrictTo, requirePermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { enquiryLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
  createEnquiryRules,
  listEnquiryRules,
  updateEnquiryRules,
  updateNotifyRules,
  enquiryIdRules,
} from "../validators/enquiry.validator.js";
import { ROLES, PERMISSIONS } from "../config/constants.js";

const router = Router();

/**
 * Public: the website's enquiry form posts here with no session.
 *
 * Rate limited before validation so a flood costs a counter increment rather
 * than a full validation pass, and mounted at the top level rather than under
 * /admin, whose router protects everything beneath it.
 */
router.post("/", enquiryLimiter, createEnquiryRules, validate, enquiryController.createEnquiry);

/*
 * Everything below is the admin's view of the same resource.
 *
 * Gated on the ENQUIRIES permission rather than the owner role, so an editor
 * the owner has granted this section can read and triage. The notification
 * settings further down stay owner-only regardless — see the note there.
 */
router.get(
  "/",
  protect,
  requirePermission(PERMISSIONS.ENQUIRIES),
  listEnquiryRules,
  validate,
  enquiryController.listEnquiries
);

/**
 * Notification settings — who gets emailed when an enquiry arrives.
 *
 * Declared BEFORE the `/:id` routes below: Express matches in order, and
 * "settings" would otherwise be captured as an enquiry id and rejected by the
 * isMongoId rule.
 *
 * Owner-only for writes, matching how appearance settings and enquiry deletion
 * already work — where the client's mail is delivered is not an editor's call.
 */
router.get(
  "/settings/notifications",
  protect,
  restrictTo(ROLES.MAIN_ADMIN),
  enquiryController.getNotifySettings
);

router.put(
  "/settings/notifications",
  protect,
  restrictTo(ROLES.MAIN_ADMIN),
  updateNotifyRules,
  validate,
  enquiryController.updateNotifySettings
);

/** Checks the server's SMTP credentials without sending a real message. */
router.post(
  "/settings/notifications/test",
  protect,
  restrictTo(ROLES.MAIN_ADMIN),
  enquiryController.testNotifyTransport
);

router.patch(
  "/:id",
  protect,
  requirePermission(PERMISSIONS.ENQUIRIES),
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
