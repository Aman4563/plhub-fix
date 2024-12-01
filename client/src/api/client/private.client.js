import axios from "axios";
import queryString from "query-string";

/**
 * Base URL for the API requests
 * Update this value depending on the environment (e.g., production or development).
 */
const baseURL = "https://plhub-fix-api-git-advancefeature-9703ab-amans-projects-62ecaac6.vercel.app/api/v1/";
// const baseURL = "http://localhost:8000/api/v1/";

/**
 * Create an Axios instance with default configurations.
 * - `baseURL`: Defines the base URL for all requests.
 * - `paramsSerializer`: Serializes query parameters for easier URL encoding.
 */
const privateClient = axios.create({
  baseURL,
  paramsSerializer: {
    encode: params => queryString.stringify(params), // Serialize query parameters using `query-string`
  },
});

/**
 * Request interceptor for handling authentication and headers.
 * - Adds JSON content type to all requests.
 * - Includes an Authorization header with a Bearer token if available in localStorage.
 */
privateClient.interceptors.request.use(
  async config => {
    const token = localStorage.getItem("actkn"); // Retrieve token from localStorage

    // Return updated config with headers
    return {
      ...config,
      headers: {
        ...config.headers, // Retain existing headers if any
        "Content-Type": "application/json", // Ensure JSON content type
        ...(token ? { Authorization: `Bearer ${token}` } : {}), // Conditionally include the Authorization header
      },
    };
  },
  error => {
    // Handle request errors if necessary
    return Promise.reject(error);
  }
);

/**
 * Response interceptor for handling responses and errors.
 * - Returns only the data part of the response if available.
 * - Throws errors from the API response for easier error handling.
 */
privateClient.interceptors.response.use(
  response => {
    // Return the response data if available, otherwise return the full response
    return response && response.data ? response.data : response;
  },
  error => {
    // Extract and throw the error response for more descriptive error messages
    throw error.response?.data || error.message;
  }
);

export default privateClient;
