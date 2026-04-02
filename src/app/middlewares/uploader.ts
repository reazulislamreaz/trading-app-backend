import multer from "multer";

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

export const uploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type"));
  },
});
