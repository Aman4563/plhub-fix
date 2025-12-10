/**
 * Watchlist API Module
 * Handles watchlist operations (Netflix-style "My List")
 */

import privateClient from "../client/private.client";

const watchlistEndpoints = {
  list: "watchlist",
  stats: "watchlist/stats",
  check: (mediaId) => `watchlist/check/${mediaId}`,
  item: (watchlistId) => `watchlist/${watchlistId}`,
};

const watchlistApi = {
  /**
   * Get user's watchlist
   */
  getList: async ({ status, mediaType, sort, order } = {}) => {
    try {
      const params = {};
      if (status) params.status = status;
      if (mediaType) params.mediaType = mediaType;
      if (sort) params.sort = sort;
      if (order) params.order = order;

      const response = await privateClient.get(watchlistEndpoints.list, { params });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get watchlist statistics
   */
  getStats: async () => {
    try {
      const response = await privateClient.get(watchlistEndpoints.stats);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Check if media is in watchlist
   */
  check: async ({ mediaId }) => {
    try {
      const response = await privateClient.get(watchlistEndpoints.check(mediaId));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Add item to watchlist
   */
  add: async ({
    mediaId,
    mediaType,
    mediaTitle,
    mediaPoster,
    mediaBackdrop,
    mediaRate,
    notes,
    priority,
  }) => {
    try {
      const response = await privateClient.post(watchlistEndpoints.list, {
        mediaId,
        mediaType,
        mediaTitle,
        mediaPoster,
        mediaBackdrop,
        mediaRate,
        notes,
        priority,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Update watchlist item
   */
  update: async ({ watchlistId, status, currentSeason, currentEpisode, notes, priority, reminderDate }) => {
    try {
      const response = await privateClient.put(watchlistEndpoints.item(watchlistId), {
        status,
        currentSeason,
        currentEpisode,
        notes,
        priority,
        reminderDate,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Remove item from watchlist
   */
  remove: async ({ watchlistId }) => {
    try {
      const response = await privateClient.delete(watchlistEndpoints.item(watchlistId));
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default watchlistApi;

