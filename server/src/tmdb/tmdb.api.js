import axiosClient from "../axios/axios.client.js"; // Custom Axios client for HTTP requests
import tmdbEndpoints from "./tmdb.endpoints.js"; // TMDB API endpoint definitions

/**
 * TMDB API Wrapper
 * Provides methods for interacting with TMDB endpoints.
 */
const tmdbApi = {
  /**
   * Fetch a list of media based on type and filters.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {Object} params.filters - Filters for the media list.
   * @returns {Promise<Object>} - Media list response.
   */
  mediaList: async ({ mediaType, filters }) => {
    return axiosClient.get(tmdbEndpoints.mediaList({ mediaType, filters }));
  },

  /**
   * Fetch details of a specific media item.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaId - Media item ID.
   * @returns {Promise<Object>} - Media details response.
   */
  mediaDetail: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaDetail({ mediaType, mediaId }));
  },

  /**
   * Fetch genres for a specific media type.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @returns {Promise<Object>} - Media genres response.
   */
  mediaGenres: async ({ mediaType }) => {
    return axiosClient.get(tmdbEndpoints.mediaGenres({ mediaType }));
  },

  /**
   * Fetch credits (cast and crew) for a specific media item.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaId - Media item ID.
   * @returns {Promise<Object>} - Media credits response.
   */
  mediaCredits: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaCredits({ mediaType, mediaId }));
  },

  /**
   * Fetch videos (trailers, teasers) for a specific media item.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaId - Media item ID.
   * @returns {Promise<Object>} - Media videos response.
   */
  mediaVideos: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaVideos({ mediaType, mediaId }));
  },

  /**
   * Fetch images (posters, backdrops) for a specific media item.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaId - Media item ID.
   * @returns {Promise<Object>} - Media images response.
   */
  mediaImages: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaImages({ mediaType, mediaId }));
  },

  /**
   * Fetch recommendations for a specific media item.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaId - Media item ID.
   * @returns {Promise<Object>} - Media recommendations response.
   */
  mediaRecommend: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaRecommend({ mediaType, mediaId }));
  },

  /**
   * Search for media items.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv", "person").
   * @param {string} params.query - Search query.
   * @param {number} params.page - Page number for pagination.
   * @returns {Promise<Object>} - Media search response.
   */
  mediaSearch: async ({ mediaType, query, page }) => {
    return axiosClient.get(tmdbEndpoints.mediaSearch({ mediaType, query, page }));
  },

  /**
   * Fetch details of a specific person.
   * @param {Object} params - Request parameters.
   * @param {string} params.personId - Person ID.
   * @returns {Promise<Object>} - Person details response.
   */
  personDetail: async ({ personId }) => {
    return axiosClient.get(tmdbEndpoints.personDetail({ personId }));
  },

  /**
   * Fetch media items associated with a specific person.
   * @param {Object} params - Request parameters.
   * @param {string} params.personId - Person ID.
   * @returns {Promise<Object>} - Person media response.
   */
  personMedias: async ({ personId }) => {
    return axiosClient.get(tmdbEndpoints.personMedias({ personId }));
  },

  /**
   * Fetch movie certifications.
   * @returns {Promise<Object>} - Movie certifications response.
   */
  getMovieCertifications: async () => {
    return axiosClient.get(tmdbEndpoints.movieCertifications());
  },
};

export default tmdbApi;
