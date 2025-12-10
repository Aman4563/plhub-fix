/**
 * Report Routes
 * Handles user reports for reviews
 * Includes rate limiting and validation
 */

import express from "express";
import { body, query, param } from "express-validator";
import reportController from "../controllers/report.controller.js";
import requestHandler from "../handlers/request.handler.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

// Valid report reasons
const VALID_REASONS = ["spam", "harassment", "hate_speech", "misinformation", "spoiler_unmarked", "inappropriate", "other"];

// ==================== USER ROUTES ====================

// Create a report for a review
router.post(
  "/:reviewId",
  tokenMiddleware.auth,
  apiLimiter,
  param("reviewId")
    .exists().withMessage("Review ID is required")
    .isMongoId().withMessage("Invalid review ID format"),
  body("reason")
    .exists().withMessage("Report reason is required")
    .isIn(VALID_REASONS).withMessage("Invalid report reason"),
  body("description")
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage("Description cannot exceed 500 characters"),
  requestHandler.validate,
  reportController.createReport
);

// Check if user has reported a review
router.get(
  "/check/:reviewId",
  tokenMiddleware.auth,
  apiLimiter,
  param("reviewId")
    .exists().withMessage("Review ID is required")
    .isMongoId().withMessage("Invalid review ID format"),
  requestHandler.validate,
  reportController.checkReport
);

// Get user's submitted reports
router.get(
  "/my-reports",
  tokenMiddleware.auth,
  apiLimiter,
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 50 }).withMessage("Limit must be between 1 and 50"),
  requestHandler.validate,
  reportController.getUserReports
);

// ==================== ADMIN ROUTES ====================

// Get report statistics (Admin/Moderator only)
router.get(
  "/admin/stats",
  tokenMiddleware.auth,
  apiLimiter,
  reportController.getReportStats
);

// Get all reports for moderation (Admin/Moderator only)
router.get(
  "/admin",
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
    .isIn(["pending", "reviewed", "resolved", "dismissed"]).withMessage("Invalid status"),
  query("reason")
    .optional()
    .isIn(VALID_REASONS).withMessage("Invalid reason filter"),
  requestHandler.validate,
  reportController.getReports
);

// Resolve a report (Admin/Moderator only)
router.patch(
  "/admin/:reportId",
  tokenMiddleware.auth,
  apiLimiter,
  param("reportId")
    .exists().withMessage("Report ID is required")
    .isMongoId().withMessage("Invalid report ID format"),
  body("status")
    .exists().withMessage("Status is required")
    .isIn(["reviewed", "resolved", "dismissed"]).withMessage("Invalid status"),
  body("resolution")
    .optional()
    .isIn(["warning_issued", "review_removed", "user_banned", "no_action"]).withMessage("Invalid resolution"),
  body("resolutionNote")
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage("Note cannot exceed 500 characters"),
  body("removeReview")
    .optional()
    .isBoolean().withMessage("removeReview must be a boolean"),
  requestHandler.validate,
  reportController.resolveReport
);

// Bulk resolve reports (Admin only)
router.post(
  "/admin/bulk-resolve",
  tokenMiddleware.auth,
  apiLimiter,
  body("reportIds")
    .isArray({ min: 1, max: 50 }).withMessage("reportIds must be an array with 1-50 items"),
  body("status")
    .exists().withMessage("Status is required")
    .isIn(["reviewed", "resolved", "dismissed"]).withMessage("Invalid status"),
  body("resolution")
    .optional()
    .isIn(["warning_issued", "review_removed", "user_banned", "no_action"]).withMessage("Invalid resolution"),
  body("resolutionNote")
    .optional()
    .isString()
    .isLength({ max: 500 }).withMessage("Note cannot exceed 500 characters"),
  requestHandler.validate,
  reportController.bulkResolveReports
);

export default router;
