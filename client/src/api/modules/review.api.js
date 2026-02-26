/**
 * Review API Module
 * Handles review operations with ratings
 */

import privateClient from "../client/private.client";
import publicClient from "../client/public.client";

const reviewEndpoints = {
  list: "reviews",
  stats: "reviews/stats",
  add: (mediaId) => `reviews/${mediaId}`,
  update: (reviewId) => `reviews/${reviewId}`,
  remove: (reviewId) => `reviews/${reviewId}`,
  mediaReviews: (mediaId) => `reviews/media/${mediaId}`,
  userRating: (mediaId) => `reviews/user-rating/${mediaId}`,
  voteHelpful: (reviewId) => `reviews/${reviewId}/helpful`,
  // Admin endpoints
  adminPending: "reviews/admin/pending",
  adminModerate: (reviewId) => `reviews/admin/${reviewId}/moderate`,
  adminBulkModerate: "reviews/admin/bulk-moderate",
  adminDelete: (reviewId) => `reviews/admin/${reviewId}`,
};

const reviewApi = {
  /**
   * Add a new review with optional rating
   */
  add: async ({ mediaId, mediaType, mediaTitle, mediaPoster, content, rating, containsSpoilers }) => {
    try {
      const response = await privateClient.post(reviewEndpoints.add(mediaId), {
        mediaType,
        mediaTitle,
        mediaPoster,
        content,
        rating,
        containsSpoilers,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Update an existing review
   */
  update: async ({ reviewId, content, rating, containsSpoilers }) => {
    try {
      const response = await privateClient.put(reviewEndpoints.update(reviewId), {
        content,
        rating,
        containsSpoilers,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Remove a review
   */
  remove: async ({ reviewId }) => {
    try {
      const response = await privateClient.delete(reviewEndpoints.remove(reviewId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get user's reviews with pagination, filtering, sorting, and search
   *
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 10, max: 50)
   * @param {string} params.sort - Sort option: 'createdAt', 'oldest', 'rating', 'title'
   * @param {string} params.mediaType - Filter by 'movie' or 'tv'
   * @param {string} params.search - Search term for title or content
   * @returns {Promise<Object>} - { response: { reviews, pagination }, err }
   */
  getList: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);
      if (params.sort) queryParams.append("sort", params.sort);
      if (params.mediaType) queryParams.append("mediaType", params.mediaType);
      if (params.search) queryParams.append("search", params.search);
      
      const queryString = queryParams.toString();
      const url = queryString ? `${reviewEndpoints.list}?${queryString}` : reviewEndpoints.list;
      
      const response = await privateClient.get(url);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get all reviews (for backward compatibility)
   * Uses pagination to fetch all items
   */
  getAll: async () => {
    try {
      const allReviews = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await privateClient.get(`${reviewEndpoints.list}?page=${page}&limit=50`);
        const reviews = response.reviews || [];
        allReviews.push(...reviews);
        
        if (reviews.length < 50 || (response.pagination && page >= response.pagination.totalPages)) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      return { response: allReviews };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get user's review statistics
   * Returns counts by type, average rating given, etc.
   */
  getStats: async () => {
    try {
      const response = await privateClient.get(reviewEndpoints.stats);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get reviews for a specific media (public)
   */
  getMediaReviews: async ({ mediaId, page = 1, limit = 10, sort = "createdAt" }) => {
    try {
      const response = await publicClient.get(reviewEndpoints.mediaReviews(mediaId), {
        params: { page, limit, sort },
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get user's rating for a specific media
   */
  getUserRating: async ({ mediaId }) => {
    try {
      const response = await privateClient.get(reviewEndpoints.userRating(mediaId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Vote a review as helpful (toggle)
   */
  voteHelpful: async ({ reviewId }) => {
    try {
      const response = await privateClient.post(reviewEndpoints.voteHelpful(reviewId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  // ==================== ADMIN MODERATION APIs ====================

  /**
   * Get pending reviews for moderation (Admin/Moderator only)
   */
  getPendingReviews: async ({ page = 1, limit = 20, status = "pending" } = {}) => {
    try {
      const response = await privateClient.get(reviewEndpoints.adminPending, {
        params: { page, limit, status },
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Moderate a single review (Admin/Moderator only)
   */
  moderateReview: async ({ reviewId, status, reason }) => {
    try {
      const response = await privateClient.patch(
        reviewEndpoints.adminModerate(reviewId),
        { status, reason }
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Bulk moderate reviews (Admin/Moderator only)
   */
  bulkModerateReviews: async ({ reviewIds, status, reason }) => {
    try {
      const response = await privateClient.post(reviewEndpoints.adminBulkModerate, {
        reviewIds,
        status,
        reason,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Admin delete a review (Admin only)
   */
  adminDeleteReview: async ({ reviewId }) => {
    try {
      const response = await privateClient.delete(reviewEndpoints.adminDelete(reviewId));
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default reviewApi;
