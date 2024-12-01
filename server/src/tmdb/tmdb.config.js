// Import necessary environment variables
const baseUrl = process.env.TMDB_BASE_URL;
const apiKey = process.env.TMDB_KEY;

/**
 * Generate a full TMDB API URL with the provided endpoint and query parameters.
 *
 * @param {string} endpoint - The TMDB API endpoint (e.g., "/movie/popular").
 * @param {Object} params - Query parameters as key-value pairs.
 * @returns {string} - The fully constructed URL with the base URL, API key, and query parameters.
 */
const getUrl = (endpoint, params = {}) => {
  // Ensure params is an object and add the API key to the query parameters
  const queryParams = new URLSearchParams({ api_key: apiKey, ...params });

  // Construct and return the full URL
  return `${baseUrl}${endpoint}?${queryParams.toString()}`;
};

export default { getUrl };
