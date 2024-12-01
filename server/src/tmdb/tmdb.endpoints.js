// Import TMDB configuration utility
import tmdbConfig from "./tmdb.config.js";

/**
 * TMDB Endpoints
 * Provides URL constructors for various TMDB API endpoints.
 */
const tmdbEndpoints = {
  /**
   * Get a media list based on type and filters.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {Object} params.filters - Filters for the media list.
   * @returns {string} - Constructed URL for the media list endpoint.
   */
  mediaList: ({ mediaType, filters }) =>
    tmdbConfig.getUrl(`discover/${mediaType}`, filters),

  /**
   * Get details for a specific media item.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaId - Media item ID.
   * @returns {string} - Constructed URL for the media detail endpoint.
   */
  mediaDetail: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}`),

  /**
   * Get genres for a specific media type.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @returns {string} - Constructed URL for the genre list endpoint.
   */
  mediaGenres: ({ mediaType }) =>
    tmdbConfig.getUrl(`genre/${mediaType}/list`),

  /**
   * Get credits (cast and crew) for a specific media item.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaId - Media item ID.
   * @returns {string} - Constructed URL for the credits endpoint.
   */
  mediaCredits: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/credits`),

  /**
   * Get videos (trailers, teasers) for a specific media item.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaId - Media item ID.
   * @returns {string} - Constructed URL for the videos endpoint.
   */
  mediaVideos: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/videos`),

  /**
   * Get recommendations for a specific media item.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaId - Media item ID.
   * @returns {string} - Constructed URL for the recommendations endpoint.
   */
  mediaRecommend: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/recommendations`),

  /**
   * Get images (posters, backdrops) for a specific media item.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv").
   * @param {string} params.mediaId - Media item ID.
   * @returns {string} - Constructed URL for the images endpoint.
   */
  mediaImages: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/images`),

  /**
   * Search for media items by type and query.
   * @param {Object} params - Request parameters.
   * @param {string} params.mediaType - Type of media (e.g., "movie", "tv", "person").
   * @param {string} params.query - Search query string.
   * @param {number} params.page - Page number for pagination.
   * @returns {string} - Constructed URL for the search endpoint.
   */
  mediaSearch: ({ mediaType, query, page }) =>
    tmdbConfig.getUrl(`search/${mediaType}`, { query, page }),

  /**
   * Get details for a specific person.
   * @param {Object} params - Request parameters.
   * @param {string} params.personId - Person ID.
   * @returns {string} - Constructed URL for the person detail endpoint.
   */
  personDetail: ({ personId }) =>
    tmdbConfig.getUrl(`person/${personId}`),

  /**
   * Get combined credits (media appearances) for a specific person.
   * @param {Object} params - Request parameters.
   * @param {string} params.personId - Person ID.
   * @returns {string} - Constructed URL for the person's combined credits endpoint.
   */
  personMedias: ({ personId }) =>
    tmdbConfig.getUrl(`person/${personId}/combined_credits`),

  /**
   * Get movie certifications.
   * @returns {string} - Constructed URL for the movie certifications endpoint.
   */
  movieCertifications: () =>
    tmdbConfig.getUrl("certification/movie/list"),
};

export default tmdbEndpoints;
