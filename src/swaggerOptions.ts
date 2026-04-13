import { configs } from "./app/configs";
import { authSwaggerDocs } from "./app/modules/auth/auth.swagger";
import { userSwaggerDocs } from "./app/modules/user/user.swagger";
import { uploadSwaggerDocs } from "./app/modules/upload.ts/upload.swagger";
import { subscriptionSwaggerDocs } from "./app/modules/subscription/subscription.swagger";
import { signalSwaggerDocs } from "./app/modules/signal/signal.swagger";
import { masterSwaggerDocs } from "./app/modules/master/master.swagger";
import { followSwaggerDocs } from "./app/modules/follow/follow.swagger";
import { notificationSwaggerDocs } from "./app/modules/notification/notification.swagger";
import { adminSwaggerDocs } from "./app/modules/admin/admin.swagger";
import { contributionSwaggerDocs } from "./app/modules/contribution/contribution.swagger";
import { leaderboardSwaggerDocs } from "./app/modules/leaderboard/leaderboard.swagger";
import { topTradersSwaggerDocs } from "./app/modules/top-traders/top_traders.swagger";
import { copiedTradeSwaggerDocs } from "./app/modules/copied_trade/copied_trade.swagger";

export const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Trading Signal Platform API",
      version: "1.0.0",
      description: "Production-level SaaS trading signal platform. Users subscribe to the platform to access trading signals posted by approved Master Traders. All payments go to the Admin/Platform Stripe account.",
    },
    paths: {
      ...authSwaggerDocs,
      ...userSwaggerDocs,
      ...uploadSwaggerDocs,
      ...subscriptionSwaggerDocs,
      ...signalSwaggerDocs,
      ...masterSwaggerDocs,
      ...followSwaggerDocs,
      ...notificationSwaggerDocs,
      ...adminSwaggerDocs,
      ...contributionSwaggerDocs,
      ...leaderboardSwaggerDocs,
      ...topTradersSwaggerDocs,
      ...copiedTradeSwaggerDocs,
    },
    servers:
      configs.env === "production"
        ? [{ url: configs.jwt.front_end_url || "https://your-api.com" }, { url: "https://reaz5000.syedbipul.me" }]
        : [{ url: "https://reaz5000.syedbipul.me" }, { url: "https://your-api.com" }],
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
        AccountStatus: {
          type: "string",
          enum: ["ACTIVE", "INACTIVE", "SUSPENDED"],
          description: "Account status",
          example: "ACTIVE",
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
        SubscriptionTier: {
          type: "string",
          enum: ["free", "basic", "pro", "master"],
          description: "Subscription tier level",
          example: "basic",
        },
        AssetType: {
          type: "string",
          enum: ["forex", "crypto", "stocks", "indices", "commodities"],
          description: "Asset type for trading signals",
          example: "forex",
        },
        SignalType: {
          type: "string",
          enum: ["long", "short"],
          description: "Direction of the trading signal",
          example: "long",
        },
        SignalTimeframe: {
          type: "string",
          enum: ["m1", "m5", "m15", "m30", "h1", "h4", "d1", "w1", "mn1"],
          description: "Chart timeframe for the signal",
          example: "h4",
        },
        SignalStatus: {
          type: "string",
          enum: ["active", "closed", "expired", "canceled"],
          description: "Status of a trading signal",
          example: "active",
        },
        NotificationType: {
          type: "string",
          enum: ["new_signal", "subscription_active", "subscription_expiring", "subscription_canceled", "payment_succeeded", "payment_failed", "system_announcement", "signal_copied", "trade_result_logged"],
          description: "Type of notification",
          example: "new_signal",
        },
        PaginationMeta: {
          type: "object",
          properties: {
            page: { type: "integer", example: 1 },
            limit: { type: "integer", example: 20 },
            total: { type: "integer", example: 150 },
            totalPages: { type: "integer", example: 8 },
          },
        },
        StandardResponse: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string" },
            data: { type: "object", nullable: true },
            meta: { $ref: "#/components/schemas/PaginationMeta" },
          },
        },
      },
    },
    tags: [
      { name: "Authentication", description: "User registration, login, password management, and 2FA" },
      { name: "Two-Factor Authentication", description: "TOTP-based two-factor authentication setup and management" },
      { name: "Users", description: "User profile management and admin user operations" },
      { name: "Upload", description: "File upload to S3/local storage" },
      { name: "Subscriptions", description: "Platform subscription plans, checkout, and Stripe payment management" },
      { name: "Signals", description: "Trading signal creation, management, and viewing" },
      { name: "Masters", description: "Master Trader profiles and performance stats" },
      { name: "Masters (Admin)", description: "Admin operations for featuring Master Traders" },
      { name: "Follow", description: "Follow/unfollow Master Traders" },
      { name: "Notifications", description: "User notification management" },
      { name: "Contributions", description: "User engagement tracking and top contributor rankings" },
      { name: "Leaderboard", description: "Overall platform leaderboard with composite scoring" },
      { name: "Top Traders", description: "Top Master Traders ranked by trading performance" },
      { name: "Copy Trades", description: "Copy trade intent tracking and trade journal for logging results" },
      { name: "Admin", description: "Admin dashboard — analytics, broadcasts, role management, payment logs" },
    ],
  },
  // Don't scan files - use manual swagger docs instead
  // This prevents EISDIR errors and improves performance
  apis: [],
};
