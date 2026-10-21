import { Schema } from "mongoose";

/**
 * One fabric a design is made on, with the yarn for it. Samples and orders
 * both carry a list of these — the same design on cambric and on georgette,
 * or in two colour options — so they are rows, not single fields.
 * `optionNumber` is the buyer's option (colourway) for that row.
 *
 * Shared by the sample and production-order models so the two stay the same
 * shape: a sample's rows become its order's rows when it is converted.
 */
export interface IFabricRow {
  fabricType: string;
  fabricWidth: string;
  yarnType: string;
  optionNumber: string;
  yarnColor: string;
}

/** The text fields of a row, in the order the forms show them. */
export const FABRIC_ROW_FIELDS = [
  "fabricType",
  "fabricWidth",
  "yarnType",
  "optionNumber",
  "yarnColor",
] as const satisfies readonly (keyof IFabricRow)[];

/** More rows than this is a mistake, not a design. */
export const MAX_FABRIC_ROWS = 20;

/**
 * Before rows, a sample or order had one fabric in these four flat fields.
 * Nothing writes them now; see `legacyFabricPaths`.
 */
export const LEGACY_FABRIC_FIELDS = ["fabricType", "fabricWidth", "yarnType", "yarnColor"] as const;

const fabricRowSchema = new Schema<IFabricRow>(
  {
    fabricType: { type: String, trim: true, maxlength: 80, default: "" },
    /** Text, not a number: the floor writes "44 inch" and `60"`. */
    fabricWidth: { type: String, trim: true, maxlength: 40, default: "" },
    yarnType: { type: String, trim: true, maxlength: 80, default: "" },
    optionNumber: { type: String, trim: true, maxlength: 60, default: "" },
    yarnColor: { type: String, trim: true, maxlength: 60, default: "" },
  },
  // Values, not records: the list is replaced as a whole when it is saved.
  { _id: false }
);

/** The `fabrics` path, as both models declare it. */
export const fabricsPath = {
  type: [fabricRowSchema],
  default: [],
  validate: {
    validator: (rows: unknown[]) => rows.length <= MAX_FABRIC_ROWS,
    message: `Up to ${MAX_FABRIC_ROWS} fabric rows`,
  },
};

/**
 * The legacy flat fields. They stay declared so a record saved that way still
 * reads — utils/fabricRows shows them as its first row until migrate:samples
 * moves them into `fabrics` — and saving a record's rows clears them. No
 * defaults, so new records do not carry them.
 */
export const legacyFabricPaths = {
  fabricType: { type: String, trim: true, maxlength: 80 },
  fabricWidth: { type: String, trim: true, maxlength: 40 },
  yarnType: { type: String, trim: true, maxlength: 80 },
  yarnColor: { type: String, trim: true, maxlength: 60 },
};
