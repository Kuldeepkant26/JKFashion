import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import themeRoutes from "./theme.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
// Top-level, not under /admin: the GET must stay unauthenticated for the site.
router.use("/theme", themeRoutes);

export default router;
