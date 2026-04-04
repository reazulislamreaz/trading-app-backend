import { configs } from "./app/configs";
import { authSwaggerDocs } from "./app/modules/auth/auth.swagger";
import { userSwaggerDocs } from "./app/modules/user/user.swagger";
import { uploadSwaggerDocs } from "./app/modules/upload.ts/upload.swagger";
import { subscriptionSwaggerDocs } from "./app/modules/subscription/subscription.swagger";

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Trading App API",
      version: "1.0.0",
      description: "Production-level SaaS trading signal platform API with JWT authentication, role-based access control, and Stripe subscription management.",
    },
    paths: {
      ...authSwaggerDocs,
      ...userSwaggerDocs,
      ...uploadSwaggerDocs,
      ...subscriptionSwaggerDocs,
    },
    servers:
      configs.env === "production"
        ? [{ url: configs.jwt.front_end_url || "https://your-api.com" }, { url: "http://10.10.11.30:5000" }]
        : [{ url: "http://10.10.11.30:5000" }, { url: "https://your-api.com" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token. Example payload: { userId: '65f123...', email: 'user@example.com', role: 'USER' | 'ADMIN' | 'MASTER' }",
        },
      },
      schemas: {
        Role: {
          type: "string",
          enum: ["USER", "ADMIN", "MASTER"],
          description: "User role for authorization",
          example: "USER",
        },
        JWTToken: {
          type: "object",
          properties: {
            userId: { type: "string", example: "65f1234567890abcdef12345" },
            email: { type: "string", example: "user@example.com" },
            role: { type: "string", enum: ["USER", "ADMIN", "MASTER"], example: "USER" },
            iat: { type: "integer", example: 1712345678 },
            exp: { type: "integer", example: 1712346578 },
          },
        },
      },
    },
  },
  // Don't scan files - use manual swagger docs instead
  // This prevents EISDIR errors and improves performance
  apis: [],
};
