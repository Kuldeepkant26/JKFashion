import { body, type ValidationChain } from "express-validator";
import { MAX_FABRIC_ROWS } from "../models/fabricRow.js";

/**
 * Fabric rows arrive as an array in JSON, or as JSON text inside a multipart
 * body (a new sample or order carrying a design image). Text is parsed here;
 * anything that is not valid JSON is left as it is and fails the array check.
 */
const parseJsonText = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

/** The `fabrics` list and each row's fields — shared by samples and orders. */
export const fabricRules = (): ValidationChain[] => {
  const text = (field: string, max: number, label: string) =>
    body(`fabrics.*.${field}`)
      .optional({ nullable: true })
      .isString()
      .withMessage(`${label} must be text`)
      .trim()
      .isLength({ max })
      .withMessage(`Keep the ${label.toLowerCase()} under ${max} characters`);

  return [
    // null is allowed: like the other fields, it means "clear them".
    body("fabrics")
      .optional({ nullable: true })
      .customSanitizer(parseJsonText)
      .isArray()
      .withMessage("The fabric rows could not be read")
      .bail()
      .isArray({ max: MAX_FABRIC_ROWS })
      .withMessage(`Add up to ${MAX_FABRIC_ROWS} fabric rows`),
    body("fabrics.*").isObject().withMessage("A fabric row could not be read"),
    text("fabricType", 80, "Fabric type"),
    text("fabricWidth", 40, "Fabric width"),
    text("yarnType", 80, "Yarn type"),
    text("optionNumber", 60, "Option number"),
    text("yarnColor", 60, "Yarn colour"),
  ];
};
