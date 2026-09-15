import { Router } from "express";
import * as companyController from "../controllers/company.controller.js";
import * as orderController from "../controllers/productionOrder.controller.js";
import { protect, restrictTo, requirePermission } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import { uploadSingleImage } from "../middlewares/upload.middleware.js";
import { ROLES, PERMISSIONS } from "../config/constants.js";
import {
  listCompanyRules,
  createCompanyRules,
  updateCompanyRules,
  companyIdRules,
} from "../validators/company.validator.js";
import {
  listOrderRules,
  createOrderRules,
  updateOrderRules,
  orderIdRules,
  setStatusRules,
  logProductionRules,
  logEntryIdRules,
} from "../validators/productionOrder.validator.js";

const router = Router();

/*
 * Every route here needs a session — production data has no public face, so
 * the gate is mounted once on the router rather than repeated per route.
 *
 * Staff accounts (EDITOR) may read and write; only the owner may delete. That
 * split follows the existing precedent on enquiries: destructive actions are
 * owner-only, routine ones are open to any signed-in admin.
 */
router.use(protect);
// Mounted once for the same reason as `protect`: a route added later must not
// be able to ship without the section check.
router.use(requirePermission(PERMISSIONS.INVENTORY));

/* -------------------------------------------------------------- companies */

router.get("/companies", listCompanyRules, validate, companyController.listCompanies);

router.post("/companies", createCompanyRules, validate, companyController.createCompany);

router.get("/companies/:id", companyIdRules, validate, companyController.getCompany);

router.patch("/companies/:id", updateCompanyRules, validate, companyController.updateCompany);

/** Destructive, so it is owner-only rather than any signed-in admin. */
router.delete(
  "/companies/:id",
  restrictTo(ROLES.MAIN_ADMIN),
  companyIdRules,
  validate,
  companyController.deleteCompany
);

/* ----------------------------------------------------------------- orders */

/*
 * Literal paths are declared above the parameterised ones throughout, so
 * "/orders/:id" cannot quietly swallow "/orders/summary".
 */
router.get("/summary", orderController.getSummary);

router.get("/orders", listOrderRules, validate, orderController.listOrders);

/*
 * multer runs before the validators because it is what parses the multipart
 * body — without it `req.body` is empty and every text rule would fail. The
 * order create is multipart because it may carry a design image.
 */
router.post(
  "/orders",
  uploadSingleImage,
  createOrderRules,
  validate,
  orderController.createOrder
);

router.get("/orders/:id", orderIdRules, validate, orderController.getOrder);

router.patch("/orders/:id", updateOrderRules, validate, orderController.updateOrder);

router.patch("/orders/:id/status", setStatusRules, validate, orderController.setStatus);

router.post("/orders/:id/log", logProductionRules, validate, orderController.logProduction);

/** Rewriting history, so owner-only. A correction is a negative entry. */
router.delete(
  "/orders/:id/log/:entryId",
  restrictTo(ROLES.MAIN_ADMIN),
  logEntryIdRules,
  validate,
  orderController.deleteLogEntry
);

router.put(
  "/orders/:id/image",
  uploadSingleImage,
  orderIdRules,
  validate,
  orderController.setImage
);

router.delete("/orders/:id/image", orderIdRules, validate, orderController.clearImage);

/** Destructive, so it is owner-only rather than any signed-in admin. */
router.delete(
  "/orders/:id",
  restrictTo(ROLES.MAIN_ADMIN),
  orderIdRules,
  validate,
  orderController.deleteOrder
);

export default router;
