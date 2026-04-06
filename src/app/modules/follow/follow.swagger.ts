export const followSwaggerDocs = {
  "/api/v1/follow/follow": {
    post: {
      tags: ["Follow"],
      summary: "Follow a master",
      description: "Start following a Master Trader. Increments the master's follower count.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["masterId"],
              properties: {
                masterId: { type: "string", example: "65f1234567890abcdef12345", description: "Account ID of the Master Trader to follow" },
              },
            },
          },
        },
      },
      responses: {
        201: { description: "Successfully following master" },
        400: { description: "Invalid master ID or user is not a Master Trader" },
        409: { description: "Already following this master" },
      },
    },
  },

  "/api/v1/follow/unfollow": {
    post: {
      tags: ["Follow"],
      summary: "Unfollow a master",
      description: "Stop following a Master Trader. Decrements the master's follower count.",
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["masterId"],
              properties: {
                masterId: { type: "string", example: "65f1234567890abcdef12345" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Successfully unfollowed master" },
        404: { description: "Not following this master" },
      },
    },
  },

  "/api/v1/follow/toggle/{id}": {
    post: {
      tags: ["Follow"],
      summary: "Toggle follow status",
      description: "Follow if not following, unfollow if already following. Convenient single endpoint.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Master Trader account ID" },
      ],
      responses: {
        200: {
          description: "Follow status toggled",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Followed master" },
                  data: {
                    type: "object",
                    properties: {
                      action: { type: "string", enum: ["followed", "unfollowed"], example: "followed" },
                    },
                  },
                },
              },
            },
          },
        },
        400: { description: "Invalid master ID" },
      },
    },
  },

  "/api/v1/follow/following": {
    get: {
      tags: ["Follow"],
      summary: "Get masters I follow",
      description: "List all Master Traders that the authenticated user is following.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
      ],
      responses: {
        200: {
          description: "Following list retrieved",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Following list retrieved" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        masterId: {
                          type: "object",
                          properties: {
                            _id: { type: "string" },
                            name: { type: "string" },
                            email: { type: "string" },
                            userProfileUrl: { type: "string" },
                          },
                        },
                        notificationsEnabled: { type: "boolean", example: true },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  meta: {
                    type: "object",
                    properties: {
                      page: { type: "integer" },
                      limit: { type: "integer" },
                      total: { type: "integer" },
                      totalPages: { type: "integer" },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },

  "/api/v1/follow/followers/{id}": {
    get: {
      tags: ["Follow"],
      summary: "Get followers of a master",
      description: "List all users following a specific Master Trader.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Master Trader account ID" },
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
      ],
      responses: {
        200: { description: "Followers list retrieved" },
        400: { description: "Invalid master ID" },
      },
    },
  },

  "/api/v1/follow/status/{id}": {
    get: {
      tags: ["Follow"],
      summary: "Check follow status",
      description: "Check whether the authenticated user is following a specific Master Trader.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Master Trader account ID" },
      ],
      responses: {
        200: {
          description: "Follow status retrieved",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      isFollowing: { type: "boolean", example: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
