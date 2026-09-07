import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { protect } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";
import { loginRules } from "../validators/auth.validator.js";

const router = Router();

router.post("/login", authLimiter, loginRules, validate, authController.login);

// Rate-limited too: refresh accepts a cookie rather than credentials, so it is
// reachable without signing in.
router.post("/refresh", authLimiter, authController.refresh);

router.post("/logout", protect, authController.logout);
router.get("/me", protect, authController.me);

export default router;
