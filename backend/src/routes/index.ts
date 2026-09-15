import { Router } from "express";
import healthRoutes from "./health.routes.js";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import themeRoutes from "./theme.routes.js";
import enquiryRoutes from "./enquiry.routes.js";
import galleryRoutes from "./gallery.routes.js";
import processRoutes from "./process.routes.js";
import homeRoutes from "./home.routes.js";
import staffRoutes from "./staff.routes.js";
import inventoryRoutes from "./inventory.routes.js";

const router = Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/admin", adminRoutes);
// Owner-only throughout: these are the accounts that can sign in.
router.use("/staff", staffRoutes);
// Fully private: production data has no public face, so the whole router is
// behind `protect` rather than mounted top-level for a public GET.
router.use("/inventory", inventoryRoutes);
// Top-level, not under /admin: the GET must stay unauthenticated for the site.
router.use("/theme", themeRoutes);
// Top-level too: the POST must stay unauthenticated for the public form.
router.use("/enquiries", enquiryRoutes);
// Top-level too: the GET must stay unauthenticated for the public grid.
router.use("/gallery", galleryRoutes);
// Top-level too: the GET must stay unauthenticated for the public section.
router.use("/process", processRoutes);
// Top-level too: the GET must stay unauthenticated for the navbar and hero.
router.use("/home", homeRoutes);

export default router;
