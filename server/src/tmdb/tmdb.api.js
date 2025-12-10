/**
 * TMDB API Wrapper
 * Provides methods for interacting with TMDB endpoints
 * Including watch providers for "Where to Watch" feature
 */

import axiosClient from "../axios/axios.client.js";
import tmdbEndpoints from "./tmdb.endpoints.js";

const tmdbApi = {
  /**
   * Fetch a list of media based on type and filters (for discover/filtering)
   */
  mediaList: async ({ mediaType, filters }) => {
    return axiosClient.get(tmdbEndpoints.mediaList({ mediaType, filters }));
  },

  /**
   * Fetch a list of media by category (popular, top_rated, now_playing, upcoming)
   */
  mediaCategoryList: async ({ mediaType, mediaCategory, page = 1 }) => {
    return axiosClient.get(tmdbEndpoints.mediaCategoryList({ mediaType, mediaCategory, page }));
  },

  /**
   * Fetch details of a specific media item
   */
  mediaDetail: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaDetail({ mediaType, mediaId }));
  },

  /**
   * Fetch genres for a specific media type
   */
  mediaGenres: async ({ mediaType }) => {
    return axiosClient.get(tmdbEndpoints.mediaGenres({ mediaType }));
  },

  /**
   * Fetch credits (cast and crew) for a specific media item
   */
  mediaCredits: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaCredits({ mediaType, mediaId }));
  },

  /**
   * Fetch videos (trailers, teasers) for a specific media item
   */
  mediaVideos: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaVideos({ mediaType, mediaId }));
  },

  /**
   * Fetch images (posters, backdrops) for a specific media item
   */
  mediaImages: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaImages({ mediaType, mediaId }));
  },

  /**
   * Fetch recommendations for a specific media item
   */
  mediaRecommend: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaRecommend({ mediaType, mediaId }));
  },

  /**
   * Search for media items
   */
  mediaSearch: async ({ mediaType, query, page }) => {
    return axiosClient.get(tmdbEndpoints.mediaSearch({ mediaType, query, page }));
  },

  /**
   * Fetch details of a specific person
   */
  personDetail: async ({ personId }) => {
    return axiosClient.get(tmdbEndpoints.personDetail({ personId }));
  },

  /**
   * Fetch media items associated with a specific person
   */
  personMedias: async ({ personId }) => {
    return axiosClient.get(tmdbEndpoints.personMedias({ personId }));
  },

  /**
   * Fetch movie certifications
   */
  getMovieCertifications: async () => {
    return axiosClient.get(tmdbEndpoints.movieCertifications());
  },

  /**
   * Fetch TV certifications
   */
  getTvCertifications: async () => {
    return axiosClient.get(tmdbEndpoints.tvCertifications());
  },

  /**
   * Fetch watch providers for a specific media item
   * Shows where to stream, rent, or buy
   */
  mediaWatchProviders: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaWatchProviders({ mediaType, mediaId }));
  },

  /**
   * Fetch available watch providers by region
   */
  watchProvidersList: async ({ mediaType }) => {
    return axiosClient.get(tmdbEndpoints.watchProvidersList({ mediaType }));
  },

  /**
   * Fetch trending media
   */
  trending: async ({ mediaType, timeWindow = "week" }) => {
    return axiosClient.get(tmdbEndpoints.trending({ mediaType, timeWindow }));
  },

  /**
   * Fetch similar media
   */
  mediaSimilar: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaSimilar({ mediaType, mediaId }));
  },

  /**
   * Fetch external IDs (IMDB, etc.)
   */
  mediaExternalIds: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaExternalIds({ mediaType, mediaId }));
  },

  /**
   * Fetch TV show season details
   */
  tvSeasonDetail: async ({ tvId, seasonNumber }) => {
    return axiosClient.get(tmdbEndpoints.tvSeasonDetail({ tvId, seasonNumber }));
  },

  /**
   * Fetch TV show episode details
   */
  tvEpisodeDetail: async ({ tvId, seasonNumber, episodeNumber }) => {
    return axiosClient.get(tmdbEndpoints.tvEpisodeDetail({ tvId, seasonNumber, episodeNumber }));
  },

  /**
   * Multi-search (movies, TV, people)
   */
  multiSearch: async ({ query, page }) => {
    return axiosClient.get(tmdbEndpoints.multiSearch({ query, page }));
  },

  /**
   * Fetch keywords for a media item
   */
  mediaKeywords: async ({ mediaType, mediaId }) => {
    return axiosClient.get(tmdbEndpoints.mediaKeywords({ mediaType, mediaId }));
  },

  /**
   * Fetch combined credits for a person
   */
  personCredits: async ({ personId }) => {
    return axiosClient.get(tmdbEndpoints.personCredits({ personId }));
  },

  /**
   * Search for people
   */
  personSearch: async ({ query, page = 1 }) => {
    return axiosClient.get(tmdbEndpoints.personSearch({ query, page }));
  },
};

export default tmdbApi;
