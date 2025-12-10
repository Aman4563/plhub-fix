/**
 * Role-Based Access Control (RBAC) Middleware
 * Uses AccessControl library for robust permission management
 * Combined with custom middleware for PLHub-specific features
 */

import { AccessControl } from "accesscontrol";
import responseHandler from "../handlers/response.handler.js";
import logger from "../config/logger.config.js";

// ==================== ACCESS CONTROL CONFIGURATION ====================

const ac = new AccessControl();

/**
 * Define role permissions using AccessControl
 * Hierarchy: user < moderator < admin
 */

// USER permissions - Basic authenticated user
ac.grant("user")
  // Own profile
  .readOwn("profile")
  .updateOwn("profile", ["displayName", "avatar", "bio"])
  // Own reviews
  .createOwn("review")
  .readOwn("review")
  .updateOwn("review", ["content", "rating", "containsSpoilers"])
  .deleteOwn("review")
  // Own favorites & watchlist
  .createOwn("favorite")
  .readOwn("favorite")
  .deleteOwn("favorite")
  .createOwn("watchlist")
  .readOwn("watchlist")
  .updateOwn("watchlist")
  .deleteOwn("watchlist")
  // Public content (read-only)
  .readAny("media")
  .readAny("publicReview");

// MODERATOR permissions - Content moderation
ac.grant("moderator")
  .extend("user")
  // Review moderation
  .readAny("review")
  .updateAny("review", ["status", "moderationReason"])
  // User viewing (limited)
  .readAny("user", ["id", "username", "displayName", "avatar", "role", "warnings", "isSuspended", "createdAt"])
  // Can issue warnings
  .createAny("warning")
  .readAny("warning")
  // Can view reports
  .readAny("report")
  .updateAny("report", ["status", "resolution"])
  // Activity logs (own moderation actions)
  .readOwn("moderationLog");

// ADMIN permissions - Full system access
ac.grant("admin")
  .extend("moderator")
  // Full user management
  .readAny("user")
  .updateAny("user", ["role", "isActive", "isSuspended", "suspendedUntil", "suspensionReason", "isPermanentlyBanned", "banReason"])
  .deleteAny("user")
  // Admin notes
  .createAny("adminNote")
  .readAny("adminNote")
  .deleteAny("adminNote")
  // Role management
  .createAny("role")
  .updateAny("role")
  // Full review control
  .deleteAny("review")
  // System settings
  .readAny("settings")
  .updateAny("settings")
  // Audit logs
  .readAny("auditLog")
  .readAny("moderationLog");

// ==================== ROLE HIERARCHY ====================

const ROLE_HIERARCHY = {
  user: 0,
  moderator: 1,
  admin: 2,
};

// ==================== MIDDLEWARE FUNCTIONS ====================

/**
 * Check if user has required role (exact match)
 * @param {...string} allowedRoles - Roles that can access
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return responseHandler.unauthorize(res, "Authentication required");
    }

    const userRole = req.user.role || "user";

    if (!allowedRoles.includes(userRole)) {
      logger.warn("Access denied - role mismatch", {
        userId: req.user.id,
        userRole,
        requiredRoles: allowedRoles,
        path: req.path,
        method: req.method,
      });
      return responseHandler.forbidden(
        res,
        `Access denied. Required role: ${allowedRoles.join(" or ")}`
      );
    }

    next();
  };
};

/**
 * Check if user has minimum role level (includes higher roles)
 * @param {string} minRole - Minimum role required
 */
const requireMinRole = (minRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return responseHandler.unauthorize(res, "Authentication required");
    }

    const userRole = req.user.role || "user";
    const userLevel = ROLE_HIERARCHY[userRole] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minRole] ?? 0;

    if (userLevel < requiredLevel) {
      logger.warn("Access denied - insufficient role level", {
        userId: req.user.id,
        userRole,
        requiredMinRole: minRole,
        path: req.path,
        method: req.method,
      });
      return responseHandler.forbidden(
        res,
        `Access denied. Minimum role required: ${minRole}`
      );
    }

    next();
  };
};

/**
 * Check permission using AccessControl
 * @param {string} action - Action type: create, read, update, delete
 * @param {string} resource - Resource name
 * @param {string} possession - "own" or "any"
 */
const checkPermission = (action, resource, possession = "any") => {
  return (req, res, next) => {
    if (!req.user) {
      return responseHandler.unauthorize(res, "Authentication required");
    }

    const userRole = req.user.role || "user";
    let permission;

    try {
      // Build permission query dynamically
      const query = ac.can(userRole);
      
      if (possession === "own") {
        switch (action) {
          case "create":
            permission = query.createOwn(resource);
            break;
          case "read":
            permission = query.readOwn(resource);
            break;
          case "update":
            permission = query.updateOwn(resource);
            break;
          case "delete":
            permission = query.deleteOwn(resource);
            break;
          default:
            permission = { granted: false };
        }
      } else {
        switch (action) {
          case "create":
            permission = query.createAny(resource);
            break;
          case "read":
            permission = query.readAny(resource);
            break;
          case "update":
            permission = query.updateAny(resource);
            break;
          case "delete":
            permission = query.deleteAny(resource);
            break;
          default:
            permission = { granted: false };
        }
      }
    } catch (error) {
      logger.error("Permission check error", { error: error.message });
      return responseHandler.error(res, "Authorization check failed");
    }

    if (!permission.granted) {
      logger.warn("Permission denied", {
        userId: req.user.id,
        userRole,
        action,
        resource,
        possession,
        path: req.path,
      });
      return responseHandler.forbidden(
        res,
        `You don't have permission to ${action} this ${resource}`
      );
    }

    // Attach permission to request for attribute filtering
    req.permission = permission;
    next();
  };
};

/**
 * Check if user account is in good standing (not suspended/banned)
 */
const requireGoodStanding = async (req, res, next) => {
  if (!req.user) {
    return responseHandler.unauthorize(res, "Authentication required");
  }

  // Check permanent ban
  if (req.user.isPermanentlyBanned) {
    logger.warn("Banned user attempted action", { userId: req.user.id });
    return responseHandler.forbidden(
      res,
      "Your account has been permanently banned. Contact support for more information."
    );
  }

  // Check suspension
  if (req.user.isSuspended) {
    const suspendedUntil = req.user.suspendedUntil;
    
    if (!suspendedUntil || new Date(suspendedUntil) > new Date()) {
      const until = suspendedUntil 
        ? new Date(suspendedUntil).toLocaleDateString() 
        : "indefinitely";
      
      logger.warn("Suspended user attempted action", { 
        userId: req.user.id,
        suspendedUntil,
      });
      
      return responseHandler.forbidden(
        res,
        `Your account is suspended until ${until}. Reason: ${req.user.suspensionReason || "Policy violation"}`
      );
    }
  }

  next();
};

/**
 * Prevent self-modification for certain admin actions
 */
const preventSelfAction = (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  
  if (targetUserId && targetUserId === req.user.id) {
    return responseHandler.badrequest(
      res,
      "You cannot perform this action on your own account"
    );
  }

  next();
};

/**
 * Prevent actions on users with equal or higher roles
 */
const preventHigherRoleAction = async (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  
  if (!targetUserId) {
    return next();
  }

  // Import here to avoid circular dependency
  const userModel = (await import("../models/user.model.js")).default;
  
  const targetUser = await userModel.findById(targetUserId).select("role");
  
  if (!targetUser) {
    return responseHandler.notfound(res, "User not found");
  }

  const actorLevel = ROLE_HIERARCHY[req.user.role] ?? 0;
  const targetLevel = ROLE_HIERARCHY[targetUser.role] ?? 0;

  if (targetLevel >= actorLevel) {
    logger.warn("Attempted action on equal/higher role", {
      actorId: req.user.id,
      actorRole: req.user.role,
      targetId: targetUserId,
      targetRole: targetUser.role,
    });
    return responseHandler.forbidden(
      res,
      "You cannot perform this action on users with equal or higher roles"
    );
  }

  // Attach target user to request for later use
  req.targetUser = targetUser;
  next();
};

/**
 * Filter response attributes based on permission
 */
const filterAttributes = (data, permission) => {
  if (!permission || !permission.attributes || permission.attributes.includes("*")) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(item => filterSingleItem(item, permission.attributes));
  }

  return filterSingleItem(data, permission.attributes);
};

const filterSingleItem = (item, allowedAttributes) => {
  if (!item || typeof item !== "object") return item;
  
  const filtered = {};
  for (const attr of allowedAttributes) {
    if (item[attr] !== undefined) {
      filtered[attr] = item[attr];
    }
  }
  return filtered;
};

// ==================== CONVENIENCE MIDDLEWARE ====================

const requireAdmin = requireRole("admin");
const requireModerator = requireMinRole("moderator");
const requireUser = requireMinRole("user");

// ==================== EXPORTS ====================

export default {
  // AccessControl instance (for custom queries)
  ac,
  
  // Role hierarchy
  ROLE_HIERARCHY,
  
  // Middleware functions
  requireRole,
  requireMinRole,
  checkPermission,
  requireGoodStanding,
  preventSelfAction,
  preventHigherRoleAction,
  
  // Convenience middleware
  requireAdmin,
  requireModerator,
  requireUser,
  
  // Utilities
  filterAttributes,
};

export { ac, ROLE_HIERARCHY };

