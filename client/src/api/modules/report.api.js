/**
 * Report API Module
 * Handles review report operations
 */

import privateClient from "../client/private.client";

const reportEndpoints = {
  create: (reviewId) => `reports/${reviewId}`,
  check: (reviewId) => `reports/check/${reviewId}`,
  myReports: "reports/my-reports",
  // Admin endpoints
  adminList: "reports/admin",
  adminStats: "reports/admin/stats",
  adminResolve: (reportId) => `reports/admin/${reportId}`,
  adminBulkResolve: "reports/admin/bulk-resolve",
};

/**
 * Report reasons with labels
 */
export const REPORT_REASONS = [
  { value: "spam", label: "Spam or advertising" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "hate_speech", label: "Hate speech or discrimination" },
  { value: "misinformation", label: "Misinformation or false claims" },
  { value: "spoiler_unmarked", label: "Unmarked spoilers" },
  { value: "inappropriate", label: "Inappropriate or offensive content" },
  { value: "other", label: "Other" },
];

const reportApi = {
  /**
   * Report a review
   */
  create: async ({ reviewId, reason, description }) => {
    try {
      const response = await privateClient.post(reportEndpoints.create(reviewId), {
        reason,
        description,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Check if user has already reported a review
   */
  check: async ({ reviewId }) => {
    try {
      const response = await privateClient.get(reportEndpoints.check(reviewId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get user's submitted reports
   */
  getMyReports: async ({ page = 1, limit = 10 } = {}) => {
    try {
      const response = await privateClient.get(reportEndpoints.myReports, {
        params: { page, limit },
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // ==================== ADMIN APIs ====================

  /**
   * Get all reports for moderation (Admin/Moderator only)
   */
  getReports: async ({ page = 1, limit = 20, status = "pending", reason } = {}) => {
    try {
      const params = { page, limit, status };
      if (reason) params.reason = reason;
      
      const response = await privateClient.get(reportEndpoints.adminList, { params });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get report statistics (Admin/Moderator only)
   */
  getStats: async () => {
    try {
      const response = await privateClient.get(reportEndpoints.adminStats);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Resolve a report (Admin/Moderator only)
   */
  resolve: async ({ reportId, status, resolution, resolutionNote, removeReview }) => {
    try {
      const response = await privateClient.patch(reportEndpoints.adminResolve(reportId), {
        status,
        resolution,
        resolutionNote,
        removeReview,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Bulk resolve reports (Admin only)
   */
  bulkResolve: async ({ reportIds, status, resolution, resolutionNote }) => {
    try {
      const response = await privateClient.post(reportEndpoints.adminBulkResolve, {
        reportIds,
        status,
        resolution,
        resolutionNote,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default reportApi;
