import tmdbApi from "../tmdb/tmdb.api.js";
import responseHandler from "../handlers/response.handler.js";

/**
 * Get Movie Certifications
 * Fetches movie certifications from the TMDB API.
 */
const getMovieCertifications = async (req, res) => {
  try {
    const certifications = await tmdbApi.getMovieCertifications();

    if (!certifications || Object.keys(certifications).length === 0) {
      return responseHandler.notfound(res, "No movie certifications found.");
    }

    responseHandler.ok(res, certifications);
  } catch (error) {
    console.error("Error fetching movie certifications:", error.message);
    responseHandler.error(res, "Failed to fetch movie certifications. Please try again.");
  }
};

/**
 * Get TV Certifications
 * Fetches TV certifications from the TMDB API.
 */
const getTvCertifications = async (req, res) => {
  try {
    const certifications = await tmdbApi.getTvCertifications();

    if (!certifications || Object.keys(certifications).length === 0) {
      return responseHandler.notfound(res, "No TV certifications found.");
    }

    responseHandler.ok(res, certifications);
  } catch (error) {
    console.error("Error fetching TV certifications:", error.message);
    responseHandler.error(res, "Failed to fetch TV certifications. Please try again.");
  }
};

export default { getMovieCertifications, getTvCertifications };
