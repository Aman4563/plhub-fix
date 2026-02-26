/**
 * Review Routes
 * Handles user reviews with ratings
 * Includes rate limiting for security
 */

import express from "express";
import { body, query, param } from "express-validator";
import reviewController from "../controllers/review.controller.js";
import requestHandler from "../handlers/request.handler.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

// ==================== USER REVIEW ROUTES ====================

// Get user's review statistics
router.get(
  "/stats",
  tokenMiddleware.auth,
  apiLimiter,
  reviewController.getReviewStats
);

// Get user's reviews with pagination, filtering, sorting, and search
router.get(
  "/",
  tokenMiddleware.auth,
  apiLimiter,
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  query("sort")
    .optional()
    .isIn(["createdAt", "oldest", "rating", "title"]).withMessage("Invalid sort option"),
  query("mediaType")
    .optional()
    .isIn(["movie", "tv"]).withMessage("Media type must be 'movie' or 'tv'"),
  query("search")
    .optional()
    .isLength({ max: 100 }).withMessage("Search term too long"),
  requestHandler.validate,
  reviewController.getReviewsOfUser
);

// Get reviews for specific media (public)
router.get(
  "/media/:mediaId",
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  query("sort")
    .optional()
    .isIn(["createdAt", "helpful", "rating"]).withMessage("Invalid sort option"),
  requestHandler.validate,
  reviewController.getReviewsForMedia
);

// Get user's rating for specific media (requires auth)
router.get(
  "/user-rating/:mediaId",
  tokenMiddleware.auth,
  apiLimiter,
  param("mediaId")
    .exists().withMessage("Media ID is required")
    .notEmpty().withMessage("Media ID cannot be empty"),
  requestHandler.validate,
  reviewController.getUserRating
);

// Create a review (requires auth)
router.post(
  "/:mediaId",
  tokenMiddleware.auth,
  apiLimiter,
  param("mediaId")
    .exists().withMessage("Media ID is required")
    .notEmpty().withMessage("Media ID cannot be empty"),
  body("content")
    .exists().withMessage("Review content is required")
    .isLength({ min: 10, max: 2000 }).withMessage("Review must be 10-2000 characters"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage("Rating must be between 1 and 10"),
  body("mediaType")
    .exists().withMessage("Media type is required")
    .isIn(["movie", "tv"]).withMessage("Invalid media type"),
  body("mediaTitle")
    .exists().withMessage("Media title is required")
    .trim()
    .isLength({ max: 200 }).withMessage("Title too long"),
  body("mediaPoster")
    .exists().withMessage("Media poster is required"),
  body("containsSpoilers")
    .optional()
    .isBoolean().withMessage("containsSpoilers must be a boolean"),
  requestHandler.validate,
  reviewController.create
);

// Update a review (requires auth)
router.put(
  "/:reviewId",
  tokenMiddleware.auth,
  apiLimiter,
  param("reviewId")
    .exists().withMessage("Review ID is required")
    .isMongoId().withMessage("Invalid review ID format"),
  body("content")
    .optional()
    .isLength({ min: 10, max: 2000 }).withMessage("Review must be 10-2000 characters"),
  body("rating")
    .optional()
    .isInt({ min: 1, max: 10 }).withMessage("Rating must be between 1 and 10"),
  body("containsSpoilers")
    .optional()
    .isBoolean().withMessage("containsSpoilers must be a boolean"),
  requestHandler.validate,
  reviewController.update
);

// Vote review as helpful (requires auth)
router.post(
  "/:reviewId/helpful",
  tokenMiddleware.auth,
  apiLimiter,
  param("reviewId")
    .exists().withMessage("Review ID is required")
    .isMongoId().withMessage("Invalid review ID format"),
  requestHandler.validate,
  reviewController.voteHelpful
);

// Delete a review (requires auth)
router.delete(
  "/:reviewId",
  tokenMiddleware.auth,
  apiLimiter,
  param("reviewId")
    .exists().withMessage("Review ID is required")
    .isMongoId().withMessage("Invalid review ID format"),
  requestHandler.validate,
  reviewController.remove
);

// ==================== ADMIN MODERATION ROUTES ====================

// Get pending reviews for moderation (Admin/Moderator only)
router.get(
  "/admin/pending",
  tokenMiddleware.auth,
  apiLimiter,
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("status")
    .optional()
    .isIn(["pending", "approved", "rejected"]).withMessage("Invalid status"),
  requestHandler.validate,
  reviewController.getPendingReviews
);

// Moderate a single review (Admin/Moderator only)
router.patch(
  "/admin/:reviewId/moderate",
  tokenMiddleware.auth,
  apiLimiter,
  param("reviewId")
    .exists().withMessage("Review ID is required")
    .isMongoId().withMessage("Invalid review ID format"),
  body("status")
    .exists().withMessage("Status is required")
    .isIn(["approved", "rejected"]).withMessage("Status must be 'approved' or 'rejected'"),
  body("reason")
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage("Reason cannot exceed 500 characters"),
  requestHandler.validate,
  reviewController.moderateReview
);

// Bulk moderate reviews (Admin/Moderator only)
router.post(
  "/admin/bulk-moderate",
  tokenMiddleware.auth,
  apiLimiter,
  body("reviewIds")
    .isArray({ min: 1, max: 50 }).withMessage("reviewIds must be an array with 1-50 items"),
  body("status")
    .exists().withMessage("Status is required")
    .isIn(["approved", "rejected"]).withMessage("Status must be 'approved' or 'rejected'"),
  body("reason")
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage("Reason cannot exceed 500 characters"),
  requestHandler.validate,
  reviewController.bulkModerateReviews
);

// Admin delete any review (Admin only)
router.delete(
  "/admin/:reviewId",
  tokenMiddleware.auth,
  apiLimiter,
  param("reviewId")
    .exists().withMessage("Review ID is required")
    .isMongoId().withMessage("Invalid review ID format"),
  requestHandler.validate,
  reviewController.adminDeleteReview
);

export default router;
