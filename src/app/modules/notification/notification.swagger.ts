export const notificationSwaggerDocs = {
  "/api/v1/notifications": {
    get: {
      tags: ["Notifications"],
      summary: "Get my notifications",
      description: "Retrieve paginated list of notifications for the authenticated user.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "page", in: "query", schema: { type: "integer", default: 1 } },
        { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
        { name: "isRead", in: "query", schema: { type: "boolean" }, description: "Filter by read status" },
        { name: "type", in: "query", schema: { type: "string", enum: ["new_signal", "subscription_active", "subscription_expiring", "subscription_canceled", "payment_succeeded", "payment_failed", "master_approved", "master_rejected", "system_announcement"] } },
      ],
      responses: {
        200: {
          description: "Notifications retrieved",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "Notifications retrieved" },
                  data: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        _id: { type: "string" },
                        type: { type: "string", example: "new_signal" },
                        title: { type: "string", example: "New Signal from MasterTrader1" },
                        message: { type: "string", example: "MasterTrader1 just posted a new EUR/USD long signal" },
                        isRead: { type: "boolean", example: false },
                        link: { type: "string", example: "/signals/abc123" },
                        createdAt: { type: "string", format: "date-time" },
                      },
                    },
                  },
                  unreadCount: { type: "integer", example: 5 },
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

  "/api/v1/notifications/unread-count": {
    get: {
      tags: ["Notifications"],
      summary: "Get unread notification count",
      description: "Get the number of unread notifications for the authenticated user.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "Unread count retrieved",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  data: {
                    type: "object",
                    properties: {
                      unreadCount: { type: "integer", example: 5 },
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

  "/api/v1/notifications/mark-all-read": {
    patch: {
      tags: ["Notifications"],
      summary: "Mark all notifications as read",
      description: "Mark all unread notifications for the authenticated user as read.",
      security: [{ bearerAuth: [] }],
      responses: {
        200: {
          description: "All notifications marked as read",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  success: { type: "boolean", example: true },
                  message: { type: "string", example: "All notifications marked as read" },
                  data: {
                    type: "object",
                    properties: {
                      markedCount: { type: "integer", example: 5 },
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

  "/api/v1/notifications/{id}": {
    patch: {
      tags: ["Notifications"],
      summary: "Update a notification",
      description: "Update notification fields. Currently supports `isRead` to mark as read/unread.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Notification ID" },
      ],
      requestBody: {
        required: true,
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                isRead: { type: "boolean", example: true, description: "Set read status" },
              },
            },
          },
        },
      },
      responses: {
        200: { description: "Notification updated" },
        400: { description: "Invalid notification ID" },
        404: { description: "Notification not found" },
      },
    },
    delete: {
      tags: ["Notifications"],
      summary: "Delete a notification",
      description: "Permanently delete a notification.",
      security: [{ bearerAuth: [] }],
      parameters: [
        { name: "id", in: "path", required: true, schema: { type: "string" }, description: "Notification ID" },
      ],
      responses: {
        200: { description: "Notification deleted" },
        400: { description: "Invalid notification ID" },
        404: { description: "Notification not found" },
      },
    },
  },
};
