/**
 * User Routes
 * Handles authentication, user management, and favorites
 * Includes rate limiting for security
 */

import express from "express";
import { body, query, param } from "express-validator";
import favoriteController from "../controllers/favorite.controller.js";
import userController from "../controllers/user.controller.js";
import requestHandler from "../handlers/request.handler.js";
import userModel from "../models/user.model.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import { authLimiter, passwordResetLimiter, apiLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

/**
 * Authentication Routes
 */

// User signup - with rate limiting
router.post(
  "/signup",
  authLimiter,
  body("username")
    .exists().withMessage("Username is required")
    .isLength({ min: 3, max: 30 }).withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers, and underscores"),
  body("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Invalid email address")
    .normalizeEmail(),
  body("password")
    .exists().withMessage("Password is required")
    .isLength({ min: 8, max: 128 }).withMessage("Password must be 8-128 characters")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/\d/).withMessage("Password must contain at least one number"),
  body("confirmPassword")
    .exists().withMessage("Confirm password is required")
    .custom((value, { req }) => {
      if (value !== req.body.password) throw new Error("Passwords do not match");
      return true;
    }),
  body("displayName")
    .exists().withMessage("Display name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Display name must be 2-50 characters")
    .trim()
    .escape()
    .customSanitizer((value) => {
      // Additional XSS protection - remove script tags and event handlers
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/on\w+\s*=/gi, "");
    }),
  body("captchaToken")
    .exists().withMessage("CAPTCHA verification required"),
  body("acceptedTerms")
    .exists().withMessage("You must accept the Terms of Service")
    .isBoolean().withMessage("Invalid terms acceptance value")
    .custom((value) => {
      if (value !== true) throw new Error("You must accept the Terms of Service");
      return true;
    }),
  requestHandler.validate,
  userController.signup
);

// Check username availability (public)
router.get(
  "/check-username/:username",
  apiLimiter,
  param("username")
    .isLength({ min: 3, max: 30 }).withMessage("Username must be 3-30 characters")
    .matches(/^[a-zA-Z0-9_]+$/).withMessage("Invalid username format"),
  requestHandler.validate,
  userController.checkUsernameAvailability
);

// Check email availability (public)
router.get(
  "/check-email/:email",
  apiLimiter,
  param("email")
    .isEmail().withMessage("Invalid email format"),
  requestHandler.validate,
  userController.checkEmailAvailability
);

// Verify email
router.get(
  "/verify-email/:token",
  param("token")
    .exists().withMessage("Verification token is required")
    .isLength({ min: 64, max: 64 }).withMessage("Invalid verification token"),
  requestHandler.validate,
  userController.verifyEmail
);

// Resend verification email
router.post(
  "/resend-verification",
  tokenMiddleware.auth,
  authLimiter,
  userController.resendVerificationEmail
);

// User signin - with rate limiting
router.post(
  "/signin",
  authLimiter,
  body("username")
    .exists().withMessage("Username is required")
    .trim(),
  body("password")
    .exists().withMessage("Password is required"),
  body("captchaToken")
    .exists().withMessage("CAPTCHA verification required"),
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

// Refresh token
router.post(
  "/refresh-token",
  userController.refreshAccessToken
);

// Logout
router.post(
  "/logout",
  userController.logout
);

// Forgot password - with strict rate limiting
router.post(
  "/forgot-password",
  passwordResetLimiter,
  body("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Invalid email address")
    .normalizeEmail(),
  requestHandler.validate,
  userController.forgotPassword
);

// Reset password
router.post(
  "/reset-password",
  passwordResetLimiter,
  body("token")
    .exists().withMessage("Reset token is required")
    .isLength({ min: 64, max: 64 }).withMessage("Invalid reset token"),
  body("newPassword")
    .exists().withMessage("New password is required")
    .isLength({ min: 8, max: 128 }).withMessage("Password must be 8-128 characters")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/\d/).withMessage("Password must contain at least one number"),
  requestHandler.validate,
  userController.resetPassword
);

// Update password - requires authentication with rate limiting
router.put(
  "/update-password",
  tokenMiddleware.auth,
  authLimiter,
  body("password")
    .exists().withMessage("Current password is required")
    .isLength({ min: 8, max: 128 }).withMessage("Current password must be 8-128 characters"),
  body("newPassword")
    .exists().withMessage("New password is required")
    .isLength({ min: 8, max: 128 }).withMessage("Password must be 8-128 characters")
    .matches(/[a-z]/).withMessage("Password must contain at least one lowercase letter")
    .matches(/[A-Z]/).withMessage("Password must contain at least one uppercase letter")
    .matches(/\d/).withMessage("Password must contain at least one number"),
  body("confirmNewPassword")
    .exists().withMessage("Confirm new password is required")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) throw new Error("New passwords do not match");
      return true;
    }),
  requestHandler.validate,
  userController.updatePassword
);

// Get user information - requires authentication
router.get(
  "/info",
  tokenMiddleware.auth,
  userController.getInfo
);

/**
 * Favorites Routes - with rate limiting
 */

// Get favorites count
router.get(
  "/favorites/count",
  tokenMiddleware.auth,
  apiLimiter,
  favoriteController.getFavoritesCount
);

// Check if media is favorited
router.get(
  "/favorites/check/:mediaId",
  tokenMiddleware.auth,
  apiLimiter,
  param("mediaId")
    .exists().withMessage("Media ID is required")
    .notEmpty().withMessage("Media ID cannot be empty"),
  requestHandler.validate,
  favoriteController.checkFavorite
);

// Get user favorites with pagination, filtering, sorting, and search
router.get(
  "/favorites",
  tokenMiddleware.auth,
  apiLimiter,
  query("page")
    .optional()
    .isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage("Limit must be between 1 and 100"),
  query("mediaType")
    .optional()
    .isIn(["movie", "tv"]).withMessage("Media type must be 'movie' or 'tv'"),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "mediaTitle", "mediaRate"]).withMessage("Invalid sort field"),
  query("sortOrder")
    .optional()
    .isIn(["asc", "desc"]).withMessage("Sort order must be 'asc' or 'desc'"),
  query("search")
    .optional()
    .isLength({ max: 100 }).withMessage("Search term too long"),
  requestHandler.validate,
  favoriteController.getFavoritesOfUser
);

// Add a favorite
router.post(
  "/favorites",
  tokenMiddleware.auth,
  apiLimiter,
  body("mediaType")
    .exists().withMessage("Media type is required")
    .isIn(["movie", "tv"]).withMessage("Invalid media type"),
  body("mediaId")
    .exists().withMessage("Media ID is required")
    .notEmpty().withMessage("Media ID cannot be empty"),
  body("mediaTitle")
    .exists().withMessage("Media title is required")
    .trim()
    .isLength({ max: 200 }).withMessage("Title too long"),
  body("mediaPoster")
    .exists().withMessage("Media poster is required"),
  body("mediaRate")
    .exists().withMessage("Media rate is required")
    .isFloat({ min: 0, max: 10 }).withMessage("Rate must be between 0 and 10"),
  requestHandler.validate,
  favoriteController.addFavorite
);

// Bulk remove favorites
router.delete(
  "/favorites/bulk",
  tokenMiddleware.auth,
  apiLimiter,
  body("favoriteIds")
    .exists().withMessage("favoriteIds array is required")
    .isArray({ min: 1, max: 100 }).withMessage("favoriteIds must be an array with 1-100 items"),
  requestHandler.validate,
  favoriteController.bulkRemoveFavorites
);

// Remove all favorites by media type
router.delete(
  "/favorites/type/:mediaType",
  tokenMiddleware.auth,
  apiLimiter,
  param("mediaType")
    .isIn(["movie", "tv"]).withMessage("Media type must be 'movie' or 'tv'"),
  requestHandler.validate,
  favoriteController.removeFavoritesByType
);

// Remove a single favorite
router.delete(
  "/favorites/:favoriteId",
  tokenMiddleware.auth,
  apiLimiter,
  param("favoriteId")
    .exists().withMessage("Favorite ID is required")
    .isMongoId().withMessage("Invalid favorite ID format"),
  requestHandler.validate,
  favoriteController.removeFavorite
);

export default router;
