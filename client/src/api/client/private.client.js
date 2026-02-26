/**
 * Private API Client
 * For authenticated requests with automatic token refresh
 */

import axios from "axios";
import queryString from "query-string";

const baseURL = process.env.REACT_APP_API_URL || "http://localhost:5000/api/v1/";

const privateClient = axios.create({
  baseURL,
  paramsSerializer: {
    encode: (params) => queryString.stringify(params),
  },
  withCredentials: true, // Required for httpOnly cookies
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Request interceptor
 * Adds authorization header if token exists (for backward compatibility)
 */
privateClient.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("actkn");

    return {
      ...config,
      headers: {
        ...config.headers,
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    };
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor
 * Handles token refresh on 401 errors
 */
privateClient.interceptors.response.use(
  (response) => {
    return response?.data ?? response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't try to refresh if user is already logged out (no token in localStorage)
      const hasToken = localStorage.getItem("actkn");
      if (!hasToken) {
        window.dispatchEvent(new CustomEvent("auth:logout"));
        throw error.response?.data ?? error;
      }

      if (isRefreshing) {
        // Queue the request while refreshing
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return privateClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Try to refresh the token
        const response = await axios.post(
          `${baseURL}user/refresh-token`,
          {},
          { withCredentials: true }
        );

        const { token } = response.data;

        if (token) {
          localStorage.setItem("actkn", token);
          originalRequest.headers.Authorization = `Bearer ${token}`;
          processQueue(null, token);
          return privateClient(originalRequest);
        } else {
          throw new Error("No token received from refresh");
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Clear tokens and dispatch logout event
        localStorage.removeItem("actkn");
        window.dispatchEvent(new CustomEvent("auth:logout"));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    throw error.response?.data ?? error;
  }
);

export default privateClient;
