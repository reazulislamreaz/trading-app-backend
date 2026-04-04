import { Request, Response } from "express";
import * as UploadService from "./upload.service";
import logger from "../../configs/logger";

export const uploadFile = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];
    const file = req.file as Express.Multer.File;

    if (file) {
      const url = await UploadService.uploadSingleFile(file);

      return res.status(200).json({
        success: true,
        url,
      });
    }

    if (files && files.length > 0) {
      const urls = await UploadService.uploadMultipleFiles(files);

      return res.status(200).json({
        success: true,
        urls,
      });
    }

    return res.status(400).json({
      success: false,
      message: "No file uploaded",
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logger.error(`Upload failed: ${errorMessage}`, error);

    const statusCode = errorMessage.includes("Invalid file type") ? 400 : 500;
    const message =
      statusCode === 400
        ? errorMessage
        : "Upload failed. Please check server logs for details.";

    return res.status(statusCode).json({
      success: false,
      message,
    });
  }
};