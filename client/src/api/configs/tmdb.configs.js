/**
 * Configuration for interacting with The Movie Database (TMDB) API.
 * - Includes constants and utility functions for generating image and video URLs.
 */

// Media types (e.g., movies or TV shows)
const mediaType = {
  movie: "movie", // Represents movies
  tv: "tv", // Represents TV shows
};

// Media categories for fetching specific lists of content
const mediaCategory = {
  popular: "popular", // Popular content
  top_rated: "top_rated", // Top-rated content
};

/**
 * Generates a full URL for a backdrop image.
 *
 * @param {string} imgEndpoint - The image endpoint returned by the TMDB API.
 * @returns {string} - Full URL for the backdrop image.
 */
const backdropPath = (imgEndpoint) => `https://image.tmdb.org/t/p/original${imgEndpoint}`;

/**
 * Generates a full URL for a poster image.
 *
 * @param {string} imgEndpoint - The image endpoint returned by the TMDB API.
 * @returns {string} - Full URL for the poster image.
 */
const posterPath = (imgEndpoint) => `https://image.tmdb.org/t/p/w500${imgEndpoint}`;

/**
 * Generates a full YouTube embed URL for a video.
 *
 * @param {string} videoId - The YouTube video ID.
 * @returns {string} - Full YouTube embed URL with no controls.
 */
const youtubePath = (videoId) => `https://www.youtube.com/embed/${videoId}?controls=0`;

// Exported configuration object for TMDB-related utilities
const tmdbConfigs = {
  mediaType, // Media types (movie, TV)
  mediaCategory, // Media categories (popular, top-rated)
  backdropPath, // Utility for generating backdrop image URLs
  posterPath, // Utility for generating poster image URLs
  youtubePath, // Utility for generating YouTube embed URLs
};

export default tmdbConfigs;
