import express from "express";
import { uploadFile } from "./upload.controller";
import { uploader } from "../../middlewares/uploader";
import auth from "../../middlewares/auth";
import { fileUploadLimiter } from "../../middlewares/rate_limiter";

const router = express.Router();

/*
single file
field name = file
*/

router.post(
  "/file",
  auth("USER", "ADMIN", "MASTER"),
  fileUploadLimiter,
  uploader.single("file"),
  uploadFile
);

/*
multiple files
field name = files
*/

router.post(
  "/files",
  auth("USER", "ADMIN", "MASTER"),
  fileUploadLimiter,
  uploader.array("files", 10),
  uploadFile
);

export default router;