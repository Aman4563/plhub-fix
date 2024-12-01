import privateClient from "../client/private.client";
import publicClient from "../client/public.client";
import queryString from "query-string";

/**
 * Endpoints for media-related API operations.
 */
const mediaEndpoints = {
  list: ({ mediaType, mediaCategory, page }) =>
    `${mediaType}/${mediaCategory}?page=${page}`, // Fetch list of media items
  detail: ({ mediaType, mediaId }) => `${mediaType}/detail/${mediaId}`, // Fetch details of a specific media item
  search: ({ mediaType, query, page }) =>
    `${mediaType}/search?query=${query}&page=${page}`, // Search for media items
  filter: (mediaType) => `filter/${mediaType}`, // Filter media items
  genres: (mediaType) => `genres/${mediaType}`, // Fetch genres for a specific media type
  certifications: () => `certifications/movie`, // Fetch certifications for movies
};

/**
 * API methods for interacting with media-related endpoints.
 */
const mediaApi = {
  /**
   * Fetches a paginated list of media items.
   *
   * @param {Object} params - Parameters for the request.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaCategory - Media category (e.g., "popular", "top_rated").
   * @param {number} params.page - Page number for pagination.
   * @returns {Promise<Object>} - API response or error.
   */
  getList: async ({ mediaType, mediaCategory, page }) => {
    try {
      const response = await publicClient.get(
        mediaEndpoints.list({ mediaType, mediaCategory, page })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches details of a specific media item.
   *
   * @param {Object} params - Parameters for the request.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {number} params.mediaId - ID of the media item.
   * @returns {Promise<Object>} - API response or error.
   */
  getDetail: async ({ mediaType, mediaId }) => {
    try {
      const response = await privateClient.get(
        mediaEndpoints.detail({ mediaType, mediaId })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Searches for media items based on a query.
   *
   * @param {Object} params - Parameters for the search.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.query - Search query.
   * @param {number} params.page - Page number for pagination.
   * @returns {Promise<Object>} - API response or error.
   */
  search: async ({ mediaType, query, page }) => {
    try {
      const response = await publicClient.get(
        mediaEndpoints.search({ mediaType, query, page })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Filters media items based on various criteria.
   *
   * @param {Object} params - Parameters for the filtering.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {Object} params.params - Filtering options (e.g., genres, language, etc.).
   * @returns {Promise<Object>} - API response or error.
   */
  filterMedia: async ({ mediaType, params }) => {
    const formattedParams = {
      with_genres: params.genre,
      with_original_language: params.language,
      sort_by: params.sortBy || "popularity.desc",
      certification: params.certification,
      certification_country: params.certification_country || "US",
      "vote_average.gte": params.score,
      page: params.page,
      ...(mediaType === "movie"
        ? {
            "primary_release_date.gte": params.startDate,
            "primary_release_date.lte": params.endDate,
          }
        : {
            "first_air_date.gte": params.startDate,
            "first_air_date.lte": params.endDate,
          }),
    };

    Object.keys(formattedParams).forEach(
      (key) => !formattedParams[key] && delete formattedParams[key]
    );

    try {
      const response = await privateClient.get(mediaEndpoints.filter(mediaType), {
        params: formattedParams,
        paramsSerializer: (params) => queryString.stringify(params),
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches genres for a specific media type.
   *
   * @param {string} mediaType - Type of media (e.g., "movie", "tv").
   * @returns {Promise<Object>} - API response or error.
   */
  getGenres: async (mediaType) => {
    try {
      const response = await privateClient.get(
        mediaEndpoints.genres(mediaType)
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches certifications for movies.
   *
   * @returns {Promise<Object>} - API response or error.
   */
  getCertifications: async () => {
    try {
      const response = await privateClient.get(
        mediaEndpoints.certifications()
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default mediaApi;
