// Import necessary modules and libraries
import express from "express"; // Framework for building web applications
import cookieParser from "cookie-parser"; // Middleware for parsing cookies
import cors from "cors"; // Middleware for enabling CORS
import http from "http"; // HTTP module for creating server
import mongoose from "mongoose"; // ODM for MongoDB
import "dotenv/config"; // Loads environment variables from a .env file
import routes from "./src/routes/index.js"; // Importing route handlers

// Initialize Express application
const app = express();

// Middleware setup
// Middleware for CORS
app.use(cors({
  origin: ['https://plhub-frontend-git-advancefeatur-85221b-amans-projects-62ecaac6.vercel.app', 'http://localhost:3000'],   // Allow only your frontend
  methods: 'GET,POST,PUT,DELETE',
  credentials: true,   // Allow cookies if needed
}));
app.use(express.json()); // Parse incoming JSON requests
app.use(express.urlencoded({ extended: false })); // Parse URL-encoded payloads
app.use(cookieParser()); // Parse and populate cookies in request objects

// Route configuration
app.use("/api/v1", routes); // Define base route for API

// Server configuration
const port = process.env.PORT || 5000; // Define server port (from environment variables or default to 5000)
const server = http.createServer(app); // Create HTTP server instance

// MongoDB connection and server start
mongoose
  .connect(process.env.MONGODB_URL, {
    useNewUrlParser: true, // Avoid deprecation warnings
    useUnifiedTopology: true, // Ensure stable connection
  })
  .then(() => {
    console.log("MongoDB connected"); // Log successful database connection

    // Start the server
    server.listen(port, () => {
      console.log(`Server is listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error); // Log connection error details
    process.exit(1); // Exit process with failure code
  });

/**
 * Main application entry point.
 *
 * - Uses Express.js as the framework for HTTP server functionality.
 * - Connects to MongoDB via Mongoose.
 * - Loads API routes from the "routes" module.
 *
 * Features:
 * - CORS for cross-origin requests.
 * - Cookie parsing for handling client cookies.
 * - JSON and URL-encoded request body parsing.
 * - Graceful error handling for database connection failures.
 *
 * Environment Variables Required:
 * - `PORT`: Port number for the server (default: 5000).
 * - `MONGODB_URL`: Connection string for MongoDB.
 */
