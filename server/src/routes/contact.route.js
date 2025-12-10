/**
 * Contact Routes
 * Handles contact form submission endpoints
 */

import express from "express";
import { body, param, query } from "express-validator";
import contactController from "../controllers/contact.controller.js";
import requestHandler from "../handlers/request.handler.js";
import { apiLimiter } from "../middlewares/rateLimiter.middleware.js";

const router = express.Router();

/**
 * POST /contact/submit
 * Submit contact form
 */
router.post(
  "/submit",
  apiLimiter,
  body("name")
    .exists().withMessage("Name is required")
    .isLength({ min: 2, max: 100 }).withMessage("Name must be 2-100 characters")
    .trim(),
  body("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address")
    .normalizeEmail(),
  body("subject")
    .exists().withMessage("Subject is required")
    .isLength({ min: 5, max: 200 }).withMessage("Subject must be 5-200 characters")
    .trim(),
  body("category")
    .exists().withMessage("Category is required")
    .isIn([
      "General Inquiry",
      "Technical Support",
      "Account Issues",
      "Content Request",
      "Bug Report",
      "Partnership",
      "DMCA",
      "Other",
    ]).withMessage("Invalid category"),
  body("message")
    .exists().withMessage("Message is required")
    .isLength({ min: 10, max: 5000 }).withMessage("Message must be 10-5000 characters")
    .trim(),
  requestHandler.validate,
  contactController.submit
);

/**
 * GET /contact/ticket/:ticketNumber
 * Get ticket status
 */
router.get(
  "/ticket/:ticketNumber",
  param("ticketNumber")
    .exists().withMessage("Ticket number is required"),
  query("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address"),
  requestHandler.validate,
  contactController.getTicketStatus
);

/**
 * GET /contact/tickets
 * Get user's tickets
 */
router.get(
  "/tickets",
  query("email")
    .exists().withMessage("Email is required")
    .isEmail().withMessage("Please provide a valid email address"),
  requestHandler.validate,
  contactController.getUserTickets
);

export default router;

