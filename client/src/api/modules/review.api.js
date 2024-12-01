import privateClient from "../client/private.client";

/**
 * Endpoints for review-related API operations.
 */
const reviewEndpoints = {
  list: "reviews", // Endpoint to fetch the list of reviews
  add: "reviews", // Endpoint to add a new review
  remove: ({ reviewId }) => `reviews/${reviewId}`, // Endpoint to remove a specific review by ID
};

/**
 * API methods for interacting with review-related endpoints.
 */
const reviewApi = {
  /**
   * Adds a new review for a media item.
   *
   * @param {Object} reviewData - Data for the new review.
   * @param {number} reviewData.mediaId - ID of the media being reviewed.
   * @param {string} reviewData.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} reviewData.mediaTitle - Title of the media.
   * @param {string} reviewData.mediaPoster - URL of the media poster.
   * @param {string} reviewData.content - Content of the review.
   * @returns {Promise<Object>} - API response or error.
   */
  add: async ({ mediaId, mediaType, mediaTitle, mediaPoster, content }) => {
    try {
      const response = await privateClient.post(reviewEndpoints.add, {
        mediaId,
        mediaType,
        mediaTitle,
        mediaPoster,
        content,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Removes a review by its ID.
   *
   * @param {Object} params - Parameters for the request.
   * @param {number} params.reviewId - ID of the review to remove.
   * @returns {Promise<Object>} - API response or error.
   */
  remove: async ({ reviewId }) => {
    try {
      const response = await privateClient.delete(reviewEndpoints.remove({ reviewId }));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches the list of reviews.
   *
   * @returns {Promise<Object>} - API response or error.
   */
  getList: async () => {
    try {
      const response = await privateClient.get(reviewEndpoints.list);
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default reviewApi;
