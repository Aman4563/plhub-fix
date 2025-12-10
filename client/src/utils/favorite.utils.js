/**
 * Utility functions for favorites management
 */
const favoriteUtils = {
  /**
   * Check if a media item is in the favorites list
   * @param {Object} params - Parameters
   * @param {Array} params.listFavorites - Array of favorite items
   * @param {string|number} params.mediaId - Media ID to check
   * @returns {boolean} - True if the item is in favorites
   */
  check: ({ listFavorites, mediaId }) => {
    if (!listFavorites || !Array.isArray(listFavorites) || !mediaId) {
      return false;
    }
    
    const mediaIdStr = mediaId.toString();
    return listFavorites.some(
      (item) => item.mediaId?.toString() === mediaIdStr
    );
  },

  /**
   * Find a favorite item by media ID
   * @param {Object} params - Parameters
   * @param {Array} params.listFavorites - Array of favorite items
   * @param {string|number} params.mediaId - Media ID to find
   * @returns {Object|null} - The favorite item or null
   */
  find: ({ listFavorites, mediaId }) => {
    if (!listFavorites || !Array.isArray(listFavorites) || !mediaId) {
      return null;
    }
    
    const mediaIdStr = mediaId.toString();
    return listFavorites.find(
      (item) => item.mediaId?.toString() === mediaIdStr
    ) || null;
  },

  /**
   * Get the favorite ID for a media item
   * @param {Object} params - Parameters
   * @param {Array} params.listFavorites - Array of favorite items
   * @param {string|number} params.mediaId - Media ID
   * @returns {string|null} - The favorite ID or null
   */
  getFavoriteId: ({ listFavorites, mediaId }) => {
    const favorite = favoriteUtils.find({ listFavorites, mediaId });
    return favorite ? (favorite.id || favorite._id) : null;
  },

  /**
   * Count favorites by media type
   * @param {Array} listFavorites - Array of favorite items
   * @returns {Object} - Counts by type { total, movies, tvShows }
   */
  countByType: (listFavorites) => {
    if (!listFavorites || !Array.isArray(listFavorites)) {
      return { total: 0, movies: 0, tvShows: 0 };
    }
    
    return {
      total: listFavorites.length,
      movies: listFavorites.filter(item => item.mediaType === "movie").length,
      tvShows: listFavorites.filter(item => item.mediaType === "tv").length,
    };
  },
};

export default favoriteUtils;
