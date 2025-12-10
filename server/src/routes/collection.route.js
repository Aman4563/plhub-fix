/**
 * Collection Routes
 * Handles user custom collections
 */

import express from "express";
import { body, param, query } from "express-validator";
import collectionController from "../controllers/collection.controller.js";
import requestHandler from "../handlers/request.handler.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = express.Router();

/**
 * Get public collections (no auth required)
 */
router.get(
  "/public",
  query("page").optional().isInt({ min: 1 }),
  query("limit").optional().isInt({ min: 1, max: 50 }),
  requestHandler.validate,
  collectionController.getPublicCollections
);

/**
 * All routes below require authentication
 */
router.use(tokenMiddleware.auth);

/**
 * Create a new collection
 */
router.post(
  "/",
  body("name")
    .notEmpty()
    .withMessage("Collection name is required")
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("isPublic").optional().isBoolean(),
  requestHandler.validate,
  collectionController.createCollection
);

/**
 * Get all collections for the current user
 */
router.get("/", collectionController.getUserCollections);

/**
 * Get a specific collection
 */
router.get(
  "/:collectionId",
  param("collectionId").isMongoId().withMessage("Invalid collection ID"),
  requestHandler.validate,
  collectionController.getCollection
);

/**
 * Update a collection
 */
router.put(
  "/:collectionId",
  param("collectionId").isMongoId().withMessage("Invalid collection ID"),
  body("name")
    .optional()
    .isLength({ max: 100 })
    .withMessage("Name cannot exceed 100 characters"),
  body("description")
    .optional()
    .isLength({ max: 500 })
    .withMessage("Description cannot exceed 500 characters"),
  body("isPublic").optional().isBoolean(),
  requestHandler.validate,
  collectionController.updateCollection
);

/**
 * Delete a collection
 */
router.delete(
  "/:collectionId",
  param("collectionId").isMongoId().withMessage("Invalid collection ID"),
  requestHandler.validate,
  collectionController.deleteCollection
);

/**
 * Add an item to a collection
 */
router.post(
  "/:collectionId/items",
  param("collectionId").isMongoId().withMessage("Invalid collection ID"),
  body("mediaId").notEmpty().withMessage("Media ID is required"),
  body("mediaType").isIn(["movie", "tv"]).withMessage("Invalid media type"),
  body("mediaTitle").notEmpty().withMessage("Media title is required"),
  requestHandler.validate,
  collectionController.addItemToCollection
);

/**
 * Remove an item from a collection
 */
router.delete(
  "/:collectionId/items/:mediaId",
  param("collectionId").isMongoId().withMessage("Invalid collection ID"),
  param("mediaId").notEmpty().withMessage("Media ID is required"),
  requestHandler.validate,
  collectionController.removeItemFromCollection
);

export default router;

