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
  const filePath = path.join(UPLOAD_DIR, folder, filename);

  // Ensure folder-specific directory exists
  const folderPath = path.join(UPLOAD_DIR, folder);
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  await fs.promises.writeFile(filePath, file.buffer);

  // Construct base URL based on environment
  let baseUrl: string;

  if (configs.env === "production") {
    // In production, use BACKEND_URL if provided, otherwise fallback to frontend URL (less ideal)
    baseUrl = configs.ip.backend_url || configs.jwt.front_end_url || "";
  } else {
    // In development, use the configured BACKEND_IP or default to localhost
    const port = configs.port || 5000;
    const host = configs.ip.backend_ip || "localhost";
    baseUrl = `http://${host}:${port}`;
  }
  return `${baseUrl}/uploads/${folder}/${filename}`;
};
