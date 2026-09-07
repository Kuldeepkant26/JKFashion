import { Router } from "express";
import * as adminController from "../controllers/admin.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = Router();

// Everything below requires a session.
router.use(protect);

router.get("/stats", adminController.getStats);

export default router;
