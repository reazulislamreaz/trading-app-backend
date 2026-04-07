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
};

export const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    // Check MIME type
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error("Invalid file type. Allowed: JPG, PNG, WebP, PDF, CSV"));
    }

    // Check file extension matches MIME type
    const ext = path.extname(file.originalname).toLowerCase();
    const expectedExtensions = allowedExtensions[file.mimetype] || [];
    
    if (!expectedExtensions.includes(ext)) {
      return cb(new Error("File extension does not match MIME type"));
    }

    cb(null, true);
  },
});
