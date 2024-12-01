// Import required modules and dependencies
import tmdbApi from "../tmdb/tmdb.api.js"; // TMDB API wrapper for media-related operations
import responseHandler from "../handlers/response.handler.js"; // Custom response handler

/**
 * Filter media based on query parameters and media type.
 *
 * @param {Object} req - Express request object containing route parameters and query parameters.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/:mediaType/filter
 * @access Public
 */
const filterMedia = async (req, res) => {
  try {
    const { mediaType } = req.params;
    const cleanedFilters = req.query;
    console.log("Applied Filters:", cleanedFilters);
    
    // Fetch the filtered media list from TMDB API
    const mediaList = await tmdbApi.mediaList({ mediaType, filters: cleanedFilters });

    // Return the filtered media list in the response
    responseHandler.ok(res, mediaList);
  } catch (error) {
    console.error("Error in filterMedia function:", error);
    responseHandler.error(res, "Failed to fetch filtered media. Please try again.");
  }
};

export default { filterMedia };
