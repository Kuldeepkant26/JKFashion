import { Router } from "express";
import * as processController from "../controllers/process.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
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
router.get("/admin", protect, processController.getAdmin);

router.patch("/", protect, updateSectionRules, validate, processController.updateSection);

/* ------------------------------------------------------------------ steps */

/*
 * Literal paths are declared above the parameterised ones throughout, so a
 * future "/:id" route cannot quietly swallow "/reorder" or "/video".
 */
router.put("/steps/reorder", protect, reorderRules, validate, processController.reorderSteps);

router.post("/steps", protect, addStepRules, validate, processController.addStep);

router.patch("/steps/:stepId", protect, updateStepRules, validate, processController.updateStep);

router.delete("/steps/:stepId", protect, stepIdRules, validate, processController.deleteStep);

/* ------------------------------------------------------------------ video */

router.put("/video", protect, uploadSingleVideo, processController.setVideo);

router.delete("/video", protect, processController.clearVideo);

router.put("/video/poster", protect, uploadSingleImage, processController.setVideoPoster);

/* --------------------------------------------------------------- facility */

router.put(
  "/facility/reorder",
  protect,
  reorderRules,
  validate,
  processController.reorderFacilityPhotos
);

router.post(
  "/facility",
  protect,
  uploadSingleImage,
  facilityPhotoRules,
  validate,
  processController.addFacilityPhoto
);

router.patch(
  "/facility/:photoId",
  protect,
  updateFacilityPhotoRules,
  validate,
  processController.updateFacilityPhoto
);

router.delete(
  "/facility/:photoId",
  protect,
  photoIdRules,
  validate,
  processController.deleteFacilityPhoto
);

export default router;
