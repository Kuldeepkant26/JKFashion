import { Router } from "express";
import * as homeController from "../controllers/home.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { uploadSingleImage } from "../middlewares/upload.middleware.js";
import { updateSectionRules } from "../validators/home.validator.js";

const router = Router();

/** Public: the website reads the hero with no session. */
router.get("/", homeController.getPublic);

// Everything below is the admin's view of the same resource.
router.patch("/", protect, updateSectionRules, validate, homeController.updateSection);

/* ------------------------------------------------------------------ image */

// multer runs before any validator: it is what parses the multipart body.
router.put("/hero/image", protect, uploadSingleImage, homeController.setHeroImage);

router.delete("/hero/image", protect, homeController.clearHeroImage);

export default router;
