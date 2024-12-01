// Import necessary modules and controllers
import express from "express";
import { body } from "express-validator"; // Middleware for validating request bodies
import requestHandler from "../handlers/request.handler.js"; // Middleware for handling validation errors
import feedbackController from "../controllers/feedback.controller.js"; // Controller for handling feedback-related operations
import tokenMiddleware from "../middlewares/token.middleware.js"; // Middleware for user authentication

// Initialize Express router
const router = express.Router();

/**
 * Routes for handling user feedback
 */

/**
 * Submit feedback from an authenticated user.
 * Example: POST `/api/v1/feedback/submit-feedback`
 * 
 * @route POST /submit-feedback
 * @access Protected (Requires authentication)
 * @body {string} feedback - The user's feedback message (required)
 */
router.post(
  "/submit-feedback",
  tokenMiddleware.auth, // Ensure the user is authenticated
  body("feedback")
    .exists().withMessage("Feedback is required") // Validate that feedback is provided
    .isString().withMessage("Feedback must be a valid string"), // Ensure feedback is a string
  requestHandler.validate, // Handle validation errors
  feedbackController.submitFeedback // Controller to process the feedback submission
);

/**
 * Retrieve the list of all submitted feedback.
 * Example: GET `/api/v1/feedback/submit-feedback`
 * 
 * @route GET /submit-feedback
 * @access Public
 */
router.get(
  "/submit-feedback",
  feedbackController.getFeedbackList // Controller to retrieve feedback list
);

export default router;

/**
 * Feedback Routes Module:
 *
 * This module defines routes for submitting and retrieving feedback.
 *
 * Key Routes:
 * - `POST /submit-feedback`: Allows an authenticated user to submit feedback.
 * - `GET /submit-feedback`: Retrieves the list of submitted feedback (accessible to all users).
 *
 * Features:
 * - Input validation to ensure feedback is provided and valid.
 * - Authentication requirement for feedback submission.
 *
 * Route Details:
 * - `/submit-feedback`:
 *   - POST: Authenticated users submit feedback.
 *   - GET: Retrieves a list of feedback (public access).
 *
 * Usage:
 * Include this router in the application as `/feedback`.
 */
