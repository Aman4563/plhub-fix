// Import necessary modules and controllers
import express from "express";
import { body } from "express-validator"; // Middleware for request body validation
import reviewController from "../controllers/review.controller.js"; // Controller for handling review operations
import tokenMiddleware from "../middlewares/token.middleware.js"; // Middleware for authentication
import requestHandler from "../handlers/request.handler.js"; // Middleware for handling validation errors

// Initialize Express router
// `mergeParams: true` allows this router to access parameters from parent routers
const router = express.Router({ mergeParams: true });

/**
 * Routes for managing reviews
 */

/**
 * Retrieve all reviews created by the authenticated user.
 * Example: GET `/api/v1/reviews`
 * 
 * @route GET /
 * @access Protected (Requires authentication)
 */
router.get(
  "/",
  tokenMiddleware.auth, // Ensure the user is authenticated
  reviewController.getReviewsOfUser // Controller to fetch user-specific reviews
);

/**
 * Create a new review for a media item.
 * Example: POST `/api/v1/reviews`
 * 
 * @route POST /
 * @access Protected (Requires authentication)
 * @body {string} mediaId - ID of the media being reviewed (required)
 * @body {string} content - Review content (required)
 * @body {string} mediaType - Type of the media ("movie" or "tv") (required)
 * @body {string} mediaTitle - Title of the media being reviewed (required)
 * @body {string} mediaPoster - URL of the media's poster image (required)
 */
router.post(
  "/",
  tokenMiddleware.auth, // Ensure the user is authenticated
  // Validation for request body
  body("mediaId")
    .exists().withMessage("mediaId is required")
    .isLength({ min: 1 }).withMessage("mediaId cannot be empty"),
  body("content")
    .exists().withMessage("content is required")
    .isLength({ min: 1 }).withMessage("content cannot be empty"),
  body("mediaType")
    .exists().withMessage("mediaType is required")
    .custom((type) => ["movie", "tv"].includes(type)).withMessage("Invalid mediaType"),
  body("mediaTitle")
    .exists().withMessage("mediaTitle is required"),
  body("mediaPoster")
    .exists().withMessage("mediaPoster is required"),
  requestHandler.validate, // Validate the request body and handle errors
  reviewController.create // Controller to create a new review
);

/**
 * Delete a specific review by its ID.
 * Example: DELETE `/api/v1/reviews/:reviewId`
 * 
 * @route DELETE /:reviewId
 * @access Protected (Requires authentication)
 * @param {string} reviewId - ID of the review to be deleted
 */
router.delete(
  "/:reviewId",
  tokenMiddleware.auth, // Ensure the user is authenticated
  reviewController.remove // Controller to handle review deletion
);

export default router;

/**
 * Review Routes Module:
 *
 * This module defines routes for managing user reviews, including:
 * - Fetching reviews created by the authenticated user.
 * - Creating new reviews for media items.
 * - Deleting existing reviews.
 *
 * Key Features:
 * - Protected routes that require user authentication.
 * - Input validation to ensure required fields are provided and valid.
 *
 * Route Parameters:
 * - `reviewId`: ID of the review to delete (in DELETE route).
 *
 * Usage:
 * Include this router in the application as `/reviews`.
 */
