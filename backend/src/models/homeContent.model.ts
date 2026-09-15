import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { type IMediaRef } from "./processSection.model.js";

/**
 * A Cloudinary asset as stored on a content row.
 *
 * Declared again rather than imported from processSection.model.ts: a Mongoose
 * schema instance carries its own state and is not meant to be shared between
 * models. The TypeScript interface IS shared, which is what keeps the two in
 * step where it matters.
 */
const mediaRefSchema = new Schema<IMediaRef>(
  {
    publicId: { type: String },
    url: { type: String },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

/** The hero's editable content. Shared by every hero variant. */
export interface IHomeHero {
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  image: IMediaRef;
  imageAlt: string;
}

export interface IHomeContent extends Document {
  key: string;
  hero: IHomeHero;

  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const homeContentSchema = new Schema<IHomeContent>(
  {
    /**
     * Fixed discriminator, so this collection holds exactly one document — the
     * same singleton pattern as the theme and process settings, and the unique
     * index is what enforces it against two racing writers.
     */
    key: { type: String, default: "home", unique: true, immutable: true },

    /*
     * The lengths here are tighter than they look. The hero title is set in
     * display type at clamp(2.5rem, 7vw, 5rem) — well past 80 characters it
     * stops being a headline and starts breaking the layout, so the schema is
     * the honest place to stop a paragraph being pasted into an <h1>.
     */
    hero: {
      eyebrow: { type: String, trim: true, maxlength: 80, default: "" },
      title: { type: String, trim: true, maxlength: 80, default: "" },
      description: { type: String, trim: true, maxlength: 600, default: "" },
      ctaLabel: { type: String, trim: true, maxlength: 40, default: "" },
      image: { type: mediaRefSchema, default: () => ({}) },
      imageAlt: { type: String, trim: true, maxlength: 160, default: "" },
    },

    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

// Guard against OverwriteModelError when tsx watch re-evaluates this module.
export const HomeContent: Model<IHomeContent> =
  (mongoose.models.HomeContent as Model<IHomeContent>) ||
  mongoose.model<IHomeContent>("HomeContent", homeContentSchema);
