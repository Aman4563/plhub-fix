/**
 * Admin API Module
 * Handles admin and moderator management operations
 */

import privateClient from "../client/private.client";

const adminEndpoints = {
  // Dashboard
  dashboard: "admin/dashboard",
  moderationLog: "admin/moderation-log",
  
  // User management
  users: "admin/users",
  userDetails: (userId) => `admin/users/${userId}`,
  updateRole: (userId) => `admin/users/${userId}/role`,
  
  // Warnings
  userWarnings: (userId) => `admin/users/${userId}/warnings`,
  removeWarning: (userId, warningId) => `admin/users/${userId}/warnings/${warningId}`,
  
  // Suspension
  suspendUser: (userId) => `admin/users/${userId}/suspend`,
  unsuspendUser: (userId) => `admin/users/${userId}/unsuspend`,
  
  // Ban
  banUser: (userId) => `admin/users/${userId}/ban`,
  unbanUser: (userId) => `admin/users/${userId}/unban`,
  
  // Admin notes
  userNotes: (userId) => `admin/users/${userId}/notes`,
  deleteNote: (userId, noteId) => `admin/users/${userId}/notes/${noteId}`,
};

const adminApi = {
  // ==================== DASHBOARD ====================

  /**
   * Get admin dashboard statistics
   */
  getDashboardStats: async () => {
    try {
      const response = await privateClient.get(adminEndpoints.dashboard);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get moderation activity log
   */
  getModerationLog: async ({ page = 1, limit = 50, moderatorId } = {}) => {
    try {
      const response = await privateClient.get(adminEndpoints.moderationLog, {
        params: { page, limit, moderatorId },
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // ==================== USER MANAGEMENT ====================

  /**
   * Get all users with filtering and pagination
   */
  getAllUsers: async ({
    page = 1,
    limit = 20,
    role,
    status,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
  } = {}) => {
    try {
      const params = { page, limit, sortBy, sortOrder };
      if (role) params.role = role;
      if (status) params.status = status;
      if (search) params.search = search;

      const response = await privateClient.get(adminEndpoints.users, { params });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get single user details
   */
  getUserDetails: async (userId) => {
    try {
      const response = await privateClient.get(adminEndpoints.userDetails(userId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // ==================== ROLE MANAGEMENT ====================

  /**
   * Update user role (Admin only)
   */
  updateUserRole: async ({ userId, role, reason }) => {
    try {
      const response = await privateClient.patch(adminEndpoints.updateRole(userId), {
        role,
        reason,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // ==================== WARNING SYSTEM ====================

  /**
   * Issue a warning to a user
   */
  issueWarning: async ({ userId, reason, severity = "minor" }) => {
    try {
      const response = await privateClient.post(adminEndpoints.userWarnings(userId), {
        reason,
        severity,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get user's warnings
   */
  getUserWarnings: async (userId) => {
    try {
      const response = await privateClient.get(adminEndpoints.userWarnings(userId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Remove a warning (Admin only)
   */
  removeWarning: async ({ userId, warningId }) => {
    try {
      const response = await privateClient.delete(
        adminEndpoints.removeWarning(userId, warningId)
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // ==================== SUSPENSION SYSTEM ====================

  /**
   * Suspend a user temporarily
   * @param {string} userId - User ID
   * @param {string} reason - Suspension reason
   * @param {number} duration - Duration in hours (null = indefinite)
   */
  suspendUser: async ({ userId, reason, duration }) => {
    try {
      const response = await privateClient.post(adminEndpoints.suspendUser(userId), {
        reason,
        duration,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Unsuspend a user
   */
  unsuspendUser: async ({ userId, reason }) => {
    try {
      const response = await privateClient.post(adminEndpoints.unsuspendUser(userId), {
        reason,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // ==================== BAN SYSTEM ====================

  /**
   * Permanently ban a user (Admin only)
   */
  banUser: async ({ userId, reason }) => {
    try {
      const response = await privateClient.post(adminEndpoints.banUser(userId), {
        reason,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Unban a user (Admin only)
   */
  unbanUser: async ({ userId, reason }) => {
    try {
      const response = await privateClient.post(adminEndpoints.unbanUser(userId), {
        reason,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // ==================== ADMIN NOTES ====================

  /**
   * Add an admin note to a user
   */
  addAdminNote: async ({ userId, note }) => {
    try {
      const response = await privateClient.post(adminEndpoints.userNotes(userId), {
        note,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get admin notes for a user
   */
  getAdminNotes: async (userId) => {
    try {
      const response = await privateClient.get(adminEndpoints.userNotes(userId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Delete an admin note
   */
  deleteAdminNote: async ({ userId, noteId }) => {
    try {
      const response = await privateClient.delete(
        adminEndpoints.deleteNote(userId, noteId)
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default adminApi;

