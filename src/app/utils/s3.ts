import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
// import { v4 as uuidv4 } from "uuid";
import { randomUUID } from "crypto";

import path from "path";
import { configs } from "../configs";

export const s3 = new S3Client({
  region: configs.aws.region,
  credentials: {
    accessKeyId: configs.aws.access_key_id!,
    secretAccessKey: configs.aws.secret_access_key!,
  },
});

export const uploadToS3 = async (
  file: Express.Multer.File,
  folder = "uploads",
) => {
  const ext = path.extname(file.originalname);
  const key = `${folder}/${randomUUID()}${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: configs.aws.bucket_name!,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    }),
  );

  return `https://${configs.aws.bucket_name}.s3.${configs.aws.region}.amazonaws.com/${key}`;
};
