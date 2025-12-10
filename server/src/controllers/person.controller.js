// Import required modules
import responseHandler from "../handlers/response.handler.js"; // Custom response handler
import tmdbApi from "../tmdb/tmdb.api.js"; // TMDB API wrapper for interacting with TMDB services

/**
 * Fetch detailed information about a person from TMDB.
 *
 * @param {Object} req - Express request object containing route parameters.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/person/:personId
 * @access Public
 */
const personDetail = async (req, res) => {
  const { personId } = req.params; // Extract personId from route parameters

  try {
    // Fetch person details using TMDB API
    const person = await tmdbApi.personDetail({ personId });

    // Return successful response
    return responseHandler.ok(res, person);
  } catch (error) {
    console.error(`Error fetching details for person ID ${personId}:`, error);
    return responseHandler.error(res); // Handle unexpected errors
  }
};

/**
 * Fetch media associated with a specific person from TMDB.
 *
 * @param {Object} req - Express request object containing route parameters.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/person/:personId/medias
 * @access Public
 */
const personMedias = async (req, res) => {
  const { personId } = req.params; // Extract personId from route parameters

  try {
    // Fetch person's media using TMDB API
    const medias = await tmdbApi.personMedias({ personId });

    // Return successful response
    return responseHandler.ok(res, medias);
  } catch (error) {
    console.error(`Error fetching media for person ID ${personId}:`, error);
    return responseHandler.error(res); // Handle unexpected errors
  }
};

/**
 * Fetch combined credits (cast + crew) for a person
 *
 * @param {Object} req - Express request object containing route parameters.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/person/:personId/credits
 * @access Public
 */
const personCredits = async (req, res) => {
  const { personId } = req.params;

  try {
    const credits = await tmdbApi.personCredits({ personId });

    const sortedCast = (credits.cast || [])
      .filter(item => item.poster_path)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 50);

    const sortedCrew = (credits.crew || [])
      .filter(item => item.poster_path)
      .sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
      .slice(0, 30);

    return responseHandler.ok(res, {
      cast: sortedCast,
      crew: sortedCrew,
    });
  } catch (error) {
    console.error(`Error fetching credits for person ID ${personId}:`, error);
    return responseHandler.error(res);
  }
};

/**
 * Search for people (actors, directors, etc.)
 *
 * @param {Object} req - Express request object containing query parameters.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/person/search
 * @access Public
 */
const searchPerson = async (req, res) => {
  const { query, page = 1 } = req.query;

  if (!query) {
    return responseHandler.badrequest(res, "Search query is required");
  }

  try {
    const response = await tmdbApi.personSearch({ query, page });
    return responseHandler.ok(res, response);
  } catch (error) {
    console.error(`Error searching for person "${query}":`, error);
    return responseHandler.error(res);
  }
};

// Export the controller functions for use in routes
export default { personDetail, personMedias, personCredits, searchPerson };
