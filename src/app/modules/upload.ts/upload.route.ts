import express from "express";
import { uploadFile } from "./upload.controller";
import { uploader } from "../../middlewares/uploader";

const router = express.Router();

/*
single file
field name = file
*/

router.post(
  "/file",
  uploader.single("file"),
  uploadFile
);

/*
multiple files
field name = files
*/

router.post(
  "/files",
  uploader.array("files", 10),
  uploadFile
);

export default router;