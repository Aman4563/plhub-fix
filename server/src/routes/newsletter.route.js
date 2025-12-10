/**
 * Newsletter Routes
 * Handles newsletter subscription endpoints
 */

import express from "express";
import { body, query } from "express-validator";
import newsletterController from "../controllers/newsletter.controller.js";
import requestHandler from "../handlers/request.handler.js";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

/**
 * POST /newsletter/subscribe
 * Subscribe to newsletter
 */
router.post(
  "/subscribe",
  apiLimiter,
  body("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("source")
    .optional()
    .isIn(["footer", "popup", "landing", "other"]).withMessage("Invalid source"),
  body("preferences")
    .optional()
    .isObject().withMessage("Preferences must be an object"),
  requestHandler.validate,
  newsletterController.subscribe
);

/**
 * POST /newsletter/unsubscribe
 * Unsubscribe from newsletter
 */
router.post(
  "/unsubscribe",
  body("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),
  requestHandler.validate,
  newsletterController.unsubscribe
);

/**
 * PUT /newsletter/preferences
 * Update subscription preferences
 */
router.put(
  "/preferences",
  body("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("preferences")
    .exists().withMessage("Preferences are required")
    .isObject().withMessage("Preferences must be an object"),
  requestHandler.validate,
  newsletterController.updatePreferences
);

/**
 * GET /newsletter/status
 * Check subscription status
 */
router.get(
  "/status",
  query("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address"),
  requestHandler.validate,
  newsletterController.checkStatus
);

export default router;

