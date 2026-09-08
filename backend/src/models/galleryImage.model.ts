import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";

export interface IGalleryImage extends Document {
  title: string;
  caption?: string;
  publicId: string;
  url: string;
  width: number;
  height: number;
  /** Ascending — lowest first. Lets the admin reorder without renaming rows. */
  order: number;
  isActive: boolean;
  uploadedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const galleryImageSchema = new Schema<IGalleryImage>(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    caption: { type: String, trim: true, maxlength: 300 },

    /**
     * Cloudinary's id for the asset, kept so a deleted row can also delete the
     * file. Unique because two rows pointing at one asset would mean deleting
     * either one breaks the other.
     */
    publicId: { type: String, required: true, unique: true },

    url: { type: String, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },

    order: { type: Number, default: 0 },

    /**
     * Hidden rather than deleted, so an image can be pulled from the site
     * without losing it — the same reasoning as the hidden colour themes.
     */
    isActive: { type: Boolean, default: true },

    uploadedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

/** The public query is always active-only in display order. */
galleryImageSchema.index({ isActive: 1, order: 1, createdAt: 1 });

// Guard against OverwriteModelError when tsx watch re-evaluates this module.
export const GalleryImage: Model<IGalleryImage> =
  (mongoose.models.GalleryImage as Model<IGalleryImage>) ||
  mongoose.model<IGalleryImage>("GalleryImage", galleryImageSchema);
