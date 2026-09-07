import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { DEFAULT_THEME_ID } from "../config/themes.js";

export interface IThemeSetting extends Document {
  key: string;
  themeId: string;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const themeSettingSchema = new Schema<IThemeSetting>(
  {
    /**
     * Fixed discriminator, so this collection holds exactly one document.
     * The unique index is what enforces it: two writers racing to create the
     * singleton cannot both succeed, and the loser surfaces as a duplicate-key
     * error the existing errorHandler already maps to 409.
     */
    key: { type: String, default: "theme", unique: true, immutable: true },

    /**
     * Only the preset's id is stored, never its colours.
     *
     * The hex values live in the frontend, which is the only side that renders
     * them. Storing a validated id means a compromised admin session cannot
     * inject arbitrary CSS values into every visitor's page, and it means
     * editing a preset is a code change rather than silent database drift.
     */
    themeId: { type: String, required: true, default: DEFAULT_THEME_ID },

    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

// Guard against OverwriteModelError when tsx watch re-evaluates this module.
export const ThemeSetting: Model<IThemeSetting> =
  (mongoose.models.ThemeSetting as Model<IThemeSetting>) ||
  mongoose.model<IThemeSetting>("ThemeSetting", themeSettingSchema);
