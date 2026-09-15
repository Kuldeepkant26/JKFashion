import { Router } from "express";
import * as galleryController from "../controllers/gallery.controller.js";
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
import {
  createImageRules,
  updateImageRules,
  imageIdRules,
  reorderRules,
} from "../validators/gallery.validator.js";

const router = Router();

/** Public: the website reads the grid with no session. */
router.get("/", galleryController.listPublic);

// Everything below is the admin's view of the same resource.
router.get("/all", ...canEditContent, galleryController.listAll);

/**
 * multer runs before the validators because it is what parses the multipart
 * body — without it `req.body` is empty and every text rule would fail.
 */
router.post(
  "/",
  ...canEditContent,
  uploadSingleImage,
  createImageRules,
  validate,
  galleryController.createImage
);

/*
 * Declared before the "/:id" routes. It cannot actually collide with them —
 * PUT is a different method from PATCH and DELETE — but keeping literal paths
 * above parameterised ones means a future PUT "/:id" cannot quietly swallow it.
 */
router.put("/reorder", ...canEditContent, reorderRules, validate, galleryController.reorder);

router.patch("/:id", ...canEditContent, updateImageRules, validate, galleryController.updateImage);

router.delete("/:id", ...canEditContent, imageIdRules, validate, galleryController.deleteImage);

export default router;
