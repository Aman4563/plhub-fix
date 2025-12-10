/**
 * Job Application Routes
 * Handles routes for job application operations
 */

import express from "express";
import { body, param, query } from "express-validator";
import requestHandler from "../handlers/request.handler.js";
import jobApplicationController from "../controllers/job.application.controller.js";

const router = express.Router();

/**
 * POST /api/v1/careers/apply
 * Submit a job application
 */
router.post(
  "/apply",
  body("name")
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ max: 100 })
    .withMessage("Name must be at most 100 characters"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  body("position")
    .notEmpty()
    .withMessage("Position is required"),
  body("department")
    .notEmpty()
    .withMessage("Department is required")
    .isIn(["Engineering", "Design", "Marketing", "Support", "Other"])
    .withMessage("Invalid department"),
  body("experience")
    .optional({ nullable: true, checkFalsy: true })
    .isIn(["0-1", "1-3", "3-5", "5-10", "10+"])
    .withMessage("Invalid experience range"),
  body("coverLetter")
    .optional()
    .isLength({ max: 5000 })
    .withMessage("Cover letter must be at most 5000 characters"),
  requestHandler.validate,
  jobApplicationController.submit
);

/**
 * GET /api/v1/careers/application/:applicationId
 * Get application status by application ID
 */
router.get(
  "/application/:applicationId",
  param("applicationId")
    .notEmpty()
    .withMessage("Application ID is required"),
  query("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  requestHandler.validate,
  jobApplicationController.getStatus
);

/**
 * GET /api/v1/careers/applications
 * Get all applications for a user by email
 */
router.get(
  "/applications",
  query("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  requestHandler.validate,
  jobApplicationController.getUserApplications
);

/**
 * POST /api/v1/careers/withdraw/:applicationId
 * Withdraw an application
 */
router.post(
  "/withdraw/:applicationId",
  param("applicationId")
    .notEmpty()
    .withMessage("Application ID is required"),
  body("email")
    .notEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Please provide a valid email address"),
  requestHandler.validate,
  jobApplicationController.withdraw
);

export default router;

