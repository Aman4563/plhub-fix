import axios from "axios";
import queryString from "query-string";

/**
 * Base URL for API requests.
 * This should be updated based on the environment (e.g., development, staging, production).
 */
// const baseURL = "https://plhub-fix-api-git-advancefeature-9703ab-amans-projects-62ecaac6.vercel.app/api/v1/";
const baseURL = "http://localhost:5000/api/v1/";

/**
 * Create an Axios instance for public API client.
 * Configures the base URL and a custom parameter serializer using query-string.
 */
const publicClient = axios.create({
  baseURL,
  paramsSerializer: {
    /**
     * Custom parameter serializer to encode parameters into query strings.
     * Uses queryString to ensure consistent formatting.
     * 
     * @param {object} params - The query parameters to serialize.
     * @returns {string} - The serialized query string.
     */
    encode: (params) => queryString.stringify(params),
  },
  withCredentials: true
});

/**
 * Interceptor for request configuration.
 * Adds custom headers such as `Captcha-Token` if available in local storage.
 */
publicClient.interceptors.request.use(async (config) => {
  // Retrieve the reCAPTCHA token from local storage (if available).
  const captchaToken = localStorage.getItem("captchaToken");

  // Define headers with default Content-Type.
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };


  // Include the reCAPTCHA token if present.
  if (captchaToken) {
    headers["Captcha-Token"] = captchaToken;
  }

  // Return the updated configuration object with custom headers.
  return {
    ...config,
    headers,
  };
});

/**
 * Interceptor for response handling.
 * Processes and returns the response data if available or throws an error.
 */
publicClient.interceptors.response.use(
  /**
   * Successful response handler.
   * 
   * @param {object} response - The Axios response object.
   * @returns {object} - The response data or the full response if no data is present.
   */
  (response) => {
    // Return only the response data if it exists, otherwise return the full response.
    return response && response.data ? response.data : response;
  },
  /**
   * Error response handler.
   * 
   * @param {object} error - The error object from the response.
   * @throws {object} - The error response data for further handling.
   */
  (error) => {
    throw error.response?.data ?? error; // Handle errors gracefully and throw relevant data.
  }
);

export default publicClient;
