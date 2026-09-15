import { Router } from "express";
import * as homeController from "../controllers/home.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../config/constants.js";

/**
 * Every admin route in this file edits what the public site displays, so they
 * all sit behind the same SETTINGS grant. Aliased so the guard reads as one
 * unit at each call site rather than two arguments to remember to pair.
 */
const canEditContent = [protect, requirePermission(PERMISSIONS.SETTINGS)] as const;
import { validate } from "../middlewares/validate.middleware.js";
import { uploadSingleImage } from "../middlewares/upload.middleware.js";
import { updateSectionRules } from "../validators/home.validator.js";

const router = Router();

/** Public: the website reads the hero with no session. */
router.get("/", homeController.getPublic);

// Everything below is the admin's view of the same resource.
router.patch("/", ...canEditContent, updateSectionRules, validate, homeController.updateSection);

/* ------------------------------------------------------------------ image */

// multer runs before any validator: it is what parses the multipart body.
router.put("/hero/image", ...canEditContent, uploadSingleImage, homeController.setHeroImage);

router.delete("/hero/image", ...canEditContent, homeController.clearHeroImage);

export default router;
