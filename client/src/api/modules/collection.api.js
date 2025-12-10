/**
 * Collection API Module
 * Handles user custom collections
 */

import privateClient from "../client/private.client";
import publicClient from "../client/public.client";

const collectionEndpoints = {
  list: "collections",
  create: "collections",
  detail: (collectionId) => `collections/${collectionId}`,
  update: (collectionId) => `collections/${collectionId}`,
  delete: (collectionId) => `collections/${collectionId}`,
  addItem: (collectionId) => `collections/${collectionId}/items`,
  removeItem: (collectionId, mediaId) => `collections/${collectionId}/items/${mediaId}`,
  public: "collections/public",
};

const collectionApi = {
  /**
   * Get all collections for the current user
   */
  getAll: async () => {
    try {
      const response = await privateClient.get(collectionEndpoints.list);
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Create a new collection
   */
  create: async ({ name, description, isPublic, savedFilters }) => {
    try {
      const response = await privateClient.post(collectionEndpoints.create, {
        name,
        description,
        isPublic,
        savedFilters,
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get a specific collection
   */
  getOne: async (collectionId) => {
    try {
      const response = await privateClient.get(
        collectionEndpoints.detail(collectionId)
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Update a collection
   */
  update: async (collectionId, data) => {
    try {
      const response = await privateClient.put(
        collectionEndpoints.update(collectionId),
        data
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Delete a collection
   */
  delete: async (collectionId) => {
    try {
      const response = await privateClient.delete(
        collectionEndpoints.delete(collectionId)
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Add an item to a collection
   */
  addItem: async (collectionId, { mediaId, mediaType, mediaTitle, mediaPoster, mediaRate }) => {
    try {
      const response = await privateClient.post(
        collectionEndpoints.addItem(collectionId),
        { mediaId, mediaType, mediaTitle, mediaPoster, mediaRate }
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Remove an item from a collection
   */
  removeItem: async (collectionId, mediaId) => {
    try {
      const response = await privateClient.delete(
        collectionEndpoints.removeItem(collectionId, mediaId)
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Get public collections
   */
  getPublic: async ({ page = 1, limit = 20 }) => {
    try {
      const response = await publicClient.get(collectionEndpoints.public, {
        params: { page, limit },
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default collectionApi;

