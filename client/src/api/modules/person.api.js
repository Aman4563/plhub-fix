import publicClient from "../client/public.client";

/**
 * Endpoints for person-related API operations.
 */
const personEndpoints = {
  /**
   * Constructs the endpoint for fetching details of a specific person.
   *
   * @param {Object} params - Parameters for the endpoint.
   * @param {number} params.personId - The ID of the person.
   * @returns {string} - The constructed endpoint URL.
   */
  detail: ({ personId }) => `person/${personId}`,

  /**
   * Constructs the endpoint for fetching media associated with a specific person.
   *
   * @param {Object} params - Parameters for the endpoint.
   * @param {number} params.personId - The ID of the person.
   * @returns {string} - The constructed endpoint URL.
   */
  medias: ({ personId }) => `person/${personId}/medias`,
};

/**
 * API methods for interacting with person-related endpoints.
 */
const personApi = {
  /**
   * Fetches details of a specific person.
   *
   * @param {Object} params - Parameters for the request.
   * @param {number} params.personId - The ID of the person.
   * @returns {Promise<Object>} - API response or error.
   */
  detail: async ({ personId }) => {
    try {
      const response = await publicClient.get(personEndpoints.detail({ personId }));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches media items associated with a specific person.
   *
   * @param {Object} params - Parameters for the request.
   * @param {number} params.personId - The ID of the person.
   * @returns {Promise<Object>} - API response or error.
   */
  medias: async ({ personId }) => {
    try {
      const response = await publicClient.get(personEndpoints.medias({ personId }));
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default personApi;
