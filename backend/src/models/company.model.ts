import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

/**
 * A buyer the floor produces for.
 *
 * Deliberately thin: name, where they are, and how to reach someone. Anything
 * about a particular job belongs on the production order, not here.
 */
/**
 * One person to reach at a buyer.
 *
 * Every field is optional individually — a buyer who gives only a mobile, or
 * only an accounts email, is normal — but a row with all three empty is
 * meaningless and is rejected by the validator rather than stored as noise.
 */
export interface ICompanyContact {
  name: string;
  phone: string;
  email: string;
}

const contactSchema = new Schema<ICompanyContact>(
  {
    name: { type: String, trim: true, maxlength: 120, default: "" },
    phone: { type: String, trim: true, maxlength: 40, default: "" },
    // Lowercased so one address is one value regardless of how it was typed.
    email: { type: String, trim: true, lowercase: true, maxlength: 160, default: "" },
  },
  { _id: false }
);

export interface ICompany extends Document {
  name: string;
  address: string;
  location: string;
  gst: string;
  contacts: ICompanyContact[];
  /** @deprecated Superseded by `contacts`. Read-only; see the schema note. */
  contact: string;
  isActive: boolean;
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const companySchema = new Schema<ICompany>(
  {
    /**
     * Unique so the order list's denormalised `companyName` is unambiguous —
     * two buyers with one name would make every order card a guess.
     *
     * The duplicate-key error is already translated to a readable 409 by the
     * error handler, so this needs no check in the service.
     */
    name: { type: String, required: true, trim: true, maxlength: 160, unique: true },

    address: { type: String, trim: true, maxlength: 400, default: "" },
    location: { type: String, trim: true, maxlength: 120, default: "" },

    // Uppercased so "24aaaaa..." and "24AAAAA..." are one value, not two.
    gst: { type: String, trim: true, uppercase: true, maxlength: 20, default: "" },

    /**
     * Who to reach, as structured rows. A buyer normally has more than one —
     * a merchandiser for the job and someone in accounts for the payment —
     * so this is a list rather than a single set of fields.
     */
    contacts: { type: [contactSchema], default: [] },

    /**
     * The original free-text contact. Kept, never written.
     *
     * Rows created before `contacts` existed hold a string like
     * "Ramesh Shah, 98765 43210", and dropping the path would delete that on
     * the next save. The service folds a non-empty value into `contacts` on
     * read, so the UI sees one shape; this exists only so the original text
     * survives until every row has been edited at least once.
     *
     * @deprecated Read-only compatibility shim.
     */
    contact: { type: String, trim: true, maxlength: 200, default: "" },

    /** Hidden rather than deleted, for a buyer who has stopped ordering. */
    isActive: { type: Boolean, default: true },

    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

/*
 * The list is alphabetical — a buyer is looked up by name, not by when they
 * were added. The unique constraint on `name` already provides an index for
 * that sort, so only the secondary ordering needs declaring.
 */
companySchema.index({ createdAt: -1 });

// Guard against OverwriteModelError when tsx watch re-evaluates this module.
export const Company: Model<ICompany> =
  (mongoose.models.Company as Model<ICompany>) ||
  mongoose.model<ICompany>("Company", companySchema);
