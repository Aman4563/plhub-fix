// Import necessary modules and route handlers
import express from "express";
import userRoute from "./user.route.js"; // Handles user-related endpoints
import mediaRoute from "./media.route.js"; // Handles media-specific endpoints
import personRoute from "./person.route.js"; // Handles endpoints related to people
import reviewRoute from "./review.route.js"; // Handles reviews
import feedbackRoute from "./feedback.route.js"; // Handles user feedback
import genreController from "../controllers/genre.controller.js"; // Controller for genre-related operations
import certificationController from "../controllers/certification.controller.js"; // Controller for certifications
import filterController from "../controllers/filter.controller.js"; // Controller for media filtering

// Initialize Express router
const router = express.Router();

/**
 * Define route mappings:
 * - `/user` handles user-related actions.
 * - `/person` provides data about individuals (e.g., actors, directors).
 * - `/reviews` enables interaction with user reviews.
 * - `/feedback` allows users to submit feedback about the system.
 * - `/genres/:mediaType` fetches genres for a given media type.
 * - `/certifications/movie` fetches movie certifications.
 * - `/filter/:mediaType` filters media based on query parameters.
 * - `/:mediaType` delegates to the media-specific route handler.
 */

// User routes
router.use("/user", userRoute);

// Person-related routes
router.use("/person", personRoute);

// Review routes
router.use("/reviews", reviewRoute);

// Feedback routes
router.use("/feedback", feedbackRoute);

// Genre routes
router.get("/genres/:mediaType", genreController.getGenres);

// Certification routes
router.get("/certifications/movie", certificationController.getMovieCertifications);

// Filter routes
router.get("/filter/:mediaType", filterController.filterMedia);

// Media-specific routes (dynamic handling based on mediaType)
router.use("/:mediaType", mediaRoute);

export default router;

/**
 * Main routing module for the application.
 *
 * - Consolidates all application routes and delegates them to appropriate handlers or controllers.
 * - Supports dynamic and static routes for various functionalities (users, reviews, genres, etc.).
 *
 * Key Endpoints:
 * - `/user` -> User management.
 * - `/person` -> Person details.
 * - `/reviews` -> User reviews management.
 * - `/feedback` -> Feedback handling.
 * - `/genres/:mediaType` -> Fetches genres for specified media type.
 * - `/certifications/movie` -> Fetches movie-specific certifications.
 * - `/filter/:mediaType` -> Filters media based on parameters.
 * - `/:mediaType` -> Handles media-specific operations dynamically.
 *
 * Features:
 * - Easy extensibility for new routes or functionalities.
 * - Organized and modular structure.
 */
