import { S3Client, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";
import path from "path";
import { configs } from "../configs";
import logger from "../configs/logger";
import { uploadToLocal } from "./local_storage";

// Check if AWS credentials are properly configured (not placeholder values)
const isAwsConfigured = () => {
  const bucketName = configs.aws.bucket_name || "";
  
  // Reject empty or placeholder bucket names
  if (!bucketName || bucketName === "your_bucket_name") {
    logger.warn("AWS_BUCKET_NAME is not configured or uses placeholder value");
    return false;
  }
  
  // Reject obvious non-bucket names like region names
  const regionPatterns = [
    "us-east-1", "us-east-2", "us-west-1", "us-west-2",
    "eu-west-1", "eu-west-2", "eu-west-3", "eu-central-1", "eu-north-1", "eu-south-1",
    "ap-south-1", "ap-southeast-1", "ap-southeast-2", "ap-northeast-1", "ap-northeast-2",
    "sa-east-1", "ca-central-1", "me-south-1", "af-south-1",
  ];
  
  if (regionPatterns.includes(bucketName.toLowerCase())) {
    logger.warn(
      `AWS_BUCKET_NAME appears to be a region name ("${bucketName}"), not a bucket name. Falling back to local storage.`,
    );
    return false;
  }
  
  // Check all required AWS credentials are present
  const hasRegion = !!(configs.aws.region && configs.aws.region !== "");
  const hasAccessKey = !!(configs.aws.access_key_id && configs.aws.access_key_id !== "");
  const hasSecretKey = !!(configs.aws.secret_access_key && configs.aws.secret_access_key !== "");
  
  if (!hasRegion || !hasAccessKey || !hasSecretKey) {
    logger.warn("AWS credentials are incomplete. Falling back to local storage.");
    return false;
  }
  
  return true;
};

// Only create S3 client if AWS is properly configured
export const s3 = isAwsConfigured() 
  ? new S3Client({
      region: configs.aws.region!,
      credentials: {
        accessKeyId: configs.aws.access_key_id!,
        secretAccessKey: configs.aws.secret_access_key!,
      },
      // Use path-style URLs for compatibility with all bucket types
      forcePathStyle: true,
    })
  : null;

export const uploadToS3 = async (
  file: Express.Multer.File,
  folder = "uploads",
): Promise<string> => {
  // Fallback to local storage if AWS is not properly configured
  if (!isAwsConfigured() || !s3) {
    logger.info("AWS not configured or invalid — falling back to local storage");
    return uploadToLocal(file, folder);
  }

  const ext = path.extname(file.originalname);
  const key = `${folder}/${randomUUID()}${ext}`;

  const params: PutObjectCommandInput = {
    Bucket: configs.aws.bucket_name!,
    Key: key,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  try {
    await s3.send(new PutObjectCommand(params));
    logger.info(`File uploaded to S3: ${key}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown S3 error";
    logger.error(`S3 upload failed for ${key}: ${errorMessage}`, error);
    logger.info("Falling back to local storage due to S3 error");
    return uploadToLocal(file, folder);
  }

  // Return virtual-hosted-style URL
  return `https://${configs.aws.bucket_name}.s3.${configs.aws.region}.amazonaws.com/${key}`;
};
