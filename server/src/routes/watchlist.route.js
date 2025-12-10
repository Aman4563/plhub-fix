/**
 * Watchlist Routes
 * Handles user watchlist operations
 */

import express from "express";
import { body, query } from "express-validator";
import watchlistController from "../controllers/watchlist.controller.js";
import requestHandler from "../handlers/request.handler.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = express.Router();

// All routes require authentication
router.use(tokenMiddleware.auth);

// Get user's watchlist
router.get(
  "/",
  query("status")
    .optional()
    .isIn(["want_to_watch", "watching", "completed", "on_hold", "dropped"])
    .withMessage("Invalid status"),
  query("mediaType")
    .optional()
    .isIn(["movie", "tv"])
    .withMessage("Invalid media type"),
  query("sort")
    .optional()
    .isIn(["createdAt", "priority", "mediaTitle"])
    .withMessage("Invalid sort field"),
  query("order")
    .optional()
    .isIn(["asc", "desc"])
    .withMessage("Invalid order"),
  requestHandler.validate,
  watchlistController.getWatchlist
);

// Get watchlist statistics
router.get("/stats", watchlistController.getWatchlistStats);

// Check if media is in watchlist
router.get(
  "/check/:mediaId",
  watchlistController.checkWatchlist
);

// Add to watchlist
router.post(
  "/",
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
    .optional()
    .isFloat({ min: 0, max: 10 }).withMessage("Rate must be between 0 and 10"),
  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
  body("priority")
    .optional()
    .isInt({ min: 0 }).withMessage("Priority must be a positive integer"),
  requestHandler.validate,
  watchlistController.addToWatchlist
);

// Update watchlist item
router.put(
  "/:watchlistId",
  body("status")
    .optional()
    .isIn(["want_to_watch", "watching", "completed", "on_hold", "dropped"])
    .withMessage("Invalid status"),
  body("currentSeason")
    .optional()
    .isInt({ min: 1 }).withMessage("Season must be a positive integer"),
  body("currentEpisode")
    .optional()
    .isInt({ min: 1 }).withMessage("Episode must be a positive integer"),
  body("notes")
    .optional()
    .isLength({ max: 500 }).withMessage("Notes cannot exceed 500 characters"),
  body("priority")
    .optional()
    .isInt({ min: 0 }).withMessage("Priority must be a positive integer"),
  body("reminderDate")
    .optional()
    .isISO8601().withMessage("Invalid date format"),
  requestHandler.validate,
  watchlistController.updateWatchlistItem
);

// Remove from watchlist
router.delete(
  "/:watchlistId",
  watchlistController.removeFromWatchlist
);

export default router;

