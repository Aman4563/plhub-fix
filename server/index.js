/**
 * PLhub Server - Main Entry Point
 * 
 * Features:
 * - Express.js framework with security middleware
 * - MongoDB database with Mongoose ODM
 * - JWT authentication with httpOnly cookies
 * - Rate limiting for API protection
 * - Helmet for security headers
 * - Winston for structured logging
 * - CORS with proper origin configuration
 */

import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import http from "http";
import mongoose from "mongoose";
import helmet from "helmet";
import "dotenv/config";

import routes from "./src/routes/index.js";
import securityConfig from "./src/config/security.config.js";
import logger from "./src/config/logger.config.js";
import { generalLimiter } from "./src/middlewares/rateLimiter.middleware.js";
import userModel from "./src/models/user.model.js";

// Initialize Express application
const app = express();

// Trust proxy for accurate IP detection behind reverse proxies (Vercel, etc.)
app.set("trust proxy", 1);

// Security Middleware - Helmet for HTTP headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === "production" 
    ? securityConfig.helmet.contentSecurityPolicy 
    : false,
  crossOriginEmbedderPolicy: securityConfig.helmet.crossOriginEmbedderPolicy,
  crossOriginResourcePolicy: securityConfig.helmet.crossOriginResourcePolicy,
}));

// CORS Configuration - FIXED: Added https:// prefix for production URL
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = [
      "https://plhub-frontend-git-advancefeatur-85221b-amans-projects-62ecaac6.vercel.app",
      "http://localhost:3000",
      "http://localhost:3001",
    ];

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn("CORS blocked request from origin", { origin });
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: securityConfig.cors.methods,
  allowedHeaders: securityConfig.cors.allowedHeaders,
  credentials: true, // Required for httpOnly cookies
  maxAge: securityConfig.cors.maxAge,
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: false, limit: "10mb" }));

// Cookie parser - Required for httpOnly cookie authentication
app.use(cookieParser());

// Apply general rate limiting
app.use(generalLimiter);

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.originalUrl}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("user-agent")?.substring(0, 50),
    });
  });
  
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes
app.use("/api/v1", routes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    status: 404,
    message: "Endpoint not found",
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error", {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Don't leak error details in production
  const message = process.env.NODE_ENV === "production"
    ? "An unexpected error occurred"
    : err.message;

  res.status(err.status || 500).json({
    status: err.status || 500,
    message,
  });
});

// Server Configuration
const port = process.env.PORT || 5000;
const server = http.createServer(app);

/**
 * Bootstrap first admin user
 * Creates admin from FIRST_ADMIN_EMAIL env variable if no admin exists
 */
const bootstrapFirstAdmin = async () => {
  try {
    const adminEmail = process.env.FIRST_ADMIN_EMAIL;
    
    if (!adminEmail) {
      return; // No admin email configured
    }

    // Check if any admin already exists
    const existingAdmin = await userModel.findOne({ role: "admin" });
    if (existingAdmin) {
      logger.debug("Admin user already exists, skipping bootstrap");
      return;
    }

    // Find user by email and promote to admin
    const user = await userModel.findOne({ email: adminEmail.toLowerCase() });
    
    if (user) {
      if (user.role !== "admin") {
        user.role = "admin";
        user.roleHistory = user.roleHistory || [];
        user.roleHistory.push({
          previousRole: "user",
          newRole: "admin",
          changedAt: new Date(),
          reason: "Initial admin bootstrap",
        });
        await user.save();
        logger.info(`✅ First admin created: ${adminEmail}`);
      }
    } else {
      logger.info(`⚠️ FIRST_ADMIN_EMAIL (${adminEmail}) not found. User must register first, then will be promoted to admin.`);
    }
  } catch (error) {
    logger.error("Error bootstrapping admin", { error: error.message });
  }
};

// MongoDB Connection with retry logic
const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGODB_URL, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    logger.info("MongoDB connected successfully");
    
    // Bootstrap first admin user
    await bootstrapFirstAdmin();
    
    // Start server after successful DB connection
    server.listen(port, () => {
      logger.info(`Server running on port ${port}`, {
        environment: process.env.NODE_ENV || "development",
        nodeVersion: process.version,
      });
    });
  } catch (error) {
    logger.error("Database connection failed", { error: error.message });
    
    if (retries > 0) {
      logger.info(`Retrying connection in 5 seconds... (${retries} attempts remaining)`);
      setTimeout(() => connectDB(retries - 1), 5000);
    } else {
      logger.error("Max retries reached. Exiting...");
      process.exit(1);
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

mongoose.connection.on("error", (err) => {
  logger.error("MongoDB error", { error: err.message });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    logger.info("HTTP server closed");
    
    try {
      await mongoose.connection.close();
      logger.info("MongoDB connection closed");
      process.exit(0);
    } catch (error) {
      logger.error("Error during shutdown", { error: error.message });
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 30000);
};

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Start the application
connectDB();

export default app;
