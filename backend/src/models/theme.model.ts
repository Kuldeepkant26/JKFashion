import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import {
  DEFAULT_THEME_ID,
  DEFAULT_FONT_ID,
  DEFAULT_NAVBAR_ID,
  DEFAULT_HERO_ID,
} from "../config/themes.js";

export interface IThemeSetting extends Document {
  key: string;
  themeId: string;
  fontId: string;
  navbarId: string;
  heroId: string;
  hiddenThemeIds: string[];
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

    /**
     * The typography pairing, stored by id for exactly the same reason as
     * themeId: the font stacks live in the frontend, so a compromised session
     * cannot push an arbitrary font-family — or a `url()` behind it — into
     * every visitor's page.
     */
    fontId: { type: String, required: true, default: DEFAULT_FONT_ID },

    /**
     * Which navbar and hero layout the public site renders. Stored by id for
     * the same reason as the palette and typography — the id selects a
     * component that lives in the frontend, so nothing arbitrary can be
     * injected into a visitor's page.
     */
    navbarId: { type: String, required: true, default: DEFAULT_NAVBAR_ID },
    heroId: { type: String, required: true, default: DEFAULT_HERO_ID },

    /**
     * Presets the owner has hidden from the picker.
     *
     * Hidden, not deleted: the presets are generated code, so removing one is
     * a code change. Storing the exclusions instead keeps the decision
     * reversible and means a hidden preset that is still the ACTIVE theme
     * keeps working rather than leaving the site unstyled.
     */
    hiddenThemeIds: { type: [String], default: [] },

    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

// Guard against OverwriteModelError when tsx watch re-evaluates this module.
export const ThemeSetting: Model<IThemeSetting> =
  (mongoose.models.ThemeSetting as Model<IThemeSetting>) ||
  mongoose.model<IThemeSetting>("ThemeSetting", themeSettingSchema);
