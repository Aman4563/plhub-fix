// Import necessary modules and controllers
import express from "express";
import personController from "../controllers/person.controller.js"; // Controller for person-related operations

// Initialize Express router
// `mergeParams: true` enables access to route parameters from parent routers
const router = express.Router({ mergeParams: true });

/**
 * Routes for person-related operations
 */

/**
 * Search for people (actors, directors, etc.)
 * Example: `/api/v1/person/search?query=tom&page=1`
 * 
 * @route GET /search
 * @query {string} query - Search term
 * @query {number} page - Page number (optional)
 */
router.get(
  "/search",
  personController.searchPerson
);

/**
 * Fetch combined credits for a specific person.
 * Example: `/api/v1/person/:personId/credits`
 * 
 * @route GET /:personId/credits
 * @param {string} personId - Unique identifier of the person
 */
router.get(
  "/:personId/credits",
  personController.personCredits
);

/**
 * Fetch all media associated with a specific person.
 * Example: `/api/v1/person/:personId/medias`
 * 
 * @route GET /:personId/medias
 * @param {string} personId - Unique identifier of the person
 */
router.get(
  "/:personId/medias",
  personController.personMedias
);

/**
 * Fetch detailed information about a specific person.
 * Example: `/api/v1/person/:personId`
 * 
 * @route GET /:personId
 * @param {string} personId - Unique identifier of the person
 */
router.get(
  "/:personId",
  personController.personDetail
);

export default router;

/**
 * Person Routes Module:
 *
 * This module defines routes related to individuals (e.g., actors, directors) and their associated media.
 *
 * Key Routes:
 * - `/person/:personId/medias` - Retrieves all media items related to a person.
 * - `/person/:personId` - Retrieves detailed information about a person.
 *
 * Route Parameters:
 * - `personId`: Unique identifier of the person (provided dynamically in the route).
 *
 * Features:
 * - Modular design for easy extension.
 * - Dynamic routes to fetch person-specific data.
 *
 * Usage:
 * Include this router as a sub-route in the main application, typically under `/person`.
 */
