/**
 * Media Routes
 * Handles media-related operations including watch providers, validation, and categories
 */

import express from "express";
import { param, query } from "express-validator";
import mediaController from "../controllers/media.controller.js";
import requestHandler from "../handlers/request.handler.js";
import { cacheMiddleware } from "../middlewares/cache.middleware.js";

const router = express.Router({ mergeParams: true });

// Valid media types for validation
const VALID_MEDIA_TYPES = ["movie", "tv"];

// Multi-search (movies, TV, people)
router.get(
  "/multi-search",
  query("query")
    .exists()
    .withMessage("Search query is required")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Search query cannot be empty"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  requestHandler.validate,
  mediaController.multiSearch
);

// Get available categories for media type
router.get(
  "/categories",
  mediaController.getCategories
);

// Search media by query
router.get(
  "/search",
  query("query")
    .exists()
    .withMessage("Search query is required")
    .trim()
    .isLength({ min: 1 })
    .withMessage("Search query cannot be empty"),
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  requestHandler.validate,
  mediaController.search
);

// Fetch genres for the media type (cached for 24 hours)
router.get(
  "/genres",
  cacheMiddleware("genres"),
  mediaController.getGenres
);

// Get trending media (cached for 1 hour)
router.get(
  "/trending",
  query("timeWindow")
    .optional()
    .isIn(["day", "week"])
    .withMessage("Time window must be 'day' or 'week'"),
  requestHandler.validate,
  cacheMiddleware("trending"),
  mediaController.getTrending
);

// Get watch providers for a specific media item
router.get(
  "/detail/:mediaId/watch-providers",
  param("mediaId")
    .isNumeric()
    .withMessage("Media ID must be a number"),
  query("region")
    .optional()
    .isLength({ min: 2, max: 2 })
    .isAlpha()
    .toUpperCase()
    .withMessage("Region must be a 2-letter country code"),
  requestHandler.validate,
  mediaController.getWatchProviders
);

// Get TV show season details
router.get(
  "/detail/:tvId/season/:seasonNumber",
  param("tvId")
    .isNumeric()
    .withMessage("TV ID must be a number"),
  param("seasonNumber")
    .isInt({ min: 0 })
    .withMessage("Season number must be a non-negative integer"),
  requestHandler.validate,
  mediaController.getSeasonDetail
);

// Fetch details for a specific media item by ID
router.get(
  "/detail/:mediaId",
  param("mediaId")
    .isNumeric()
    .withMessage("Media ID must be a number"),
  requestHandler.validate,
  mediaController.getDetail
);

// Discover media with filters (genre, year, rating)
router.get(
  "/discover",
  query("page")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("Page must be between 1 and 500"),
  query("genre")
    .optional()
    .isString()
    .withMessage("Genre must be a string (comma-separated IDs)"),
  query("year")
    .optional()
    .isInt({ min: 1900, max: 2100 })
    .withMessage("Year must be between 1900 and 2100"),
  query("minRating")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("Min rating must be between 0 and 10"),
  query("maxRating")
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage("Max rating must be between 0 and 10"),
  query("sortBy")
    .optional()
    .isIn([
      "popularity.desc", "popularity.asc",
      "vote_average.desc", "vote_average.asc",
      "primary_release_date.desc", "primary_release_date.asc",
      "first_air_date.desc", "first_air_date.asc",
    ])
    .withMessage("Invalid sort option"),
  requestHandler.validate,
  mediaController.discover
);

// Fetch a list of media items by category (cached based on category)
router.get(
  "/:mediaCategory",
  param("mediaCategory")
    .exists()
    .withMessage("Media category is required")
    .isString()
    .withMessage("Media category must be a string"),
  query("page")
    .optional()
    .isInt({ min: 1, max: 500 })
    .withMessage("Page must be between 1 and 500"),
  requestHandler.validate,
  (req, res, next) => {
    const category = req.params.mediaCategory;
    // Use appropriate cache config based on category
    const cacheKey =
      category === "popular"
        ? "popular"
        : category === "top_rated"
        ? "topRated"
        : category === "now_playing" || category === "on_the_air"
        ? "mediaList"
        : "default";
    return cacheMiddleware(cacheKey)(req, res, next);
  },
  mediaController.getList
);

export default router;
