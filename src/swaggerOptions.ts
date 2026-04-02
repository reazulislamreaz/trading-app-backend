import { configs } from "./app/configs";
import { authSwaggerDocs } from "./app/modules/auth/auth.swagger";
import { userSwaggerDocs } from "./app/modules/user/user.swagger";

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Doc - Build with Express CLI",
      version: "1.0.0",
      description: "Express API with auto-generated Swagger docs",
    },
    paths: {
      ...authSwaggerDocs,
      ...userSwaggerDocs,
    },
    servers:
      configs.env === "production"
        ? [{ url: configs.jwt.front_end_url || "https://your-api.com" }, { url: "http://localhost:5000" }]
        : [{ url: "http://localhost:5000" }, { url: "https://your-api.com" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token (e.g., Bearer eyJhbGciOiJIUzI1NiIs...)",
        },
      },
    },
  },
  // Don't scan files - use manual swagger docs instead
  // This prevents EISDIR errors and improves performance
  apis: [],
};
