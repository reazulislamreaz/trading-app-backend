import { Request, Response } from "express";
import * as UploadService from "./upload.service";

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
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Upload failed",
    });
  }
};