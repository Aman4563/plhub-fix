import tmdbApi from "../tmdb/tmdb.api.js";
import responseHandler from "../handlers/response.handler.js";
import logger from "../config/logger.config.js";

// In-memory cache for certifications (they rarely change)
const cache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get cached data or null if expired/not found
 */
const getCachedData = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Remove expired entry
  }
  return null;
};

/**
 * Set cache data with timestamp
 */
const setCacheData = (key, data) => {
  cache.set(key, { data, timestamp: Date.now() });
};

/**
 * Get Movie Certifications
 * Fetches movie certifications from the TMDB API.
 */
const getMovieCertifications = async (req, res) => {
  try {
    const cacheKey = "movie_certifications";
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      logger.info("Serving movie certifications from cache");
      return responseHandler.ok(res, cachedData);
    }

    const certifications = await tmdbApi.getMovieCertifications();

    if (!certifications || Object.keys(certifications).length === 0) {
      return responseHandler.notfound(res, "No movie certifications found.");
    }

    // Cache the result
    setCacheData(cacheKey, certifications);
    logger.info("Movie certifications fetched and cached");

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
    const cacheKey = "tv_certifications";
    
    // Check cache first
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      logger.info("Serving TV certifications from cache");
      return responseHandler.ok(res, cachedData);
    }

    const certifications = await tmdbApi.getTvCertifications();

    if (!certifications || Object.keys(certifications).length === 0) {
      return responseHandler.notfound(res, "No TV certifications found.");
    }

    // Cache the result
    setCacheData(cacheKey, certifications);
    logger.info("TV certifications fetched and cached");

    responseHandler.ok(res, certifications);
  } catch (error) {
    console.error("Error fetching TV certifications:", error.message);
    responseHandler.error(res, "Failed to fetch TV certifications. Please try again.");
  }
};

export default { getMovieCertifications, getTvCertifications };
