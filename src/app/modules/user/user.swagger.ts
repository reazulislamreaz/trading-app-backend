export const userSwaggerDocs = {
    "/api/v1/user/update-profile": {
        patch: {
            tags: ["User"],
            summary: "Update user profile",
            description:
                "Updates the authenticated user's profile information. To update the profile image, first upload the image via the Upload module (`POST /api/v1/upload/file`), then pass the returned URL as `profileImageUrl` in this endpoint. Accessible by ADMIN and USER roles.",
            security: [{ bearerAuth: [] }],
            requestBody: {
                required: true,
                content: {
                    "application/json": {
                        schema: {
                            type: "object",
                            properties: {
                                name: {
                                    type: "string",
                                    description: "User's full name",
                                    example: "John Doe",
                                },
                                profileImageUrl: {
                                    type: "string",
                                    format: "uri",
                                    description: "URL of the profile image. Obtain this by first uploading an image to POST /api/v1/upload/file.",
                                    example: "https://your-bucket.s3.your-region.amazonaws.com/uploads/profile_abc123.jpg",
                                },
                            },
                        },
                    },
                },
            },
            responses: {
                200: {
                    description: "User profile updated successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Profile update successful." },
                                    data: {
                                        type: "object",
                                        properties: {
                                            _id: { type: "string", example: "64b2e1b9d1234f0012ab5678" },
                                            name: { type: "string", example: "John Doe" },
                                            profileImageUrl: {
                                                type: "string",
                                                example: "https://your-bucket.s3.your-region.amazonaws.com/uploads/profile_abc123.jpg",
                                            },
                                            role: { type: "string", enum: ["USER", "ADMIN", "MASTER"], example: "USER" },
                                            updatedAt: {
                                                type: "string",
                                                example: "2025-10-10T10:00:00Z",
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
                400: { description: "Bad Request — Validation failed" },
                401: { description: "Unauthorized — must be logged in as ADMIN or USER" },
            },
        },
    },
    "/api/v1/user/": {
        get: {
            tags: ["User"],
            summary: "Get all users",
            description: "Retrieve all users with pagination. Requires ADMIN role.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "page",
                    in: "query",
                    schema: { type: "integer", default: 1 },
                    description: "Page number",
                },
                {
                    name: "limit",
                    in: "query",
                    schema: { type: "integer", default: 10 },
                    description: "Items per page",
                },
            ],
            responses: {
                200: {
                    description: "Users retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "All user get successful." },
                                    meta: {
                                        type: "object",
                                        properties: {
                                            page: { type: "integer", example: 1 },
                                            limit: { type: "integer", example: 10 },
                                            total: { type: "integer", example: 100 },
                                            totalPage: { type: "integer", example: 10 },
                                        },
                                    },
                                    data: {
                                        type: "array",
                                        items: { type: "object" },
                                    },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized — ADMIN role required" },
            },
        },
    },
    "/api/v1/user/{id}": {
        get: {
            tags: ["User"],
            summary: "Get single user",
            description: "Retrieve a single user by ID. Requires ADMIN role.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "User ID",
                },
            ],
            responses: {
                200: {
                    description: "User retrieved successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "Single user get successful." },
                                    data: { type: "object" },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized — ADMIN role required" },
            },
        },
    },
    "/api/v1/user/suspend/{id}": {
        patch: {
            tags: ["User"],
            summary: "Suspend user",
            description: "Suspend a user account. Requires ADMIN role.",
            security: [{ bearerAuth: [] }],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string" },
                    description: "User ID to suspend",
                },
            ],
            responses: {
                200: {
                    description: "User suspended successfully",
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                properties: {
                                    success: { type: "boolean", example: true },
                                    message: { type: "string", example: "User suspended successfully." },
                                    data: { type: "object" },
                                },
                            },
                        },
                    },
                },
                401: { description: "Unauthorized — ADMIN role required" },
            },
        },
    },
};
