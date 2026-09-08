import multer from "multer";
import { ApiError } from "../utils/ApiError.js";

/** What Cloudinary will accept and the gallery can sensibly display. */
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

/** 8MB. Comfortably above a phone photo, well below a RAW export. */
const MAX_BYTES = 8 * 1024 * 1024;

/**
 * Holds the upload in memory rather than on disk.
 *
 * The file is streamed straight to Cloudinary, so writing it to the filesystem
 * first would add a temp file, a cleanup step and a failure mode for no gain.
 * The size cap is what keeps "in memory" safe.
 */
export const uploadSingleImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) {
      cb(new ApiError(400, "Please upload a JPEG, PNG, WebP or AVIF image"));
      return;
    }
    cb(null, true);
  },
}).single("image");
