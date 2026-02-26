/**
 * Media Controller
 * Handles media-related operations including watch providers, external IDs, and certifications
 */

import responseHandler from "../handlers/response.handler.js";
import tmdbApi from "../tmdb/tmdb.api.js";
import userModel from "../models/user.model.js";
import favoriteModel from "../models/favorite.model.js";
import reviewModel from "../models/review.model.js";
import watchlistModel from "../models/watchlist.model.js";
import tokenMiddleware from "../middlewares/token.middleware.js";
import logger from "../config/logger.config.js";

// Valid media types
const VALID_MEDIA_TYPES = ["movie", "tv"];

// Valid media categories
const VALID_MOVIE_CATEGORIES = ["popular", "top_rated", "now_playing", "upcoming"];
const VALID_TV_CATEGORIES = ["popular", "top_rated", "on_the_air", "airing_today"];

/**
 * Validate media type
 */
const validateMediaType = (mediaType) => {
  return VALID_MEDIA_TYPES.includes(mediaType);
};

/**
 * Validate media category based on type
 */
const validateMediaCategory = (mediaType, category) => {
  if (mediaType === "movie") {
    return VALID_MOVIE_CATEGORIES.includes(category);
  }
  if (mediaType === "tv") {
    return VALID_TV_CATEGORIES.includes(category);
  }
  return false;
};

/**
 * Validate media ID (should be numeric)
 */
const validateMediaId = (mediaId) => {
  return !isNaN(mediaId) && parseInt(mediaId) > 0;
};

/**
 * Extract content rating/certification from release dates or content ratings
 */
const extractCertification = (media, mediaType, region = "US") => {
  try {
    if (mediaType === "movie" && media.release_dates?.results) {
      const regionData = media.release_dates.results.find(
        (r) => r.iso_3166_1 === region
      ) || media.release_dates.results.find((r) => r.iso_3166_1 === "US");
      
      if (regionData?.release_dates?.length) {
        const certification = regionData.release_dates.find(
          (rd) => rd.certification
        )?.certification;
        return certification || null;
      }
    }
    
    if (mediaType === "tv" && media.content_ratings?.results) {
      const regionRating = media.content_ratings.results.find(
        (r) => r.iso_3166_1 === region
      ) || media.content_ratings.results.find((r) => r.iso_3166_1 === "US");
      return regionRating?.rating || null;
    }
  } catch (error) {
    logger.warn("Error extracting certification", { error: error.message });
  }
  return null;
};

/**
 * Get a list of media items by type and category
 * Uses the proper TMDB category endpoints (popular, top_rated, etc.)
 */
const getList = async (req, res) => {
  try {
    const { page = 1 } = req.query;
    const { mediaType, mediaCategory } = req.params;

    // Validate media type
    if (!validateMediaType(mediaType)) {
      return responseHandler.badrequest(
        res,
        `Invalid media type. Must be one of: ${VALID_MEDIA_TYPES.join(", ")}`
      );
    }

    // Validate media category
    if (!validateMediaCategory(mediaType, mediaCategory)) {
      const validCategories = mediaType === "movie" 
        ? VALID_MOVIE_CATEGORIES 
        : VALID_TV_CATEGORIES;
      return responseHandler.badrequest(
        res,
        `Invalid category for ${mediaType}. Must be one of: ${validCategories.join(", ")}`
      );
    }

    const response = await tmdbApi.mediaCategoryList({
      mediaType,
      mediaCategory,
      page: parseInt(page),
    });

    // Add pagination info
    return responseHandler.ok(res, {
      ...response,
      hasMore: response.page < response.total_pages,
    });
  } catch (error) {
    logger.error("Error fetching media list", {
      error: error.message,
      mediaType: req.params.mediaType,
      mediaCategory: req.params.mediaCategory,
    });
    return responseHandler.error(res, "Failed to fetch media list");
  }
};

/**
 * Get genres for a specific media type
 */
const getGenres = async (req, res) => {
  try {
    const { mediaType } = req.params;

    if (!validateMediaType(mediaType)) {
      return responseHandler.badrequest(
        res,
        `Invalid media type. Must be one of: ${VALID_MEDIA_TYPES.join(", ")}`
      );
    }

    const response = await tmdbApi.mediaGenres({ mediaType });

    return responseHandler.ok(res, response);
  } catch (error) {
    logger.error("Error fetching genres", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Search for media items based on a query
 */
const search = async (req, res) => {
  try {
    const { mediaType } = req.params;
    const { query, page = 1 } = req.query;

    if (!query || query.trim().length === 0) {
      return responseHandler.badrequest(res, "Search query is required");
    }

    const adjustedMediaType = mediaType === "people" ? "person" : mediaType;

    const response = await tmdbApi.mediaSearch({
      query: query.trim(),
      page: parseInt(page),
      mediaType: adjustedMediaType,
    });

    return responseHandler.ok(res, response);
  } catch (error) {
    logger.error("Error performing media search", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Get detailed information about a specific media item
 * Includes watch providers, user's favorite/watchlist status, external IDs, and certification
 */
const getDetail = async (req, res) => {
  try {
    const { mediaType, mediaId } = req.params;

    // Validate media type
    if (!validateMediaType(mediaType)) {
      return responseHandler.badrequest(
        res,
        `Invalid media type. Must be one of: ${VALID_MEDIA_TYPES.join(", ")}`
      );
    }

    // Validate media ID
    if (!validateMediaId(mediaId)) {
      return responseHandler.badrequest(res, "Invalid media ID. Must be a positive number");
    }

    const params = { mediaType, mediaId };

    // Fetch core media details and related data concurrently
    const [
      media,
      credits,
      videos,
      recommend,
      images,
      watchProviders,
      similar,
      externalIds,
      releaseDates,
      keywords,
    ] = await Promise.all([
      tmdbApi.mediaDetail(params),
      tmdbApi.mediaCredits(params),
      tmdbApi.mediaVideos(params),
      tmdbApi.mediaRecommend(params),
      tmdbApi.mediaImages(params),
      tmdbApi.mediaWatchProviders(params).catch(() => ({ results: {} })),
      tmdbApi.mediaSimilar(params).catch(() => ({ results: [] })),
      tmdbApi.mediaExternalIds(params).catch(() => ({})),
      // For movies, get release dates (includes certifications)
      // For TV, get content ratings
      mediaType === "movie"
        ? tmdbApi.mediaDetail({ ...params, append: "release_dates" }).catch(() => ({}))
        : tmdbApi.mediaDetail({ ...params, append: "content_ratings" }).catch(() => ({})),
      // Fetch keywords for SEO and related content
      tmdbApi.mediaKeywords(params).catch(() => ({ keywords: [], results: [] })),
    ]);

    // Attach all data to media object
    media.credits = credits;
    media.videos = videos;
    media.recommend = recommend.results;
    media.images = images;
    media.watchProviders = watchProviders.results;
    media.similar = similar.results?.slice(0, 12) || [];
    media.external_ids = externalIds;

    // Extract certification
    media.certification = extractCertification(
      releaseDates,
      mediaType,
      "US"
    );

    // Add keywords (movies use 'keywords', TV uses 'results')
    media.keywords = keywords.keywords || keywords.results || [];

    // Sort videos - trailers first, then teasers, then others
    if (media.videos?.results) {
      const videoOrder = { Trailer: 1, Teaser: 2, Clip: 3, Featurette: 4 };
      media.videos.results.sort((a, b) => {
        const orderA = videoOrder[a.type] || 5;
        const orderB = videoOrder[b.type] || 5;
        return orderA - orderB;
      });
    }

    // Check user-specific data if authenticated
    const tokenDecoded = tokenMiddleware.tokenDecode(req);
    if (tokenDecoded) {
      const user = await userModel.findById(tokenDecoded.data);
      if (user) {
        // Run user-specific queries in parallel
        const [isFavorite, watchlistItem, userReview] = await Promise.all([
          favoriteModel.exists({ user: user.id, mediaId }),
          watchlistModel.findOne({ user: user.id, mediaId }),
          reviewModel.findOne({ user: user.id, mediaId }),
        ]);

        media.isFavorite = Boolean(isFavorite);
        media.inWatchlist = Boolean(watchlistItem);
        media.watchlistStatus = watchlistItem?.status || null;
        media.watchlistId = watchlistItem?._id?.toString() || null;
        media.userRating = userReview?.rating || null;
        media.userReviewId = userReview?._id?.toString() || null;
      }
    }

    // Fetch reviews with ratings
    const reviews = await reviewModel
      .find({ mediaId, status: "approved" })
      .populate("user", "displayName username")
      .sort("-createdAt")
      .limit(10)
      .lean();

    // Transform reviews to include id field and spoiler info
    media.reviews = reviews.map((review) => ({
      ...review,
      id: review._id.toString(),
    }));

    // Calculate average user rating
    const ratingStats = await reviewModel.aggregate([
      { $match: { mediaId: mediaId.toString(), rating: { $ne: null } } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalRatings: { $sum: 1 },
        },
      },
    ]);

    media.userRatingStats = ratingStats[0] || {
      averageRating: null,
      totalRatings: 0,
    };

    return responseHandler.ok(res, media);
  } catch (error) {
    logger.error("Error fetching media details", {
      error: error.message,
      mediaType: req.params.mediaType,
      mediaId: req.params.mediaId,
    });
    return responseHandler.error(res, "Failed to fetch media details");
  }
};

/**
 * Get watch providers for a specific media item
 */
const getWatchProviders = async (req, res) => {
  try {
    const { mediaType, mediaId } = req.params;
    const { region = "US" } = req.query;

    // Validate media type
    if (!validateMediaType(mediaType)) {
      return responseHandler.badrequest(
        res,
        `Invalid media type. Must be one of: ${VALID_MEDIA_TYPES.join(", ")}`
      );
    }

    // Validate media ID
    if (!validateMediaId(mediaId)) {
      return responseHandler.badrequest(res, "Invalid media ID");
    }

    const response = await tmdbApi.mediaWatchProviders({ mediaType, mediaId });

    // Return providers for specific region if available
    const providers =
      response.results?.[region] || response.results?.US || null;

    return responseHandler.ok(res, {
      providers,
      allRegions: Object.keys(response.results || {}),
      selectedRegion: region,
    });
  } catch (error) {
    logger.error("Error fetching watch providers", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Get trending media
 */
const getTrending = async (req, res) => {
  try {
    const { mediaType } = req.params;
    const { timeWindow = "week" } = req.query;

    // Validate time window
    if (!["day", "week"].includes(timeWindow)) {
      return responseHandler.badrequest(
        res,
        "Invalid time window. Must be 'day' or 'week'"
      );
    }

    const response = await tmdbApi.trending({ mediaType, timeWindow });

    return responseHandler.ok(res, response);
  } catch (error) {
    logger.error("Error fetching trending media", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Get TV show season details
 */
const getSeasonDetail = async (req, res) => {
  try {
    const { tvId, seasonNumber } = req.params;

    // Validate TV ID
    if (!validateMediaId(tvId)) {
      return responseHandler.badrequest(res, "Invalid TV show ID");
    }

    // Validate season number
    const season = parseInt(seasonNumber);
    if (isNaN(season) || season < 0) {
      return responseHandler.badrequest(res, "Invalid season number");
    }

    const response = await tmdbApi.tvSeasonDetail({
      tvId,
      seasonNumber: season,
    });

    return responseHandler.ok(res, response);
  } catch (error) {
    logger.error("Error fetching season details", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Multi-search endpoint
 */
const multiSearch = async (req, res) => {
  try {
    const { query, page = 1 } = req.query;

    if (!query || query.trim().length === 0) {
      return responseHandler.badrequest(res, "Search query is required");
    }

    const response = await tmdbApi.multiSearch({
      query: query.trim(),
      page: parseInt(page),
    });

    return responseHandler.ok(res, response);
  } catch (error) {
    logger.error("Error performing multi-search", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Get available categories for a media type
 */
const getCategories = async (req, res) => {
  try {
    const { mediaType } = req.params;

    if (!validateMediaType(mediaType)) {
      return responseHandler.badrequest(
        res,
        `Invalid media type. Must be one of: ${VALID_MEDIA_TYPES.join(", ")}`
      );
    }

    const categories =
      mediaType === "movie"
        ? [
            { value: "popular", label: "Popular" },
            { value: "top_rated", label: "Top Rated" },
            { value: "now_playing", label: "Now Playing" },
            { value: "upcoming", label: "Upcoming" },
          ]
        : [
            { value: "popular", label: "Popular" },
            { value: "top_rated", label: "Top Rated" },
            { value: "on_the_air", label: "On The Air" },
            { value: "airing_today", label: "Airing Today" },
          ];

    return responseHandler.ok(res, { categories });
  } catch (error) {
    logger.error("Error fetching categories", { error: error.message });
    return responseHandler.error(res);
  }
};

/**
 * Discover media with advanced filters
 * Supports genre, year, rating, and more
 */
const discover = async (req, res) => {
  try {
    const { mediaType } = req.params;
    const {
      page = 1,
      genre,
      year,
      minRating,
      maxRating,
      sortBy = "popularity.desc",
    } = req.query;

    if (!validateMediaType(mediaType)) {
      return responseHandler.badrequest(
        res,
        `Invalid media type. Must be one of: ${VALID_MEDIA_TYPES.join(", ")}`
      );
    }

    // Build filter params for TMDB discover API
    const filters = {
      page: parseInt(page),
      sort_by: sortBy,
    };

    // Genre filter
    if (genre) {
      filters.with_genres = genre;
    }

    // Year filter
    if (year) {
      if (mediaType === "movie") {
        filters.primary_release_year = parseInt(year);
      } else {
        filters.first_air_date_year = parseInt(year);
      }
    }

    // Rating filter
    if (minRating) {
      filters["vote_average.gte"] = parseFloat(minRating);
    }
    if (maxRating) {
      filters["vote_average.lte"] = parseFloat(maxRating);
    }

    // Ensure we get items with votes for rating filter
    if (minRating || maxRating) {
      filters["vote_count.gte"] = 50;
    }

    const response = await tmdbApi.mediaList({ mediaType, filters });

    return responseHandler.ok(res, {
      ...response,
      hasMore: response.page < response.total_pages,
      filters: { genre, year, minRating, maxRating, sortBy },
    });
  } catch (error) {
    logger.error("Error discovering media", { error: error.message });
    return responseHandler.error(res, "Failed to discover media");
  }
};

export default {
  getList,
  getGenres,
  search,
  getDetail,
  getWatchProviders,
  getTrending,
  getSeasonDetail,
  multiSearch,
  getCategories,
  discover,
};
