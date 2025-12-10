/**
 * Public API Client
 * For unauthenticated requests
 */

import axios from "axios";
import queryString from "query-string";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1/";

const publicClient = axios.create({
  baseURL,
  paramsSerializer: {
    encode: (params) => queryString.stringify(params),
  },
  withCredentials: true, // Required for cookies
});

/**
 * Request interceptor
 * Adds common headers
 */
publicClient.interceptors.request.use(
  async (config) => {
    return {
      ...config,
      headers: {
        ...config.headers,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * Extracts data from response
 */
publicClient.interceptors.response.use(
  (response) => {
    return response?.data ?? response;
  },
  (error) => {
    throw error.response?.data ?? error;
  }
);

export default publicClient;
