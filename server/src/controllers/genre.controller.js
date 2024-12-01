// Import required modules and dependencies
import tmdbApi from "../tmdb/tmdb.api.js"; // TMDB API wrapper for interacting with TMDB services
import responseHandler from "../handlers/response.handler.js"; // Custom response handler

// In-memory cache for storing fetched genres temporarily
const cache = new Map(); 

// Define valid media types
const validMediaTypes = ["movie", "tv"];

/**
 * Get genres for a specific media type.
 *
 * @param {Object} req - Express request object containing route parameters.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/:mediaType/genres
 * @access Public
 */
const getGenres = async (req, res) => {
  try {
    const { mediaType } = req.params;

    // Validate media type
    if (!validMediaTypes.includes(mediaType)) {
      return responseHandler.badrequest(res, "Invalid media type. Supported types are 'movie' or 'tv'.");
    }

    // Check if genres for this media type are already cached
    if (cache.has(mediaType)) {
      console.log(`Serving genres for '${mediaType}' from cache.`);
      return responseHandler.ok(res, cache.get(mediaType)); // Return cached genres
    }

    // Fetch genres from TMDB API
    const genres = await tmdbApi.mediaGenres({ mediaType });

    // Cache the fetched genres for future requests
    cache.set(mediaType, genres);

    // Return genres in the response
    responseHandler.ok(res, genres);
  } catch (error) {
    console.error("Error fetching genres:", error.message);

    // Provide a meaningful error response
    responseHandler.error(res, "Failed to fetch genres. Please try again later.");
  }
};

export default { getGenres };
