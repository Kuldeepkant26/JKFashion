import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

/** How many addresses the owner may notify. */
export const MAX_NOTIFY_RECIPIENTS = 5;

export interface IEnquirySetting extends Document {
  key: string;
  notifyEnabled: boolean;
  recipients: string[];
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const enquirySettingSchema = new Schema<IEnquirySetting>(
  {
    /**
     * Fixed discriminator, so this collection holds exactly one document —
     * the same pattern as the theme singleton, and the unique index is what
     * enforces it against two writers racing to create it.
     */
    key: { type: String, default: "enquiry", unique: true, immutable: true },

    /**
     * The owner's switch, separate from the server's SMTP credentials. One is
     * "should we notify", the other "can we" — collapsing them would mean
     * turning notifications off required a deploy.
     */
    notifyEnabled: { type: Boolean, default: true },

    /**
     * Where notifications go. Stored lowercase so the same mailbox typed two
     * ways is one entry, and capped in the validator rather than here so the
     * limit can report a readable message.
     */
    recipients: {
      type: [{ type: String, trim: true, lowercase: true, maxlength: 200 }],
      default: [],
    },

    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

// Guard against OverwriteModelError when tsx watch re-evaluates this module.
export const EnquirySetting: Model<IEnquirySetting> =
  (mongoose.models.EnquirySetting as Model<IEnquirySetting>) ||
  mongoose.model<IEnquirySetting>("EnquirySetting", enquirySettingSchema);
