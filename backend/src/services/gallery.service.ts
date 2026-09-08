import type { Types } from "mongoose";
import { GalleryImage, type IGalleryImage } from "../models/galleryImage.model.js";
import { uploadImage, destroyImage } from "../config/cloudinary.js";
import { ApiError } from "../utils/ApiError.js";

/** Public: what the website renders, in display order. */
export const listPublic = (): Promise<IGalleryImage[]> =>
  GalleryImage.find({ isActive: true })
    .sort({ order: 1, createdAt: 1 })
    .select("title caption url width height")
    .lean<IGalleryImage[]>()
    .exec();

/** Admin: everything, including the hidden rows. */
export const listAll = (): Promise<IGalleryImage[]> =>
  GalleryImage.find().sort({ order: 1, createdAt: 1 }).lean<IGalleryImage[]>().exec();

export interface CreateInput {
  buffer: Buffer;
  filename: string;
  title: string;
  caption?: string;
  uploadedBy: Types.ObjectId;
}

export const createImage = async ({
  buffer,
  filename,
  title,
  caption,
  uploadedBy,
}: CreateInput): Promise<IGalleryImage> => {
  const uploaded = await uploadImage(buffer, filename);

  /*
   * New images go to the end. `order` is read before the insert rather than
   * being a count, so a gap left by a deleted row cannot put two images on the
   * same position.
   */
  const last = await GalleryImage.findOne().sort({ order: -1 }).select("order").lean().exec();
  const order = (last?.order ?? -1) + 1;

  try {
    return await GalleryImage.create({
      title,
      caption,
      publicId: uploaded.publicId,
      url: uploaded.url,
      width: uploaded.width,
      height: uploaded.height,
      order,
      uploadedBy,
    });
  } catch (error) {
    // The file is already on Cloudinary but the row failed — remove it rather
    // than leaving an asset nothing points at.
    await destroyImage(uploaded.publicId);
    throw error;
  }
};

export interface UpdateInput {
  title?: string;
  caption?: string;
  isActive?: boolean;
}

export const updateImage = async (id: string, patch: UpdateInput): Promise<IGalleryImage> => {
  const image = await GalleryImage.findByIdAndUpdate(id, { $set: patch }, { new: true }).exec();
  if (!image) throw new ApiError(404, "Image not found");
  return image;
};

export const deleteImage = async (id: string): Promise<void> => {
  const image = await GalleryImage.findByIdAndDelete(id).exec();
  if (!image) throw new ApiError(404, "Image not found");

  // After the row is gone: an orphaned Cloudinary file is recoverable, an
  // orphaned row pointing at a deleted file is a broken image on the site.
  await destroyImage(image.publicId);
};

/**
 * Apply a new order in one pass.
 *
 * The whole list is sent rather than a move operation, so two admins dragging
 * at once cannot interleave into an order neither of them chose.
 */
export const reorder = async (ids: string[]): Promise<void> => {
  await GalleryImage.bulkWrite(
    ids.map((id, index) => ({
      updateOne: { filter: { _id: id }, update: { $set: { order: index } } },
    }))
  );
};
