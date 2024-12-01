// Import required modules and dependencies
import responseHandler from "../handlers/response.handler.js";
import tmdbApi from "../tmdb/tmdb.api.js";
import userModel from "../models/user.model.js";
import favoriteModel from "../models/favorite.model.js";
import reviewModel from "../models/review.model.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

/**
 * Get a list of media items by type and category.
 *
 * @param {Object} req - Express request object containing query parameters and route params.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/:mediaType/:mediaCategory
 * @access Public
 */
const getList = async (req, res) => {
  try {
    const { page } = req.query;
    const { mediaType, mediaCategory } = req.params;

    const response = await tmdbApi.mediaList({ mediaType, mediaCategory, page });

    return responseHandler.ok(res, response);
  } catch (error) {
    console.error("Error fetching media list:", error.message);
    return responseHandler.error(res);
  }
};

/**
 * Get genres for a specific media type.
 *
 * @param {Object} req - Express request object containing route params.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/:mediaType/genres
 * @access Public
 */
const getGenres = async (req, res) => {
  try {
    const { mediaType } = req.params;

    const response = await tmdbApi.mediaGenres({ mediaType });

    return responseHandler.ok(res, response);
  } catch (error) {
    console.error("Error fetching genres:", error.message);
    return responseHandler.error(res);
  }
};

/**
 * Search for media items based on a query.
 *
 * @param {Object} req - Express request object containing query parameters and route params.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/:mediaType/search
 * @access Public
 */
const search = async (req, res) => {
  try {
    const { mediaType } = req.params;
    const { query, page } = req.query;

    const adjustedMediaType = mediaType === "people" ? "person" : mediaType;

    const response = await tmdbApi.mediaSearch({ query, page, mediaType: adjustedMediaType });

    return responseHandler.ok(res, response);
  } catch (error) {
    console.error("Error performing media search:", error.message);
    return responseHandler.error(res);
  }
};

/**
 * Get detailed information about a specific media item.
 *
 * @param {Object} req - Express request object containing route params.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/:mediaType/:mediaId
 * @access Public
 */
const getDetail = async (req, res) => {
  try {
    const { mediaType, mediaId } = req.params;

    const params = { mediaType, mediaId };

    // Fetch core media details and related data concurrently
    const [media, credits, videos, recommend, images] = await Promise.all([
      tmdbApi.mediaDetail(params),
      tmdbApi.mediaCredits(params),
      tmdbApi.mediaVideos(params),
      tmdbApi.mediaRecommend(params),
      tmdbApi.mediaImages(params),
    ]);

    media.credits = credits;
    media.videos = videos;
    media.recommend = recommend.results;
    media.images = images;

    // Check if the user has marked this media as a favorite
    const tokenDecoded = tokenMiddleware.tokenDecode(req);
    if (tokenDecoded) {
      const user = await userModel.findById(tokenDecoded.data);
      if (user) {
        const isFavorite = await favoriteModel.exists({ user: user.id, mediaId });
        media.isFavorite = Boolean(isFavorite); // Set favorite status
      }
    }

    // Fetch reviews associated with the media
    media.reviews = await reviewModel.find({ mediaId }).populate("user").sort("-createdAt");

    return responseHandler.ok(res, media);
  } catch (error) {
    console.error("Error fetching media details:", error.message);
    return responseHandler.error(res);
  }
};

// Export the controller functions
export default { getList, getGenres, search, getDetail };
