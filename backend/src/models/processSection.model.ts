import mongoose, { Schema, type Document, type Model, type Types } from "mongoose";
import { PROCESS_ICON_IDS, DEFAULT_PROCESS_ICON_ID } from "../config/processIcons.js";

/**
 * A Cloudinary asset as stored on a content row.
 *
 * publicId is kept alongside the URL so replacing or deleting a row can also
 * remove the file — the same reasoning as the gallery's own rows. It is
 * optional because a row may legitimately have no media yet.
 */
export interface IMediaRef {
  publicId?: string;
  url?: string;
  width?: number;
  height?: number;
}

const mediaRefSchema = new Schema<IMediaRef>(
  {
    publicId: { type: String },
    url: { type: String },
    width: { type: Number },
    height: { type: Number },
  },
  { _id: false }
);

/** One stage of the production flow. */
export interface IProcessStep {
  _id: Types.ObjectId;
  title: string;
  summary: string;
  description: string;
  icon: string;
  order: number;
  isActive: boolean;
}

const processStepSchema = new Schema<IProcessStep>({
  title: { type: String, required: true, trim: true, maxlength: 120 },
  summary: { type: String, trim: true, maxlength: 200, default: "" },
  description: { type: String, trim: true, maxlength: 600, default: "" },

  /**
   * A stage is drawn as an icon rather than a photograph.
   *
   * The stages are abstract — "Checking", "Dispatch" — and a stock photo of
   * each said less than a clear glyph while obliging the owner to source five
   * images before the section looked finished. Only the id is stored; see
   * config/processIcons.ts for why.
   */
  icon: {
    type: String,
    enum: PROCESS_ICON_IDS,
    default: DEFAULT_PROCESS_ICON_ID,
  },

  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

/** One photograph in the factory & staff strip. */
export interface IFacilityPhoto {
  _id: Types.ObjectId;
  caption: string;
  image: IMediaRef;
  order: number;
  isActive: boolean;
}

const facilityPhotoSchema = new Schema<IFacilityPhoto>({
  caption: { type: String, trim: true, maxlength: 200, default: "" },
  image: { type: mediaRefSchema, default: () => ({}) },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
});

export interface IProcessSection extends Document {
  key: string;

  /** Section heading block. */
  label: string;
  title: string;
  intro: string;

  /** Part one — the stage rail. */
  stepsHeading: string;
  steps: Types.DocumentArray<IProcessStep>;

  /** Part two — the video. */
  videoEnabled: boolean;
  videoHeading: string;
  videoBody: string;
  video: IMediaRef;
  videoPoster: IMediaRef;

  /** Part three — factory & staff photographs. */
  facilityEnabled: boolean;
  facilityHeading: string;
  facilityBody: string;
  facilityPhotos: Types.DocumentArray<IFacilityPhoto>;

  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const processSectionSchema = new Schema<IProcessSection>(
  {
    /**
     * Fixed discriminator, so this collection holds exactly one document —
     * the same singleton pattern as the theme settings, and the unique index
     * is what enforces it against two racing writers.
     */
    key: { type: String, default: "process", unique: true, immutable: true },

    label: { type: String, trim: true, maxlength: 80, default: "How We Work" },
    title: { type: String, trim: true, maxlength: 160, default: "Inside Our Floor" },
    intro: { type: String, trim: true, maxlength: 600, default: "" },

    stepsHeading: { type: String, trim: true, maxlength: 160, default: "" },
    steps: { type: [processStepSchema], default: [] },

    videoEnabled: { type: Boolean, default: true },
    videoHeading: { type: String, trim: true, maxlength: 160, default: "" },
    videoBody: { type: String, trim: true, maxlength: 600, default: "" },
    video: { type: mediaRefSchema, default: () => ({}) },
    videoPoster: { type: mediaRefSchema, default: () => ({}) },

    facilityEnabled: { type: Boolean, default: true },
    facilityHeading: { type: String, trim: true, maxlength: 160, default: "" },
    facilityBody: { type: String, trim: true, maxlength: 600, default: "" },
    facilityPhotos: { type: [facilityPhotoSchema], default: [] },

    updatedBy: { type: Schema.Types.ObjectId, ref: "AdminUser" },
  },
  { timestamps: true }
);

// Guard against OverwriteModelError when tsx watch re-evaluates this module.
export const ProcessSection: Model<IProcessSection> =
  (mongoose.models.ProcessSection as Model<IProcessSection>) ||
  mongoose.model<IProcessSection>("ProcessSection", processSectionSchema);
