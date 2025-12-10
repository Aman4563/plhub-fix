/**
 * Media API Module
 * Handles media-related operations including watch providers
 */

import privateClient from "../client/private.client";
import publicClient from "../client/public.client";
import queryString from "query-string";

const mediaEndpoints = {
  list: ({ mediaType, mediaCategory, page }) =>
    `${mediaType}/${mediaCategory}?page=${page}`,
  detail: ({ mediaType, mediaId }) => `${mediaType}/detail/${mediaId}`,
  search: ({ mediaType, query, page }) =>
    `${mediaType}/search?query=${query}&page=${page}`,
  filter: (mediaType) => `filter/${mediaType}`,
  genres: ({ mediaType }) => `${mediaType}/genres`,
  discover: ({ mediaType, page, genre, year, minRating, maxRating, sortBy }) => {
    const params = new URLSearchParams();
    if (page) params.append("page", page);
    if (genre) params.append("genre", genre);
    if (year) params.append("year", year);
    if (minRating) params.append("minRating", minRating);
    if (maxRating) params.append("maxRating", maxRating);
    if (sortBy) params.append("sortBy", sortBy);
    return `${mediaType}/discover?${params.toString()}`;
  },
  certifications: () => `certifications/movie`,
  tvCertifications: () => `certifications/tv`,
  watchProviders: ({ mediaType, mediaId, region }) =>
    `${mediaType}/detail/${mediaId}/watch-providers${region ? `?region=${region}` : ""}`,
  watchProvidersList: (mediaType) => `watch-providers/${mediaType}`,
  trending: ({ mediaType, timeWindow }) =>
    `${mediaType}/trending?timeWindow=${timeWindow}`,
  seasonDetail: ({ tvId, seasonNumber }) =>
    `tv/detail/${tvId}/season/${seasonNumber}`,
  multiSearch: ({ query, page }) =>
    `movie/multi-search?query=${query}&page=${page}`,
  personCredits: (personId) => `person/${personId}/credits`,
  personSearch: ({ query, page }) =>
    `person/search?query=${query}&page=${page}`,
};

const mediaApi = {
  /**
   * Fetches a paginated list of media items
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
   * Fetches details of a specific media item
   * Includes watch providers, user status (favorite, watchlist, rating)
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
   * Searches for media items based on a query
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
   * Multi-search (movies, TV, people)
   */
  multiSearch: async ({ query, page = 1 }) => {
    try {
      const response = await publicClient.get(
        mediaEndpoints.multiSearch({ query, page })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Filters media items based on various criteria including keywords and vote count
   */
  filterMedia: async ({ mediaType, params }) => {
    const formattedParams = {
      with_genres: params.genre,
      with_original_language: params.language,
      sort_by: params.sortBy || "popularity.desc",
      certification: params.certification,
      certification_country: params.certification_country || "US",
      "vote_average.gte": params.score,
      "vote_average.lte": params.maxScore,
      "vote_count.gte": params.voteCountMin,
      page: params.page,
      with_watch_providers: params.watchProviders,
      watch_region: params.watchRegion || "US",
      with_runtime_gte: params.minRuntime,
      with_runtime_lte: params.maxRuntime,
      with_keywords: params.keywords,
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
      const response = await publicClient.get(mediaEndpoints.filter(mediaType), {
        params: formattedParams,
        paramsSerializer: (params) => queryString.stringify(params),
      });
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches genres for a specific media type
   */
  getGenres: async ({ mediaType }) => {
    try {
      const response = await publicClient.get(mediaEndpoints.genres({ mediaType }));
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Discovers media with advanced filters
   */
  discover: async ({ mediaType, page, genre, year, minRating, maxRating, sortBy }) => {
    try {
      const response = await publicClient.get(
        mediaEndpoints.discover({ mediaType, page, genre, year, minRating, maxRating, sortBy })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches certifications for movies
   */
  getCertifications: async () => {
    try {
      const response = await publicClient.get(mediaEndpoints.certifications());
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches certifications for TV shows
   */
  getTvCertifications: async () => {
    try {
      const response = await publicClient.get(mediaEndpoints.tvCertifications());
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches watch providers for a specific media item
   */
  getWatchProviders: async ({ mediaType, mediaId, region = "US" }) => {
    try {
      const response = await publicClient.get(
        mediaEndpoints.watchProviders({ mediaType, mediaId, region })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches available watch providers for filtering
   */
  getWatchProvidersList: async (mediaType) => {
    try {
      const response = await publicClient.get(
        mediaEndpoints.watchProvidersList(mediaType)
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches trending media
   */
  getTrending: async ({ mediaType, timeWindow = "week" }) => {
    try {
      const response = await publicClient.get(
        mediaEndpoints.trending({ mediaType, timeWindow })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches TV show season details
   */
  getSeasonDetail: async ({ tvId, seasonNumber }) => {
    try {
      const response = await publicClient.get(
        mediaEndpoints.seasonDetail({ tvId, seasonNumber })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Fetches credits for a person (for search by cast/crew)
   */
  getPersonCredits: async (personId) => {
    try {
      const response = await publicClient.get(
        mediaEndpoints.personCredits(personId)
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },

  /**
   * Searches for people (actors, directors, etc.)
   */
  searchPerson: async ({ query, page = 1 }) => {
    try {
      const response = await publicClient.get(
        mediaEndpoints.personSearch({ query, page })
      );
      return { response };
    } catch (err) {
      return { err };
    }
  },
};

export default mediaApi;
