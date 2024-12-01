// Import necessary modules and controllers
import express from "express";
import { body } from "express-validator"; // Middleware for input validation
import favoriteController from "../controllers/favorite.controller.js"; // Controller for favorite operations
import userController from "../controllers/user.controller.js"; // Controller for user operations
import requestHandler from "../handlers/request.handler.js"; // Custom request handler for validation
import userModel from "../models/user.model.js"; // User model for database interaction
import tokenMiddleware from "../middlewares/token.middleware.js"; // Middleware for authentication

// Initialize Express router
const router = express.Router();

/**
 * Routes for user authentication and management
 */

// User signup
router.post(
  "/signup",
  // Validate and sanitize input
  body("username")
    .exists().withMessage("Username is required")
    .isLength({ min: 8 }).withMessage("Username must be at least 8 characters")
    .custom(async (value) => {
      const user = await userModel.findOne({ username: value });
      if (user) return Promise.reject("Username already in use");
    }),
  body("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Invalid email address")
    .custom(async (value) => {
      const user = await userModel.findOne({ email: value });
      if (user) return Promise.reject("Email already in use");
    }),
  body("password")
    .exists().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("confirmPassword")
    .exists().withMessage("Confirm password is required")
    .isLength({ min: 8 }).withMessage("Confirm password must be at least 8 characters")
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Passwords do not match");
      return true;
    }),
  body("displayName")
    .exists().withMessage("Display name is required")
    .isLength({ min: 8 }).withMessage("Display name must be at least 8 characters"),
  body("captchaToken")
    .exists().withMessage("Captcha token is required"),
  requestHandler.validate, // Custom validation middleware
  userController.signup // Controller method
);

// User signin
router.post(
  "/signin",
  body("username")
    .exists().withMessage("Username is required")
    .isLength({ min: 8 }).withMessage("Username must be at least 8 characters"),
  body("password")
    .exists().withMessage("Password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("captchaToken")
    .exists().withMessage("Captcha token is required"),
  requestHandler.validate,
  userController.signin
);

// Google Sign-In
router.post(
  "/google-signin",
  body("tokenId")
    .exists().withMessage("Google token ID is required"),
  requestHandler.validate,
  userController.googleSignIn
);

// Forgot password
router.post(
  "/forgot-password",
  body("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Invalid email address"),
  requestHandler.validate,
  userController.forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  body("token")
    .exists().withMessage("Reset token is required"),
  body("newPassword")
    .exists().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
  requestHandler.validate,
  userController.resetPassword
);

// Update password
router.put(
  "/update-password",
  tokenMiddleware.auth, // Authentication middleware
  body("password")
    .exists().withMessage("Current password is required")
    .isLength({ min: 8 }).withMessage("Password must be at least 8 characters"),
  body("newPassword")
    .exists().withMessage("New password is required")
    .isLength({ min: 8 }).withMessage("New password must be at least 8 characters"),
  body("confirmNewPassword")
    .exists().withMessage("Confirm new password is required")
    .isLength({ min: 8 }).withMessage("Confirm password must be at least 8 characters")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error("New passwords do not match");
      return true;
    }),
  requestHandler.validate,
  userController.updatePassword
);

// Get user information
router.get(
  "/info",
  tokenMiddleware.auth, // Authentication required
  userController.getInfo
);

/**
 * Routes for managing user favorites
 */

// Get user favorites
router.get(
  "/favorites",
  tokenMiddleware.auth,
  favoriteController.getFavoritesOfUser
);

// Add a favorite
router.post(
  "/favorites",
  tokenMiddleware.auth,
  body("mediaType")
    .exists().withMessage("Media type is required")
    .custom((type) => ["movie", "tv"].includes(type)).withMessage("Invalid media type"),
  body("mediaId")
    .exists().withMessage("Media ID is required")
    .isLength({ min: 1 }).withMessage("Media ID cannot be empty"),
  body("mediaTitle")
    .exists().withMessage("Media title is required"),
  body("mediaPoster")
    .exists().withMessage("Media poster is required"),
  body("mediaRate")
    .exists().withMessage("Media rate is required"),
  requestHandler.validate,
  favoriteController.addFavorite
);

// Remove a favorite
router.delete(
  "/favorites/:favoriteId",
  tokenMiddleware.auth,
  favoriteController.removeFavorite
);

export default router;

/**
 * This module defines user-related and favorite-related routes.
 *
 * Features:
 * - User authentication and management (signup, signin, password updates, etc.).
 * - Integration with Google Sign-In.
 * - CRUD operations for user favorites.
 *
 * Middleware:
 * - `tokenMiddleware.auth`: Ensures the user is authenticated for protected routes.
 * - `requestHandler.validate`: Validates input and handles errors.
 *
 * Input Validation:
 * - Ensures required fields are provided and meet format requirements.
 * - Custom validators for unique fields like username and email.
 */
