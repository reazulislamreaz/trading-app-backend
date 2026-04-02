import { uploadToS3 } from "../../utils/s3";

export const uploadSingleFile = async (file: Express.Multer.File) => {
  const url = await uploadToS3(file);
  return url;
};

export const uploadMultipleFiles = async (files: Express.Multer.File[]) => {
  const urls = await Promise.all(files.map((file) => uploadToS3(file)));
  return urls;
};