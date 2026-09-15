import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

/**
 * A buyer the floor produces for.
 *
 * Deliberately thin: name, where they are, and how to reach someone. Anything
 * about a particular job belongs on the production order, not here.
 */
export interface ICompany extends Document {
  name: string;
  address: string;
  location: string;
  gst: string;
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
     * Free text, not split into person and phone. The client writes
     * "Ramesh Shah, 98765 43210" and splitting it would reject his own data.
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
