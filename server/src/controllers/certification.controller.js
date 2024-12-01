// Import required modules and dependencies
import tmdbApi from "../tmdb/tmdb.api.js"; // TMDB API wrapper for certification-related operations
import responseHandler from "../handlers/response.handler.js"; // Custom response handler for consistent responses

/**
 * Get Movie Certifications
 * Fetches movie certifications from the TMDB API.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/certifications/movie
 * @access Public
 */
const getMovieCertifications = async (req, res) => {
  try {
    // Fetch movie certifications from TMDB API
    const certifications = await tmdbApi.getMovieCertifications();

    // Ensure the response is valid before sending it
    if (!certifications || Object.keys(certifications).length === 0) {
      return responseHandler.notfound(res, "No movie certifications found.");
    }

    // Respond with the retrieved certifications
    responseHandler.ok(res, certifications);
  } catch (error) {
    console.error("Error fetching movie certifications:", error.message); // Log detailed error for debugging
    responseHandler.error(res, "Failed to fetch movie certifications. Please try again.");
  }
};

// Export the controller function for use in routes
export default { getMovieCertifications };
