import { body, type ValidationChain } from "express-validator";

/**
 * Hero text. Every field optional — the tab saves one field at a time, so an
 * admin editing a heading should not be forced to resend the rest.
 *
 * The lengths mirror the schema's maxlength, so an over-long value is rejected
 * with a readable message rather than a Mongoose validation error.
 */
export const updateSectionRules: ValidationChain[] = [
  body("hero.eyebrow").optional().isString().trim().isLength({ max: 80 }),
  body("hero.title").optional().isString().trim().isLength({ max: 80 }),
  body("hero.description").optional().isString().trim().isLength({ max: 600 }),
  body("hero.ctaLabel").optional().isString().trim().isLength({ max: 40 }),
  body("hero.imageAlt").optional().isString().trim().isLength({ max: 160 }),

  /*
   * `checkFalsy` is wrong for these: "" is a value the owner may deliberately
   * send to clear a detail and hide it from the site, so only `undefined`
   * means "leave alone".
   */
  body("contact.phone").optional({ nullable: true }).isString().trim().isLength({ max: 40 }),
  body("contact.address").optional({ nullable: true }).isString().trim().isLength({ max: 200 }),

  /*
   * Two chains for one field, because "" has to pass while "not an email" has
   * to fail. `checkFalsy` skips the format check for the empty string — which
   * is exactly how the owner clears the address and hides it from the site —
   * so a plain length chain is still needed to keep a 200-character value out
   * of the database.
   */
  body("contact.email").optional({ nullable: true }).isString().trim().isLength({ max: 160 }),
  body("contact.email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("That does not look like an email address"),
];
