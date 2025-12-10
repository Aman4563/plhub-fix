/**
 * Admin Controller
 * Handles admin and moderator management functions
 * Includes user management, warnings, suspensions, and role management
 */

import userModel from "../models/user.model.js";
import reviewModel from "../models/review.model.js";
import responseHandler from "../handlers/response.handler.js";
import logger from "../config/logger.config.js";
import rbac from "../middlewares/rbac.middleware.js";

// ==================== USER MANAGEMENT ====================

/**
 * Get all users with filtering, pagination, and search
 */
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      status, // active, suspended, banned
      search,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};

    if (role && ["user", "moderator", "admin"].includes(role)) {
      filter.role = role;
    }

    if (status === "active") {
      filter.isActive = true;
      filter.isSuspended = false;
      filter.isPermanentlyBanned = false;
    } else if (status === "suspended") {
      filter.isSuspended = true;
    } else if (status === "banned") {
      filter.isPermanentlyBanned = true;
    }

    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { displayName: { $regex: search, $options: "i" } },
      ];
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Determine fields based on role
    const isModerator = req.user.role === "moderator";
    const selectFields = isModerator
      ? "id username displayName avatar role warnings isSuspended createdAt lastLogin"
      : "-password -refreshToken -resetPasswordToken -resetPasswordExpires";

    const [users, total] = await Promise.all([
      userModel
        .find(filter)
        .select(selectFields)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      userModel.countDocuments(filter),
    ]);

    // Transform users
    const transformedUsers = users.map((user) => ({
      ...user,
      id: user._id?.toString() || user.id,
      activeWarnings: user.warnings?.filter((w) => !w.acknowledged).length || 0,
    }));

    responseHandler.ok(res, {
      users: transformedUsers,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
        hasMore: skip + users.length < total,
      },
      stats: {
        total: await userModel.countDocuments({}),
        active: await userModel.countDocuments({
          isActive: true,
          isSuspended: false,
          isPermanentlyBanned: false,
        }),
        suspended: await userModel.countDocuments({ isSuspended: true }),
        banned: await userModel.countDocuments({ isPermanentlyBanned: true }),
        admins: await userModel.countDocuments({ role: "admin" }),
        moderators: await userModel.countDocuments({ role: "moderator" }),
      },
    });
  } catch (error) {
    logger.error("Error fetching users", { error: error.message });
    responseHandler.error(res, "Failed to fetch users");
  }
};

/**
 * Get single user details (admin view)
 */
const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel
      .findById(userId)
      .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")
      .populate("warnings.issuedBy", "username displayName")
      .populate("adminNotes.addedBy", "username displayName")
      .populate("suspendedBy", "username displayName")
      .populate("bannedBy", "username displayName")
      .populate("roleHistory.changedBy", "username displayName")
      .lean();

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    // Get additional stats
    const [reviewCount, helpfulVotes] = await Promise.all([
      reviewModel.countDocuments({ user: userId }),
      reviewModel.aggregate([
        { $match: { user: user._id } },
        { $group: { _id: null, total: { $sum: "$helpfulVotes" } } },
      ]),
    ]);

    const userWithStats = {
      ...user,
      id: user._id.toString(),
      stats: {
        totalReviews: reviewCount,
        totalHelpfulVotes: helpfulVotes[0]?.total || 0,
        activeWarnings: user.warnings?.filter((w) => !w.acknowledged).length || 0,
        totalWarnings: user.warnings?.length || 0,
      },
    };

    responseHandler.ok(res, userWithStats);
  } catch (error) {
    logger.error("Error fetching user details", { error: error.message });
    responseHandler.error(res, "Failed to fetch user details");
  }
};

// ==================== ROLE MANAGEMENT ====================

/**
 * Update user role (Admin only)
 */
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role, reason } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    const previousRole = user.role;

    if (previousRole === role) {
      return responseHandler.badrequest(res, `User already has role: ${role}`);
    }

    // Record role change in history
    user.roleHistory.push({
      previousRole,
      newRole: role,
      changedBy: req.user.id,
      changedAt: new Date(),
      reason: reason || `Role changed from ${previousRole} to ${role}`,
    });

    user.role = role;
    await user.save();

    logger.info("User role updated", {
      targetUserId: userId,
      previousRole,
      newRole: role,
      changedBy: req.user.id,
      reason,
    });

    responseHandler.ok(res, {
      message: `User role updated to ${role}`,
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        role: user.role,
        previousRole,
      },
    });
  } catch (error) {
    logger.error("Error updating user role", { error: error.message });
    responseHandler.error(res, "Failed to update user role");
  }
};

// ==================== WARNING SYSTEM ====================

/**
 * Issue a warning to a user
 */
const issueWarning = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, severity = "minor" } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    const warning = {
      reason,
      severity,
      issuedBy: req.user.id,
      issuedAt: new Date(),
      acknowledged: false,
    };

    user.warnings.push(warning);
    await user.save();

    logger.info("Warning issued", {
      targetUserId: userId,
      severity,
      issuedBy: req.user.id,
      reason,
    });

    // Get populated warning for response
    const populatedUser = await userModel
      .findById(userId)
      .select("warnings")
      .populate("warnings.issuedBy", "username displayName");

    const issuedWarning = populatedUser.warnings[populatedUser.warnings.length - 1];

    responseHandler.created(res, {
      message: `${severity} warning issued to user`,
      warning: issuedWarning,
      totalWarnings: user.warnings.length,
      unacknowledgedWarnings: user.warnings.filter((w) => !w.acknowledged).length,
    });
  } catch (error) {
    logger.error("Error issuing warning", { error: error.message });
    responseHandler.error(res, "Failed to issue warning");
  }
};

/**
 * Get user's warnings
 */
const getUserWarnings = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel
      .findById(userId)
      .select("warnings")
      .populate("warnings.issuedBy", "username displayName")
      .lean();

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    const warnings = user.warnings || [];
    const acknowledged = warnings.filter((w) => w.acknowledged);
    const unacknowledged = warnings.filter((w) => !w.acknowledged);

    responseHandler.ok(res, {
      warnings,
      summary: {
        total: warnings.length,
        acknowledged: acknowledged.length,
        unacknowledged: unacknowledged.length,
        bySeverity: {
          minor: warnings.filter((w) => w.severity === "minor").length,
          moderate: warnings.filter((w) => w.severity === "moderate").length,
          severe: warnings.filter((w) => w.severity === "severe").length,
        },
      },
    });
  } catch (error) {
    logger.error("Error fetching warnings", { error: error.message });
    responseHandler.error(res, "Failed to fetch warnings");
  }
};

/**
 * Remove a warning (Admin only)
 */
const removeWarning = async (req, res) => {
  try {
    const { userId, warningId } = req.params;

    const user = await userModel.findById(userId);

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    const warningIndex = user.warnings.findIndex(
      (w) => w._id.toString() === warningId
    );

    if (warningIndex === -1) {
      return responseHandler.notfound(res, "Warning not found");
    }

    const removedWarning = user.warnings[warningIndex];
    user.warnings.splice(warningIndex, 1);
    await user.save();

    logger.info("Warning removed", {
      targetUserId: userId,
      warningId,
      removedBy: req.user.id,
    });

    responseHandler.ok(res, {
      message: "Warning removed successfully",
      removedWarning,
      remainingWarnings: user.warnings.length,
    });
  } catch (error) {
    logger.error("Error removing warning", { error: error.message });
    responseHandler.error(res, "Failed to remove warning");
  }
};

// ==================== SUSPENSION SYSTEM ====================

/**
 * Suspend a user temporarily
 */
const suspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, duration } = req.body; // duration in hours, null = indefinite

    const user = await userModel.findById(userId);

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    if (user.isPermanentlyBanned) {
      return responseHandler.badrequest(res, "User is already permanently banned");
    }

    const suspendedUntil = duration
      ? new Date(Date.now() + duration * 60 * 60 * 1000)
      : null;

    user.isSuspended = true;
    user.suspendedUntil = suspendedUntil;
    user.suspensionReason = reason;
    user.suspendedBy = req.user.id;
    user.suspendedAt = new Date();

    // Invalidate refresh token to force logout
    user.refreshToken = undefined;

    await user.save();

    logger.info("User suspended", {
      targetUserId: userId,
      suspendedBy: req.user.id,
      suspendedUntil,
      reason,
    });

    responseHandler.ok(res, {
      message: suspendedUntil
        ? `User suspended until ${suspendedUntil.toISOString()}`
        : "User suspended indefinitely",
      suspension: {
        userId: user.id,
        username: user.username,
        suspendedUntil,
        reason,
        suspendedAt: user.suspendedAt,
      },
    });
  } catch (error) {
    logger.error("Error suspending user", { error: error.message });
    responseHandler.error(res, "Failed to suspend user");
  }
};

/**
 * Unsuspend a user
 */
const unsuspendUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    if (!user.isSuspended) {
      return responseHandler.badrequest(res, "User is not suspended");
    }

    if (user.isPermanentlyBanned) {
      return responseHandler.badrequest(
        res,
        "Cannot unsuspend a permanently banned user. Use unban instead."
      );
    }

    const previousSuspension = {
      reason: user.suspensionReason,
      suspendedAt: user.suspendedAt,
      suspendedUntil: user.suspendedUntil,
    };

    user.isSuspended = false;
    user.suspendedUntil = undefined;
    user.suspensionReason = undefined;
    user.suspendedBy = undefined;
    user.suspendedAt = undefined;

    // Add admin note about unsuspension
    user.adminNotes.push({
      note: `Unsuspended by ${req.user.username}. ${reason ? `Reason: ${reason}` : ""}. Previous suspension reason: ${previousSuspension.reason}`,
      addedBy: req.user.id,
      addedAt: new Date(),
    });

    await user.save();

    logger.info("User unsuspended", {
      targetUserId: userId,
      unsuspendedBy: req.user.id,
      reason,
    });

    responseHandler.ok(res, {
      message: "User unsuspended successfully",
      user: {
        id: user.id,
        username: user.username,
        isSuspended: user.isSuspended,
      },
    });
  } catch (error) {
    logger.error("Error unsuspending user", { error: error.message });
    responseHandler.error(res, "Failed to unsuspend user");
  }
};

// ==================== BAN SYSTEM ====================

/**
 * Permanently ban a user (Admin only)
 */
const banUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    if (user.isPermanentlyBanned) {
      return responseHandler.badrequest(res, "User is already banned");
    }

    user.isPermanentlyBanned = true;
    user.banReason = reason;
    user.bannedBy = req.user.id;
    user.bannedAt = new Date();
    user.isSuspended = false; // Clear suspension if any
    user.suspendedUntil = undefined;
    user.refreshToken = undefined; // Force logout

    await user.save();

    logger.warn("User permanently banned", {
      targetUserId: userId,
      bannedBy: req.user.id,
      reason,
    });

    responseHandler.ok(res, {
      message: "User has been permanently banned",
      ban: {
        userId: user.id,
        username: user.username,
        reason,
        bannedAt: user.bannedAt,
      },
    });
  } catch (error) {
    logger.error("Error banning user", { error: error.message });
    responseHandler.error(res, "Failed to ban user");
  }
};

/**
 * Unban a user (Admin only)
 */
const unbanUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    if (!user.isPermanentlyBanned) {
      return responseHandler.badrequest(res, "User is not banned");
    }

    const previousBan = {
      reason: user.banReason,
      bannedAt: user.bannedAt,
    };

    user.isPermanentlyBanned = false;
    user.banReason = undefined;
    user.bannedBy = undefined;
    user.bannedAt = undefined;

    // Add admin note about unban
    user.adminNotes.push({
      note: `Unbanned by ${req.user.username}. ${reason ? `Reason: ${reason}` : ""}. Previous ban reason: ${previousBan.reason}`,
      addedBy: req.user.id,
      addedAt: new Date(),
    });

    await user.save();

    logger.info("User unbanned", {
      targetUserId: userId,
      unbannedBy: req.user.id,
      reason,
    });

    responseHandler.ok(res, {
      message: "User has been unbanned",
      user: {
        id: user.id,
        username: user.username,
        isPermanentlyBanned: user.isPermanentlyBanned,
      },
    });
  } catch (error) {
    logger.error("Error unbanning user", { error: error.message });
    responseHandler.error(res, "Failed to unban user");
  }
};

// ==================== ADMIN NOTES ====================

/**
 * Add an admin note to a user
 */
const addAdminNote = async (req, res) => {
  try {
    const { userId } = req.params;
    const { note } = req.body;

    const user = await userModel.findById(userId);

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    user.adminNotes.push({
      note,
      addedBy: req.user.id,
      addedAt: new Date(),
    });

    await user.save();

    // Get populated note
    const updatedUser = await userModel
      .findById(userId)
      .select("adminNotes")
      .populate("adminNotes.addedBy", "username displayName");

    const addedNote = updatedUser.adminNotes[updatedUser.adminNotes.length - 1];

    logger.info("Admin note added", {
      targetUserId: userId,
      addedBy: req.user.id,
    });

    responseHandler.created(res, {
      message: "Admin note added",
      note: addedNote,
    });
  } catch (error) {
    logger.error("Error adding admin note", { error: error.message });
    responseHandler.error(res, "Failed to add admin note");
  }
};

/**
 * Get admin notes for a user
 */
const getAdminNotes = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await userModel
      .findById(userId)
      .select("adminNotes")
      .populate("adminNotes.addedBy", "username displayName")
      .lean();

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    responseHandler.ok(res, {
      notes: user.adminNotes || [],
      total: user.adminNotes?.length || 0,
    });
  } catch (error) {
    logger.error("Error fetching admin notes", { error: error.message });
    responseHandler.error(res, "Failed to fetch admin notes");
  }
};

/**
 * Delete an admin note (Admin only)
 */
const deleteAdminNote = async (req, res) => {
  try {
    const { userId, noteId } = req.params;

    const user = await userModel.findById(userId);

    if (!user) {
      return responseHandler.notfound(res, "User not found");
    }

    const noteIndex = user.adminNotes.findIndex(
      (n) => n._id.toString() === noteId
    );

    if (noteIndex === -1) {
      return responseHandler.notfound(res, "Note not found");
    }

    user.adminNotes.splice(noteIndex, 1);
    await user.save();

    logger.info("Admin note deleted", {
      targetUserId: userId,
      noteId,
      deletedBy: req.user.id,
    });

    responseHandler.ok(res, { message: "Admin note deleted" });
  } catch (error) {
    logger.error("Error deleting admin note", { error: error.message });
    responseHandler.error(res, "Failed to delete admin note");
  }
};

// ==================== DASHBOARD STATS ====================

/**
 * Get admin dashboard statistics
 */
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();
    const last24Hours = new Date(now - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      totalReviews,
      pendingReviews,
      suspendedUsers,
      bannedUsers,
      activeWarnings,
      roleDistribution,
    ] = await Promise.all([
      userModel.countDocuments({}),
      userModel.countDocuments({ createdAt: { $gte: last24Hours } }),
      userModel.countDocuments({ createdAt: { $gte: last7Days } }),
      reviewModel.countDocuments({}),
      reviewModel.countDocuments({ status: "pending" }),
      userModel.countDocuments({ isSuspended: true }),
      userModel.countDocuments({ isPermanentlyBanned: true }),
      userModel.aggregate([
        { $unwind: "$warnings" },
        { $match: { "warnings.acknowledged": false } },
        { $count: "total" },
      ]),
      userModel.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),
    ]);

    responseHandler.ok(res, {
      users: {
        total: totalUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersWeek,
        suspended: suspendedUsers,
        banned: bannedUsers,
        roles: roleDistribution.reduce((acc, r) => {
          acc[r._id] = r.count;
          return acc;
        }, {}),
      },
      reviews: {
        total: totalReviews,
        pendingModeration: pendingReviews,
      },
      moderation: {
        activeWarnings: activeWarnings[0]?.total || 0,
        suspendedUsers,
        bannedUsers,
      },
      timestamp: now.toISOString(),
    });
  } catch (error) {
    logger.error("Error fetching dashboard stats", { error: error.message });
    responseHandler.error(res, "Failed to fetch dashboard stats");
  }
};

// ==================== ACTIVITY LOG ====================

/**
 * Get moderation activity log
 */
const getModerationLog = async (req, res) => {
  try {
    const { page = 1, limit = 50, action, moderatorId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // For now, we'll aggregate from reviews with moderation data
    const filter = { moderatedAt: { $exists: true } };
    
    if (moderatorId) {
      filter.moderatedBy = moderatorId;
    }

    const [logs, total] = await Promise.all([
      reviewModel
        .find(filter)
        .select("status moderatedBy moderatedAt moderationReason mediaTitle")
        .populate("moderatedBy", "username displayName")
        .sort({ moderatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      reviewModel.countDocuments(filter),
    ]);

    responseHandler.ok(res, {
      logs: logs.map((log) => ({
        id: log._id,
        action: `review_${log.status}`,
        target: log.mediaTitle,
        moderator: log.moderatedBy,
        reason: log.moderationReason,
        timestamp: log.moderatedAt,
      })),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    logger.error("Error fetching moderation log", { error: error.message });
    responseHandler.error(res, "Failed to fetch moderation log");
  }
};

export default {
  // User management
  getAllUsers,
  getUserDetails,
  
  // Role management
  updateUserRole,
  
  // Warning system
  issueWarning,
  getUserWarnings,
  removeWarning,
  
  // Suspension system
  suspendUser,
  unsuspendUser,
  
  // Ban system
  banUser,
  unbanUser,
  
  // Admin notes
  addAdminNote,
  getAdminNotes,
  deleteAdminNote,
  
  // Dashboard & logs
  getDashboardStats,
  getModerationLog,
};

