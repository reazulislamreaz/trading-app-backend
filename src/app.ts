import cookieParser from "cookie-parser";
import cors from "cors";
import express, { Request, Response } from "express";
import helmet from "helmet";
import morgan from "morgan";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import { configs } from "./app/configs";
import globalErrorHandler from "./app/middlewares/global_error_handler";
import { apiLimiter } from "./app/middlewares/rate_limiter";
import notFound from "./app/middlewares/not_found_api";
import appRouter from "./routes";
import logger from "./app/configs/logger";
import { swaggerOptions } from "./swaggerOptions";

// define app
const app = express();
const swaggerSpec = swaggerJSDoc(swaggerOptions);
app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Security middleware
app.use(helmet()); // Add security headers

// CORS configuration
app.use(cors({
    origin: configs.allowed_origins?.split(',') || configs.jwt.front_end_url || 'http://localhost:5000' ,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging middleware
app.use(morgan('combined', {
    stream: { write: (message) => logger.info(message.trim()) }
}));

// Rate limiting
app.use('/api/', apiLimiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Trust proxy for correct client IP behind reverse proxy
// app.set('trust proxy', true);

app.use("/api/v1", appRouter);

// stating point
app.get("/", (req: Request, res: Response) => {
    res.status(200).json({
        status: "success",
        message: "Server is running successfully",
        data: null,
    });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// global error handler
app.use(globalErrorHandler);
app.use(notFound);

// export app
export default app;
