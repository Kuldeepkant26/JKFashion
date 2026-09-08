import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import themeRoutes from "./theme.routes.js";
import enquiryRoutes from "./enquiry.routes.js";
import galleryRoutes from "./gallery.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
// Top-level, not under /admin: the GET must stay unauthenticated for the site.
router.use("/theme", themeRoutes);
// Top-level too: the POST must stay unauthenticated for the public form.
router.use("/enquiries", enquiryRoutes);
// Top-level too: the GET must stay unauthenticated for the public grid.
router.use("/gallery", galleryRoutes);

export default router;
