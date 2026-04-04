export const uploadSwaggerDocs = {
  "/api/v1/upload/file": {
    post: {
      tags: ["Upload"],
      summary: "Upload a single file",
      description:
        "Uploads a single file to S3 storage. Supports images (JPG, PNG, WebP), PDF, and CSV files. Maximum file size: 20MB. This is the central upload endpoint used by all modules for file uploads.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                file: {
                  type: "string",
                  format: "binary",
                  description: "The file to upload. Allowed types: JPG, PNG, WebP, PDF, CSV. Max size: 20MB.",
                },
              },
              required: ["file"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "File uploaded successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  url: {
                    type: "string",
                    example: "https://your-bucket.s3.your-region.amazonaws.com/uploads/abc123-def456.jpg",
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Bad Request — No file provided or invalid file type",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "No file uploaded" },
                },
              },
            },
          },
        },
        500: {
          description: "Internal Server Error — Upload failed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Upload failed" },
                },
              },
            },
          },
        },
      },
    },
  },
  "/api/v1/upload/files": {
    post: {
      tags: ["Upload"],
      summary: "Upload multiple files",
      description:
        "Uploads multiple files (up to 10) to S3 storage. Supports images (JPG, PNG, WebP), PDF, and CSV files. Maximum file size per file: 20MB.",
      requestBody: {
        required: true,
        content: {
          "multipart/form-data": {
            schema: {
              type: "object",
              properties: {
                files: {
                  type: "array",
                  items: {
                    type: "string",
                    format: "binary",
                  },
                  description: "Array of files to upload. Maximum 10 files. Allowed types: JPG, PNG, WebP, PDF, CSV. Max size per file: 20MB.",
                  maxItems: 10,
                },
              },
              required: ["files"],
            },
          },
        },
      },
      responses: {
        200: {
          description: "Files uploaded successfully",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  urls: {
                    type: "array",
                    items: {
                      type: "string",
                      example: "https://your-bucket.s3.your-region.amazonaws.com/uploads/abc123-def456.jpg",
                    },
                  },
                },
              },
            },
          },
        },
        400: {
          description: "Bad Request — No files provided or invalid file type",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "No file uploaded" },
                },
              },
            },
          },
        },
        500: {
          description: "Internal Server Error — Upload failed",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: false },
                  message: { type: "string", example: "Upload failed" },
                },
              },
            },
          },
        },
      },
    },
  },
};
