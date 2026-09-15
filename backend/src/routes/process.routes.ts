import { Router } from "express";
import * as processController from "../controllers/process.controller.js";
import { protect, requirePermission } from "../middlewares/auth.middleware.js";
import { PERMISSIONS } from "../config/constants.js";

/**
 * Every admin route in this file edits what the public site displays, so they
 * all sit behind the same SETTINGS grant. Aliased so the guard reads as one
 * unit at each call site rather than two arguments to remember to pair.
 */
const canEditContent = [protect, requirePermission(PERMISSIONS.SETTINGS)] as const;
import { validate } from "../middlewares/validate.middleware.js";
import {
  uploadSingleImage,
  uploadSingleVideo,
} from "../middlewares/upload.middleware.js";
import {
  updateSectionRules,
  addStepRules,
  updateStepRules,
  stepIdRules,
  photoIdRules,
  facilityPhotoRules,
  updateFacilityPhotoRules,
  reorderRules,
} from "../validators/process.validator.js";

const router = Router();

/** Public: the website reads the section with no session. */
router.get("/", processController.getPublic);

// Everything below is the admin's view of the same resource.
router.get("/admin", ...canEditContent, processController.getAdmin);

router.patch("/", ...canEditContent, updateSectionRules, validate, processController.updateSection);

/* ------------------------------------------------------------------ steps */

/*
 * Literal paths are declared above the parameterised ones throughout, so a
 * future "/:id" route cannot quietly swallow "/reorder" or "/video".
 */
router.put("/steps/reorder", ...canEditContent, reorderRules, validate, processController.reorderSteps);

router.post("/steps", ...canEditContent, addStepRules, validate, processController.addStep);

router.patch("/steps/:stepId", ...canEditContent, updateStepRules, validate, processController.updateStep);

router.delete("/steps/:stepId", ...canEditContent, stepIdRules, validate, processController.deleteStep);

/* ------------------------------------------------------------------ video */

router.put("/video", ...canEditContent, uploadSingleVideo, processController.setVideo);

router.delete("/video", ...canEditContent, processController.clearVideo);

router.put("/video/poster", ...canEditContent, uploadSingleImage, processController.setVideoPoster);

/* --------------------------------------------------------------- facility */

router.put(
  "/facility/reorder",
  ...canEditContent,
  reorderRules,
  validate,
  processController.reorderFacilityPhotos
);

router.post(
  "/facility",
  ...canEditContent,
  uploadSingleImage,
  facilityPhotoRules,
  validate,
  processController.addFacilityPhoto
);

router.patch(
  "/facility/:photoId",
  ...canEditContent,
  updateFacilityPhotoRules,
  validate,
  processController.updateFacilityPhoto
);

router.delete(
  "/facility/:photoId",
  ...canEditContent,
  photoIdRules,
  validate,
  processController.deleteFacilityPhoto
);

export default router;
