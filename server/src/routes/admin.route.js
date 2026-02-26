/**
 * Admin Routes
 * Handles admin and moderator management endpoints
 * Includes comprehensive input validation
 */

import express from "express";
import { body, param, query } from "express-validator";
import adminController from "../controllers/admin.controller.js";
import requestHandler from "../handlers/request.handler.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import rbac from "../middlewares/rbac.middleware.js";

const router = express.Router();

// All admin routes require authentication
router.use(tokenMiddleware.auth);

// ==================== DASHBOARD ====================

// Get admin dashboard statistics (Moderator+)
router.get(
  "/dashboard",
  rbac.requireModerator,
  adminController.getDashboardStats
);

// Get moderation activity log (Moderator+)
router.get(
  "/moderation-log",
  rbac.requireModerator,
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1-100"),
  query("moderatorId").optional().isMongoId().withMessage("Invalid moderator ID"),
  requestHandler.validate,
  adminController.getModerationLog
);

// ==================== USER MANAGEMENT ====================

// Get all users (Moderator+)
router.get(
  "/users",
  rbac.requireModerator,
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit").optional().isInt({ min: 1, max: 100 }).withMessage("Limit must be 1-100"),
  query("role").optional().isIn(["user", "moderator", "admin"]).withMessage("Invalid role"),
  query("status").optional().isIn(["active", "suspended", "banned"]).withMessage("Invalid status"),
  query("search").optional().isString().trim().isLength({ max: 100 }).withMessage("Search too long"),
  query("sortBy").optional().isIn(["createdAt", "lastLogin", "username", "role"]).withMessage("Invalid sort field"),
  query("sortOrder").optional().isIn(["asc", "desc"]).withMessage("Sort order must be asc or desc"),
  requestHandler.validate,
  adminController.getAllUsers
);

// Get single user details (Moderator+)
router.get(
  "/users/:userId",
  rbac.requireModerator,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  requestHandler.validate,
  adminController.getUserDetails
);

// ==================== ROLE MANAGEMENT (Admin only) ====================

// Update user role
router.patch(
  "/users/:userId/role",
  rbac.requireAdmin,
  rbac.preventSelfAction,
  rbac.preventHigherRoleAction,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  body("role")
    .exists().withMessage("Role is required")
    .isIn(["user", "moderator", "admin"]).withMessage("Invalid role"),
  body("reason")
    .optional()
    .isString().trim()
    .isLength({ max: 200 }).withMessage("Reason cannot exceed 200 characters"),
  requestHandler.validate,
  adminController.updateUserRole
);

// ==================== WARNING SYSTEM ====================

// Issue a warning to a user (Moderator+)
router.post(
  "/users/:userId/warnings",
  rbac.requireModerator,
  rbac.preventSelfAction,
  rbac.preventHigherRoleAction,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  body("reason")
    .exists().withMessage("Reason is required")
    .isString().trim()
    .isLength({ min: 10, max: 500 }).withMessage("Reason must be 10-500 characters"),
  body("severity")
    .optional()
    .isIn(["minor", "moderate", "severe"]).withMessage("Invalid severity"),
  requestHandler.validate,
  adminController.issueWarning
);

// Get user's warnings (Moderator+)
router.get(
  "/users/:userId/warnings",
  rbac.requireModerator,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  requestHandler.validate,
  adminController.getUserWarnings
);

// Remove a warning (Admin only)
router.delete(
  "/users/:userId/warnings/:warningId",
  rbac.requireAdmin,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  param("warningId").isMongoId().withMessage("Invalid warning ID"),
  requestHandler.validate,
  adminController.removeWarning
);

// ==================== SUSPENSION SYSTEM ====================

// Suspend a user (Moderator+)
router.post(
  "/users/:userId/suspend",
  rbac.requireModerator,
  rbac.preventSelfAction,
  rbac.preventHigherRoleAction,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  body("reason")
    .exists().withMessage("Reason is required")
    .isString().trim()
    .isLength({ min: 10, max: 500 }).withMessage("Reason must be 10-500 characters"),
  body("duration")
    .optional()
    .isInt({ min: 1, max: 8760 }).withMessage("Duration must be 1-8760 hours (1 year max)"),
  requestHandler.validate,
  adminController.suspendUser
);

// Unsuspend a user (Moderator+)
router.post(
  "/users/:userId/unsuspend",
  rbac.requireModerator,
  rbac.preventSelfAction,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  body("reason")
    .optional()
    .isString().trim()
    .isLength({ max: 500 }).withMessage("Reason cannot exceed 500 characters"),
  requestHandler.validate,
  adminController.unsuspendUser
);

// ==================== BAN SYSTEM (Admin only) ====================

// Permanently ban a user
router.post(
  "/users/:userId/ban",
  rbac.requireAdmin,
  rbac.preventSelfAction,
  rbac.preventHigherRoleAction,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  body("reason")
    .exists().withMessage("Reason is required")
    .isString().trim()
    .isLength({ min: 10, max: 500 }).withMessage("Reason must be 10-500 characters"),
  requestHandler.validate,
  adminController.banUser
);

// Unban a user
router.post(
  "/users/:userId/unban",
  rbac.requireAdmin,
  rbac.preventSelfAction,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  body("reason")
    .optional()
    .isString().trim()
    .isLength({ max: 500 }).withMessage("Reason cannot exceed 500 characters"),
  requestHandler.validate,
  adminController.unbanUser
);

// ==================== ADMIN NOTES (Admin only) ====================

// Add an admin note to a user
router.post(
  "/users/:userId/notes",
  rbac.requireAdmin,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  body("note")
    .exists().withMessage("Note is required")
    .isString().trim()
    .isLength({ min: 5, max: 1000 }).withMessage("Note must be 5-1000 characters"),
  requestHandler.validate,
  adminController.addAdminNote
);

// Get admin notes for a user
router.get(
  "/users/:userId/notes",
  rbac.requireAdmin,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  requestHandler.validate,
  adminController.getAdminNotes
);

// Delete an admin note
router.delete(
  "/users/:userId/notes/:noteId",
  rbac.requireAdmin,
  param("userId").isMongoId().withMessage("Invalid user ID"),
  param("noteId").isMongoId().withMessage("Invalid note ID"),
  requestHandler.validate,
  adminController.deleteAdminNote
);

export default router;

