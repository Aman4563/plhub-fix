import privateClient from "../client/private.client";

/**
 * Endpoints for favorite-related API operations.
 */
const favoriteEndpoints = {
  list: "user/favorites", // Endpoint to retrieve the list of favorites
  add: "user/favorites", // Endpoint to add a new favorite
  remove: ({ favoriteId }) => `user/favorites/${favoriteId}`, // Endpoint to remove a specific favorite
};

/**
 * API methods for managing user favorites.
 */
const favoriteApi = {
  /**
   * Fetches the list of favorite items for the user.
   *
   * @returns {Promise<Object>} - An object containing the API response or an error.
   */
  getList: async () => {
    try {
      const response = await privateClient.get(favoriteEndpoints.list);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Adds a new item to the user's favorites.
   *
   * @param {Object} favorite - Details of the favorite item.
   * @param {number} favorite.mediaId - ID of the media item.
   * @param {string} favorite.mediaType - Type of the media (e.g., "movie", "tv").
   * @param {string} favorite.mediaTitle - Title of the media item.
   * @param {string} favorite.mediaPoster - URL of the media's poster.
   * @param {number} favorite.mediaRate - Rating of the media item.
   * @returns {Promise<Object>} - An object containing the API response or an error.
   */
  add: async ({ mediaId, mediaType, mediaTitle, mediaPoster, mediaRate }) => {
    try {
      const response = await privateClient.post(favoriteEndpoints.add, {
        mediaId,
        mediaType,
        mediaTitle,
        mediaPoster,
        mediaRate,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Removes an item from the user's favorites.
   *
   * @param {Object} params - Parameters for removing a favorite.
   * @param {number} params.favoriteId - ID of the favorite to remove.
   * @returns {Promise<Object>} - An object containing the API response or an error.
   */
  remove: async ({ favoriteId }) => {
    try {
      const response = await privateClient.delete(
        favoriteEndpoints.remove({ favoriteId })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default favoriteApi;
