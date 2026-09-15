import { body, param, type ValidationChain } from "express-validator";
import { PROCESS_ICON_IDS } from "../config/processIcons.js";

/**
 * Section text. Every field optional — the tab saves the whole form, but an
 * admin editing one heading should not be forced to resend the rest.
 *
 * The lengths mirror the schema's maxlength, so an over-long value is rejected
 * with a readable message rather than a Mongoose validation error.
 */
export const updateSectionRules: ValidationChain[] = [
  body("label").optional().isString().trim().isLength({ max: 80 }),
  body("title").optional().isString().trim().isLength({ max: 160 }),
  body("intro").optional().isString().trim().isLength({ max: 600 }),
  body("stepsHeading").optional().isString().trim().isLength({ max: 160 }),
  body("videoEnabled").optional().isBoolean().toBoolean(),
  body("videoHeading").optional().isString().trim().isLength({ max: 160 }),
  body("videoBody").optional().isString().trim().isLength({ max: 600 }),
  body("facilityEnabled").optional().isBoolean().toBoolean(),
  body("facilityHeading").optional().isString().trim().isLength({ max: 160 }),
  body("facilityBody").optional().isString().trim().isLength({ max: 600 }),
];

/*
 * The icon is checked against the allowlist here, which is the whole security
 * story for that field — the id reaches the frontend and selects a component,
 * so nothing outside the list may ever be stored.
 */
export const addStepRules: ValidationChain[] = [
  body("title").isString().trim().isLength({ min: 1, max: 120 }).withMessage("Give the step a name"),
  body("summary").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }),
  body("description").optional({ checkFalsy: true }).isString().trim().isLength({ max: 600 }),
  body("icon").optional().isString().trim().isIn(PROCESS_ICON_IDS).withMessage("Unknown icon"),
];

export const updateStepRules: ValidationChain[] = [
  param("stepId").isMongoId().withMessage("Unknown step"),
  body("title").optional().isString().trim().isLength({ min: 1, max: 120 }),
  body("summary").optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
  body("description").optional({ nullable: true }).isString().trim().isLength({ max: 600 }),
  body("icon").optional().isString().trim().isIn(PROCESS_ICON_IDS).withMessage("Unknown icon"),
  body("isActive").optional().isBoolean().toBoolean(),
];

export const stepIdRules: ValidationChain[] = [
  param("stepId").isMongoId().withMessage("Unknown step"),
];

export const photoIdRules: ValidationChain[] = [
  param("photoId").isMongoId().withMessage("Unknown photo"),
];

export const facilityPhotoRules: ValidationChain[] = [
  body("caption").optional({ checkFalsy: true }).isString().trim().isLength({ max: 200 }),
];

export const updateFacilityPhotoRules: ValidationChain[] = [
  param("photoId").isMongoId().withMessage("Unknown photo"),
  body("caption").optional({ nullable: true }).isString().trim().isLength({ max: 200 }),
  body("isActive").optional().isBoolean().toBoolean(),
];

export const reorderRules: ValidationChain[] = [
  body("ids").isArray({ min: 1, max: 100 }).withMessage("Send the full list of ids"),
  body("ids.*").isMongoId(),
];
