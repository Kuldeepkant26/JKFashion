import { Router } from "express";
import * as galleryController from "../controllers/gallery.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
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
router.get("/all", protect, galleryController.listAll);

/**
 * multer runs before the validators because it is what parses the multipart
 * body — without it `req.body` is empty and every text rule would fail.
 */
router.post(
  "/",
  protect,
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
router.put("/reorder", protect, reorderRules, validate, galleryController.reorder);

router.patch("/:id", protect, updateImageRules, validate, galleryController.updateImage);

router.delete("/:id", protect, imageIdRules, validate, galleryController.deleteImage);

export default router;
