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
    baseUrl = configs.jwt.front_end_url || "";
  } else {
    // Use network IP for development
    const port = process.env.PORT || 5000;
    baseUrl = `http://10.10.11.30:${port}`;
  }

  return `${baseUrl}/uploads/${folder}/${filename}`;
};
