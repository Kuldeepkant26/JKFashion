import { Router } from "express";
import * as companyController from "../controllers/company.controller.js";
import * as orderController from "../controllers/productionOrder.controller.js";
import * as sampleController from "../controllers/sample.controller.js";
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
  previewOrderNumberRules,
  createOrderRules,
  updateOrderRules,
  orderIdRules,
  setStatusRules,
  logProductionRules,
  logEntryIdRules,
} from "../validators/productionOrder.validator.js";
import {
  listSampleRules,
  previewSampleNumberRules,
  createSampleRules,
  updateSampleRules,
  sampleIdRules,
  setSampleStatusRules,
} from "../validators/sample.validator.js";

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

/** The buyer's dashboard: figures and history in one read. */
router.get(
  "/companies/:id/overview",
  companyIdRules,
  validate,
  companyController.getCompanyOverview
);

/**
 * The buyer's logo has its own endpoints — it is never set as a side effect
 * of saving the company or of uploading a design.
 */
router.put(
  "/companies/:id/logo",
  uploadSingleImage,
  companyIdRules,
  validate,
  companyController.setLogo
);

router.delete("/companies/:id/logo", companyIdRules, validate, companyController.clearLogo);

/** Destructive, so it is owner-only rather than any signed-in admin. */
router.delete(
  "/companies/:id",
  restrictTo(ROLES.MAIN_ADMIN),
  companyIdRules,
  validate,
  companyController.deleteCompany
);

/* ---------------------------------------------------------------- samples */

/** Literal, so it is declared before "/samples/:id". */
router.get(
  "/samples/next-number",
  previewSampleNumberRules,
  validate,
  sampleController.previewSampleNumber
);

router.get("/samples", listSampleRules, validate, sampleController.listSamples);

/** Multipart, because a sample may carry a design image — multer parses first. */
router.post(
  "/samples",
  uploadSingleImage,
  createSampleRules,
  validate,
  sampleController.createSample
);

router.get("/samples/:id", sampleIdRules, validate, sampleController.getSample);

router.patch("/samples/:id", updateSampleRules, validate, sampleController.updateSample);

router.patch(
  "/samples/:id/status",
  setSampleStatusRules,
  validate,
  sampleController.setStatus
);

router.put(
  "/samples/:id/image",
  uploadSingleImage,
  sampleIdRules,
  validate,
  sampleController.setImage
);

router.delete("/samples/:id/image", sampleIdRules, validate, sampleController.clearImage);

/** Destructive, so it is owner-only — like deleting an order. */
router.delete(
  "/samples/:id",
  restrictTo(ROLES.MAIN_ADMIN),
  sampleIdRules,
  validate,
  sampleController.deleteSample
);

/* ----------------------------------------------------------------- orders */

/*
 * Literal paths are declared above the parameterised ones throughout, so
 * "/orders/:id" cannot quietly swallow "/orders/summary".
 */
router.get("/summary", orderController.getSummary);

/** Literal, so it is declared before "/orders/:id" like "/summary" above. */
router.get(
  "/orders/next-number",
  previewOrderNumberRules,
  validate,
  orderController.previewOrderNumber
);

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
