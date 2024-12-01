import axios from "axios";

/**
 * Send a GET request to the specified URL with default headers.
 *
 * @param {string} url - The URL to send the GET request to.
 * @returns {Promise<Object>} - The response data from the server.
 * @throws {Error} - Throws an error if the request fails.
 */
const get = async (url) => {
  try {
    // Send GET request using axios with default headers
    const response = await axios.get(url, {
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "identity", // Disable gzip encoding if needed
      },
    });

    // Return the response data
    return response.data;
  } catch (error) {
    console.error("Error in GET request:", error.message); // Log detailed error message
    throw new Error(`Failed to fetch data from ${url}. Please try again.`); // Throw a custom error
  }
};

export default { get };
