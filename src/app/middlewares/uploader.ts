import multer from "multer";
import path from "path";

const allowedTypes = [
  "image/jpg",
  "image/jpeg",
  "image/png",
  "image/webp",
  // PDF
  "application/pdf",

  // CSV (IMPORTANT)
  "text/csv",
  "application/vnd.ms-excel",

  // Video
  "video/mp4",
  "video/quicktime",
  "video/x-msvideo",
  "video/x-matroska",
  "video/webm",
  "video/x-m4v",
  "video/mpeg",
  "video/3gpp",
  "video/ogg",
];

// Mapping of MIME types to their expected file extensions
const allowedExtensions: Record<string, string[]> = {
  "image/jpg": [".jpg", ".jpeg"],
  "image/jpeg": [".jpg", ".jpeg"],
  "image/png": [".png"],
  "image/webp": [".webp"],
  "application/pdf": [".pdf"],
  "text/csv": [".csv"],
  "application/vnd.ms-excel": [".csv"],
  "video/mp4": [".mp4", ".m4v"],
  "video/quicktime": [".mov"],
  "video/x-msvideo": [".avi"],
  "video/x-matroska": [".mkv"],
  "video/webm": [".webm"],
  "video/x-m4v": [".m4v", ".mp4"],
  "video/mpeg": [".mpeg", ".mpg"],
  "video/3gpp": [".3gp"],
  "video/ogg": [".ogv", ".ogg"],
};

const videoExtensions = [
  ".mp4",
  ".mov",
  ".avi",
  ".mkv",
  ".webm",
  ".m4v",
  ".mpeg",
  ".mpg",
  ".3gp",
  ".ogv",
  ".ogg",
];

const invalidFileTypeMessage =
  "Invalid file type. Allowed: JPG, PNG, WebP, PDF, CSV, MP4, MOV, AVI, MKV, WEBM, M4V, MPEG, 3GP, OGG";

export const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // Increased to 200MB
  fileFilter: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;

    // 1. Relaxed check for videos: if it's a known video extension, allow any video/ mimetype
    if (videoExtensions.includes(ext)) {
      if (
        mimetype.startsWith("video/") ||
        mimetype === "application/octet-stream" ||
        !mimetype
      ) {
        return cb(null, true);
      }
    }

    // 2. Strict check for other types or if first check failed
    if (!allowedTypes.includes(mimetype)) {
      return cb(new Error(invalidFileTypeMessage));
    }

    const expectedExtensions = allowedExtensions[mimetype] || [];

    if (!expectedExtensions.includes(ext)) {
      return cb(new Error("File extension does not match MIME type"));
    }

    cb(null, true);
  },
});
