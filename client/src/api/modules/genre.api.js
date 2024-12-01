import publicClient from "../client/public.client";

/**
 * Endpoints for genre-related API operations.
 */
const genreEndpoints = {
  /**
   * Constructs the endpoint for fetching genres based on the media type.
   *
   * @param {Object} params - Parameters for the endpoint.
   * @param {string} params.mediaType - The type of media (e.g., "movie", "tv").
   * @returns {string} - The constructed endpoint URL.
   */
  list: ({ mediaType }) => `${mediaType}/genres`,
};

/**
 * API methods for managing genres.
 */
const genreApi = {
  /**
   * Fetches the list of genres for a specific media type.
   *
   * @param {Object} params - Parameters for the request.
   * @param {string} params.mediaType - The type of media (e.g., "movie", "tv").
   * @returns {Promise<Object>} - An object containing the API response or an error.
   */
  getList: async ({ mediaType }) => {
    try {
      // Make a GET request to fetch genres for the specified media type
      const response = await publicClient.get(genreEndpoints.list({ mediaType }));
      return { response };
    } catch (err) {
      // Return the error object if the request fails
      return { err };
    }
  },
};

export default genreApi;
