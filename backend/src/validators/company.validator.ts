import { body, param, query, type ValidationChain } from "express-validator";

/**
 * The lengths mirror the schema's maxlength, so an over-long value is rejected
 * with a readable message rather than a Mongoose validation error.
 */
export const listCompanyRules: ValidationChain[] = [
  query("search").optional().isString().trim().isLength({ max: 100 }),
  query("page").optional().isInt({ min: 1 }).toInt(),
  query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
];

/** More than this is an address book, not a buyer's contact details. */
const MAX_CONTACTS = 10;

const isFilled = (value: unknown): boolean =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Contact rows.
 *
 * Each field is optional on its own — plenty of buyers give only a mobile, or
 * only an accounts email — but a row with none of the three is not a contact,
 * so it is rejected rather than stored as an empty entry that renders as a
 * blank line for ever. The message names the row, because on a form with three
 * of them "one of the fields is required" does not say which.
 */
const contactRules = (): ValidationChain[] => [
  body("contacts")
    .optional()
    .isArray({ max: MAX_CONTACTS })
    .withMessage(`Add at most ${MAX_CONTACTS} contacts`),
  body("contacts.*.name").optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
  body("contacts.*.phone").optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body("contacts.*.email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Enter a valid email")
    .bail()
    .isLength({ max: 160 })
    .normalizeEmail({ gmail_remove_dots: false }),
  body("contacts")
    .optional()
    .custom((contacts: unknown) => {
      if (!Array.isArray(contacts)) return true;

      const empty = contacts.findIndex(
        (c: Record<string, unknown>) =>
          !isFilled(c?.name) && !isFilled(c?.phone) && !isFilled(c?.email)
      );

      if (empty !== -1) {
        throw new Error(
          `Contact ${empty + 1} needs a name, a number or an email — remove the row if it is not needed`
        );
      }

      return true;
    }),
];

export const createCompanyRules: ValidationChain[] = [
  body("name")
    .isString()
    .trim()
    .isLength({ min: 1, max: 160 })
    .withMessage("Give the company a name"),
  body("address").optional({ checkFalsy: true }).isString().trim().isLength({ max: 400 }),
  body("location").optional({ checkFalsy: true }).isString().trim().isLength({ max: 120 }),
  body("gst").optional({ checkFalsy: true }).isString().trim().isLength({ max: 20 }),
  ...contactRules(),
];

export const updateCompanyRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown company"),
  body("name").optional().isString().trim().isLength({ min: 1, max: 160 }),
  // `nullable` on update so a field can be explicitly cleared.
  body("address").optional({ nullable: true }).isString().trim().isLength({ max: 400 }),
  body("location").optional({ nullable: true }).isString().trim().isLength({ max: 120 }),
  body("gst").optional({ nullable: true }).isString().trim().isLength({ max: 20 }),
  ...contactRules(),
  body("isActive").optional().isBoolean().toBoolean(),
];

export const companyIdRules: ValidationChain[] = [
  param("id").isMongoId().withMessage("Unknown company"),
];
