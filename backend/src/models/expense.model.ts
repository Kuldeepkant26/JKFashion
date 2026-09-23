import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

/**
 * An external cost — transport, job work, a repair.
 *
 * Deliberately not tied to a stock item or an order: these are the things paid
 * for that do not arrive as material, which is exactly why the client tracks
 * them on their own tab.
 */
export interface IExpense extends Document {
  date: Date;
  description: string;
  amountPaise: number;
  createdBy?: Types.ObjectId;
  createdByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const expenseSchema = new Schema<IExpense>(
  {
    /** Normalised to midnight UTC — an expense belongs to a day. */
    date: { type: Date, required: true, index: true },

    description: { type: String, required: true, trim: true, maxlength: 300 },

    /**
     * Money, as a whole number of paise.
     *
     * Never rupees in a float: `0.1 + 0.2 !== 0.3`, and a month's total that
     * drifts by a fraction is the sort of error nobody finds until they add the
     * column up by hand. Rupees exist only at the edges — what is typed into
     * the form, and what is printed back.
     */
    amountPaise: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: Number.isInteger,
        message: "Amount must be a whole number of paise",
      },
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
    createdByName: { type: String, trim: true, maxlength: 80, default: "" },
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1, createdAt: -1 });

export const Expense: Model<IExpense> =
  (mongoose.models.Expense as Model<IExpense>) ||
  mongoose.model<IExpense>("Expense", expenseSchema);
