import path from "path";

const extensionContentTypes: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".pdf": "application/pdf",
  ".csv": "text/csv",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
  ".mkv": "video/x-matroska",
  ".webm": "video/webm",
};

const videoExtensions = new Set([".mp4", ".mov", ".avi", ".mkv", ".webm"]);
const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);

export function resolveContentType(file: Express.Multer.File): string {
  const ext = path.extname(file.originalname).toLowerCase();

  if (file.mimetype && file.mimetype !== "application/octet-stream") {
    return file.mimetype;
  }

  return extensionContentTypes[ext] || "application/octet-stream";
}

export function resolveUploadFolder(file: Express.Multer.File): string {
  const ext = path.extname(file.originalname).toLowerCase();
  const contentType = resolveContentType(file);

  if (contentType.startsWith("video/") || videoExtensions.has(ext)) {
    return "videos";
  }

  if (contentType.startsWith("image/") || imageExtensions.has(ext)) {
    return "images";
  }

  return "documents";
}
