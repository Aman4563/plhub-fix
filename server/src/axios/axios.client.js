import axios from "axios";

const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Send a GET request to the specified URL with retry logic for network errors.
 *
 * @param {string} url - The URL to send the GET request to.
 * @returns {Promise<Object>} - The response data from the server.
 * @throws {Error} - Throws an error if all retries fail.
 */
const get = async (url) => {
  let lastError;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(url, {
        headers: {
          Accept: "application/json",
          "Accept-Encoding": "identity",
        },
        timeout: 10000,
      });

      return response.data;
    } catch (error) {
      lastError = error;

      const isRetryable =
        error.code === "ECONNRESET" ||
        error.code === "ETIMEDOUT" ||
        error.code === "ECONNABORTED" ||
        error.response?.status >= 500;

      if (!isRetryable || attempt === MAX_RETRIES - 1) {
        break;
      }

      const delay = INITIAL_DELAY * Math.pow(2, attempt);
      console.warn(`Request failed (attempt ${attempt + 1}/${MAX_RETRIES}), retrying in ${delay}ms...`);
      await sleep(delay);
    }
  }

  console.error("Error in GET request:", lastError.message);
  throw new Error(`Failed to fetch data from ${url}. Please try again.`);
};

export default { get };
