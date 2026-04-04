import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { configs } from "../configs";

const UPLOAD_DIR = path.join(process.cwd(), "uploads");

// Ensure upload directory exists
const ensureUploadDir = () => {
  if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  }
};

export const uploadToLocal = async (
  file: Express.Multer.File,
  folder = "uploads",
): Promise<string> => {
  ensureUploadDir();

  const ext = path.extname(file.originalname);
  const filename = `${randomUUID()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, filename);

  await fs.promises.writeFile(filePath, file.buffer);

  const baseUrl = configs.env === "production"
    ? (configs.jwt.front_end_url || "")
    : `http://10.10.11.30:${process.env.PORT || 5000}`;

  return `${baseUrl}/uploads/${filename}`;
};
