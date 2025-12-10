/**
 * TMDB Endpoints
 * Provides URL constructors for various TMDB API endpoints
 * Including watch providers for "Where to Watch" feature
 */

import tmdbConfig from "./tmdb.config.js";

const tmdbEndpoints = {
  /**
   * Get a media list based on type and filters (for discover/filtering)
   */
  mediaList: ({ mediaType, filters }) =>
    tmdbConfig.getUrl(`discover/${mediaType}`, filters),

  /**
   * Get a media list by category (popular, top_rated, now_playing, upcoming)
   */
  mediaCategoryList: ({ mediaType, mediaCategory, page = 1 }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaCategory}`, { page }),

  /**
   * Get details for a specific media item
   */
  mediaDetail: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}`),

  /**
   * Get genres for a specific media type
   */
  mediaGenres: ({ mediaType }) =>
    tmdbConfig.getUrl(`genre/${mediaType}/list`),

  /**
   * Get credits (cast and crew) for a specific media item
   */
  mediaCredits: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/credits`),

  /**
   * Get videos (trailers, teasers) for a specific media item
   */
  mediaVideos: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/videos`),

  /**
   * Get recommendations for a specific media item
   */
  mediaRecommend: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/recommendations`),

  /**
   * Get images (posters, backdrops) for a specific media item
   */
  mediaImages: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/images`),

  /**
   * Search for media items by type and query
   */
  mediaSearch: ({ mediaType, query, page }) =>
    tmdbConfig.getUrl(`search/${mediaType}`, { query, page }),

  /**
   * Get details for a specific person
   */
  personDetail: ({ personId }) =>
    tmdbConfig.getUrl(`person/${personId}`),

  /**
   * Get combined credits (media appearances) for a specific person
   */
  personMedias: ({ personId }) =>
    tmdbConfig.getUrl(`person/${personId}/combined_credits`),

  /**
   * Get movie certifications
   */
  movieCertifications: () =>
    tmdbConfig.getUrl("certification/movie/list"),

  /**
   * Get TV certifications
   */
  tvCertifications: () =>
    tmdbConfig.getUrl("certification/tv/list"),

  /**
   * Get watch providers for a specific media item
   * Shows where to stream, rent, or buy
   */
  mediaWatchProviders: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/watch/providers`),

  /**
   * Get available watch providers by region
   */
  watchProvidersList: ({ mediaType }) =>
    tmdbConfig.getUrl(`watch/providers/${mediaType}`),

  /**
   * Get trending media
   */
  trending: ({ mediaType, timeWindow = "week" }) =>
    tmdbConfig.getUrl(`trending/${mediaType}/${timeWindow}`),

  /**
   * Get similar media
   */
  mediaSimilar: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/similar`),

  /**
   * Get external IDs (IMDB, etc.)
   */
  mediaExternalIds: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/external_ids`),

  /**
   * Get TV show seasons
   */
  tvSeasonDetail: ({ tvId, seasonNumber }) =>
    tmdbConfig.getUrl(`tv/${tvId}/season/${seasonNumber}`),

  /**
   * Get TV show episode details
   */
  tvEpisodeDetail: ({ tvId, seasonNumber, episodeNumber }) =>
    tmdbConfig.getUrl(`tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`),

  /**
   * Multi-search (movies, TV, people)
   */
  multiSearch: ({ query, page }) =>
    tmdbConfig.getUrl("search/multi", { query, page }),

  /**
   * Get keywords for a media item
   */
  mediaKeywords: ({ mediaType, mediaId }) =>
    tmdbConfig.getUrl(`${mediaType}/${mediaId}/keywords`),

  /**
   * Discover by keyword
   */
  discoverByKeyword: ({ mediaType, keywordId, page }) =>
    tmdbConfig.getUrl(`discover/${mediaType}`, { with_keywords: keywordId, page }),

  /**
   * Get combined credits for a person
   */
  personCredits: ({ personId }) =>
    tmdbConfig.getUrl(`person/${personId}/combined_credits`),

  /**
   * Search for people
   */
  personSearch: ({ query, page = 1 }) =>
    tmdbConfig.getUrl("search/person", { query, page }),
};

export default tmdbEndpoints;
