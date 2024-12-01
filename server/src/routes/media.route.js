// Import necessary modules and controllers
import express from "express";
import mediaController from "../controllers/media.controller.js"; // Controller for media-related operations

// Initialize Express router
// `mergeParams: true` allows access to route parameters from parent routers
const router = express.Router({ mergeParams: true });

/**
 * Routes for media-related operations.
 */

// Search media by query
router.get(
  "/search",
  mediaController.search
);

/**
 * Fetch genres for the media.
 * Example: `/api/v1/media/:mediaType/genres`
 */
router.get(
  "/genres",
  mediaController.getGenres
);

/**
 * Fetch details for a specific media item by ID.
 * Example: `/api/v1/media/:mediaType/detail/:mediaId`
 */
router.get(
  "/detail/:mediaId",
  mediaController.getDetail
);

/**
 * Fetch a list of media items by category.
 * Example: `/api/v1/media/:mediaType/:mediaCategory`
 * Categories may include "popular", "top_rated", etc.
 */
router.get(
  "/:mediaCategory",
  mediaController.getList
);

export default router;

/**
 * Media Routes Module:
 *
 * This module defines routes related to media operations, including:
 * - Searching for media (`/search`).
 * - Fetching genres (`/genres`).
 * - Retrieving details of a specific media item (`/detail/:mediaId`).
 * - Listing media items by category (`/:mediaCategory`).
 *
 * Key Features:
 * - Dynamic routes based on media type (e.g., "movie", "tv").
 * - Modular design to extend functionality easily.
 *
 * Route Parameters:
 * - `mediaType`: Parent route parameter (inherited via `mergeParams`).
 * - `mediaCategory`: Media category (e.g., "popular", "top_rated").
 * - `mediaId`: Unique identifier for a specific media item.
 *
 * Usage:
 * Include this router as a sub-route in the application, passing `mediaType`
 * as part of the parent route.
 */
