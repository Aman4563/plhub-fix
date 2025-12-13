/**
 * Main Router
 * Consolidates all application routes
 */

import express from "express";
import userRoute from "./user.route.js";
import mediaRoute from "./media.route.js";
import personRoute from "./person.route.js";
import reviewRoute from "./review.route.js";
import reportRoute from "./report.route.js";
import feedbackRoute from "./feedback.route.js";
import watchlistRoute from "./watchlist.route.js";
import collectionRoute from "./collection.route.js";
import newsletterRoute from "./newsletter.route.js";
import contactRoute from "./contact.route.js";
import jobApplicationRoute from "./job.application.route.js";
import adminRoute from "./admin.route.js";
import chatbotRoute from "./chatbot.route.js";
import genreController from "../controllers/genre.controller.js";
import certificationController from "../controllers/certification.controller.js";
import filterController from "../controllers/filter.controller.js";
import watchProviderController from "../controllers/watchProvider.controller.js";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

// Apply API rate limiting to all routes
router.use(apiLimiter);

/**
 * Route mappings:
 * - /user - User authentication and management
 * - /admin - Admin & moderator management (protected)
 * - /person - Actor/director information
 * - /reviews - User reviews with ratings
 * - /reports - User review reports for moderation
 * - /feedback - User feedback submission
 * - /watchlist - User watchlist (separate from favorites)
 * - /collections - User custom collections
 * - /newsletter - Newsletter subscription
 * - /contact - Contact form submissions
 * - /careers - Job applications
 * - /genres/:mediaType - Genre lists
 * - /certifications/movie - Movie ratings/certifications
 * - /watch-providers/:mediaType - Available streaming services
 * - /filter/:mediaType - Advanced media filtering
 * - /:mediaType - Dynamic media routes
 */

// User routes (auth, favorites)
router.use("/user", userRoute);

// Admin routes (user management, moderation)
router.use("/admin", adminRoute);

// Person routes
router.use("/person", personRoute);

// Review routes (with ratings)
router.use("/reviews", reviewRoute);

// Report routes (review reports)
router.use("/reports", reportRoute);

// Feedback routes
router.use("/feedback", feedbackRoute);

// Watchlist routes (Netflix-style "My List")
router.use("/watchlist", watchlistRoute);

// Collection routes (custom lists)
router.use("/collections", collectionRoute);

// Newsletter routes
router.use("/newsletter", newsletterRoute);

// Contact routes
router.use("/contact", contactRoute);

// Careers/Job Application routes
router.use("/careers", jobApplicationRoute);

// AI Chatbot routes
router.use("/chatbot", chatbotRoute);

// Genre routes
router.get("/genres/:mediaType", genreController.getGenres);

// Certification routes
router.get("/certifications/movie", certificationController.getMovieCertifications);
router.get("/certifications/tv", certificationController.getTvCertifications);

// Watch provider routes
router.get("/watch-providers/:mediaType", watchProviderController.getWatchProvidersList);

// Filter routes (advanced search)
router.get("/filter/:mediaType", filterController.filterMedia);

// Media routes (dynamic - movie/tv)
router.use("/:mediaType", mediaRoute);

export default router;
