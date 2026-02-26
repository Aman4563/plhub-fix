import privateClient from "../client/private.client";

/**
 * Endpoints for favorite-related API operations.
 */
const favoriteEndpoints = {
  list: "user/favorites",
  add: "user/favorites",
  remove: ({ favoriteId }) => `user/favorites/${favoriteId}`,
  bulkRemove: "user/favorites/bulk",
  removeByType: ({ mediaType }) => `user/favorites/type/${mediaType}`,
  count: "user/favorites/count",
  check: ({ mediaId }) => `user/favorites/check/${mediaId}`,
};

/**
 * API methods for managing user favorites.
 */
const favoriteApi = {
  /**
   * Fetches the list of favorite items with pagination, filtering, sorting, and search.
   *
   * @param {Object} params - Query parameters
   * @param {number} params.page - Page number (default: 1)
   * @param {number} params.limit - Items per page (default: 20, max: 100)
   * @param {string} params.mediaType - Filter by 'movie' or 'tv'
   * @param {string} params.sortBy - Sort field: 'createdAt', 'mediaTitle', 'mediaRate'
   * @param {string} params.sortOrder - Sort order: 'asc' or 'desc'
   * @param {string} params.search - Search term for title
   * @returns {Promise<Object>} - { response: { favorites, pagination }, err }
   */
  getList: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.page) queryParams.append("page", params.page);
      if (params.limit) queryParams.append("limit", params.limit);
      if (params.mediaType) queryParams.append("mediaType", params.mediaType);
      if (params.sortBy) queryParams.append("sortBy", params.sortBy);
      if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
      if (params.search) queryParams.append("search", params.search);
      
      const queryString = queryParams.toString();
      const url = queryString ? `${favoriteEndpoints.list}?${queryString}` : favoriteEndpoints.list;
      
      const response = await privateClient.get(url);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches all favorites (for backward compatibility with Redux store).
   * Uses pagination to fetch all items.
   *
   * @returns {Promise<Object>} - { response: favorites[], err }
   */
  getAll: async () => {
    try {
      const allFavorites = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const response = await privateClient.get(`${favoriteEndpoints.list}?page=${page}&limit=100`);
        const favorites = response.favorites || [];
        allFavorites.push(...favorites);
        
        if (favorites.length < 100 || (response.pagination && page >= response.pagination.totalPages)) {
          hasMore = false;
        } else {
          page++;
        }
      }
      
      return { response: allFavorites };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Gets favorites count by media type.
   *
   * @returns {Promise<Object>} - { response: { total, movies, tvShows }, err }
   */
  getCount: async () => {
    try {
      const response = await privateClient.get(favoriteEndpoints.count);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Checks if a media item is in favorites.
   *
   * @param {Object} params - Parameters
   * @param {string} params.mediaId - Media ID to check
   * @returns {Promise<Object>} - { response: { isFavorite, favorite }, err }
   */
  check: async ({ mediaId }) => {
    try {
      const response = await privateClient.get(favoriteEndpoints.check({ mediaId }));
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
   * @returns {Promise<Object>} - { response: { ...favorite, alreadyFavorited }, err }
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
   * @param {string} params.favoriteId - ID of the favorite to remove.
   * @returns {Promise<Object>} - { response: { message }, err }
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

  /**
   * Bulk removes multiple favorites.
   *
   * @param {Object} params - Parameters
   * @param {string[]} params.favoriteIds - Array of favorite IDs to remove
   * @returns {Promise<Object>} - { response: { message, deletedCount }, err }
   */
  bulkRemove: async ({ favoriteIds }) => {
    try {
      const response = await privateClient.delete(favoriteEndpoints.bulkRemove, {
        data: { favoriteIds },
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Removes all favorites of a specific media type.
   *
   * @param {Object} params - Parameters
   * @param {string} params.mediaType - 'movie' or 'tv'
   * @returns {Promise<Object>} - { response: { message, deletedCount }, err }
   */
  removeByType: async ({ mediaType }) => {
    try {
      const response = await privateClient.delete(
        favoriteEndpoints.removeByType({ mediaType })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default favoriteApi;
