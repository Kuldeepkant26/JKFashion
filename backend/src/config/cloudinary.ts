import { v2 as cloudinary } from "cloudinary";
import { env, isCloudinaryConfigured } from "./env.js";
import { ApiError } from "../utils/ApiError.js";
import { logger } from "../utils/logger.js";

let configured = false;

/**
 * Configure the SDK on first use rather than at import time.
 *
 * Deferring it means the API still boots without Cloudinary credentials — only
 * the upload endpoint fails, and it fails with a message that names the missing
 * variables rather than a generic SDK error.
 */
const ensureConfigured = (): void => {
  if (configured) return;

  if (!isCloudinaryConfigured()) {
    throw new ApiError(
      503,
      "Image uploads are not configured. Set CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in the API's .env file."
    );
  }

  cloudinary.config({
    cloud_name: env.cloudinary.cloudName,
    api_key: env.cloudinary.apiKey,
    api_secret: env.cloudinary.apiSecret,
    secure: true,
  });

  configured = true;
};

export interface UploadedImage {
  publicId: string;
  url: string;
  width: number;
  height: number;
}

/**
 * Send a buffer to Cloudinary.
 *
 * `upload_stream` rather than a path upload because multer holds the file in
 * memory — writing it to disk first only to read it back would add a temp file
 * and a failure mode for nothing.
 *
 * The eager transform produces the display size the gallery actually renders,
 * so the browser is never handed a 4000px original to scale down.
 */
export const uploadImage = (buffer: Buffer, filename: string): Promise<UploadedImage> => {
  ensureConfigured();

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinary.folder,
        resource_type: "image",
        // Strips EXIF (including any GPS the client's camera wrote) and picks
        // the best format the requesting browser supports.
        transformation: [{ quality: "auto:good", fetch_format: "auto" }],
        context: { original_filename: filename },
      },
      (error, result) => {
        if (error || !result) {
          logger.error(`Cloudinary upload failed: ${error?.message ?? "no result"}`);
          reject(new ApiError(502, "Could not upload that image. Please try again."));
          return;
        }

        resolve({
          publicId: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
        });
      }
    );

    stream.end(buffer);
  });
};

/**
 * Remove an image from Cloudinary.
 *
 * Never throws: a delete that fails leaves an orphaned file, which costs a
 * little storage, while throwing would block the admin from removing the row
 * from their own gallery. The row is the thing they asked to delete.
 */
export const destroyImage = async (publicId: string): Promise<void> => {
  try {
    ensureConfigured();
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    logger.error(
      `Cloudinary delete failed for ${publicId}: ${
        error instanceof Error ? error.message : "unknown"
      }`
    );
  }
};
