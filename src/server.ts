
import http from "http";
import app from "./app";
import { configs } from "./app/configs";
import logger from "./app/configs/logger";
import databaseConnection from "./app/configs/database";
import runAllSeeds from "./app/utils/seed";
import { scheduleSignalUsageReset } from "./app/utils/signal_usage_reset";
import { scheduleExpiryNotifications } from "./app/utils/subscription_notifications";

async function main() {
    // Validate database URL
    if (!configs.db_url) {
        throw new Error('DB_URL environment variable is required');
    }

    // Setup database connection event listeners
    databaseConnection.setupEventListeners();

    // Connect to MongoDB with retry logic
    await databaseConnection.connect(configs.db_url);

    // Run database seeds (idempotent - safe to run on every startup)
    await runAllSeeds();

    // Initialize scheduled tasks
    scheduleSignalUsageReset();
    scheduleExpiryNotifications();

    const server = http.createServer(app);

    // Set request timeout
    server.timeout = 30000; // 30 seconds

    app.listen(configs.port as any, configs.ip.backend_ip as any, () => {
        console.log(`Server listening on port ${configs.port}`);
        logger.info(`🚀 Server started on port ${configs.port} (${configs.env})`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
        logger.info(`\n🛑 ${signal} received. Shutting down gracefully...`);
        
        // Stop accepting new connections
        server.close(async () => {
            logger.info('🔌 HTTP server closed');
            
            // Close database connection
            await databaseConnection.disconnect();
            
            logger.info('✅ Graceful shutdown completed');
            process.exit(0);
        });

        // Force shutdown after timeout
        setTimeout(() => {
            logger.error('⚠️  Forced shutdown due to timeout');
            process.exit(1);
        }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

main().catch(err => {
    logger.error('🚨 Failed to start server:', err);
    process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    logger.error('💥 Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('🔥 Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

