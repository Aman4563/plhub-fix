/**
 * Cache Utility Module
 * Shared in-memory caching for TMDB API responses
 * Used by chatbot tools and agent modules
 */

import logger from "../config/logger.config.js";

// Configuration
const DEFAULT_TTL = 15 * 60 * 1000; // 15 minutes
const DEFAULT_MAX_SIZE = 200;

/**
 * TMDBCache - Simple in-memory cache with TTL and size limits
 */
class TMDBCache {
  constructor(ttl = DEFAULT_TTL, maxSize = DEFAULT_MAX_SIZE) {
    this.cache = new Map();
    this.ttl = ttl;
    this.maxSize = maxSize;
  }

  /**
   * Get cached value if not expired
   * @param {string} key - Cache key
   * @returns {any|null} - Cached data or null if expired/not found
   */
  get(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      logger.debug("Cache hit", { key });
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key); // Remove expired entry
    }
    return null;
  }

  /**
   * Set cache value with automatic cleanup
   * @param {string} key - Cache key
   * @param {any} data - Data to cache
   */
  set(key, data) {
    // Cleanup if cache is too large (remove oldest entry)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
      logger.debug("Cache evicted oldest entry", { evictedKey: oldestKey });
    }
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  /**
   * Check if key exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return true;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return false;
  }

  /**
   * Delete a specific key
   * @param {string} key - Cache key
   */
  delete(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cached data
   * @returns {number} - Number of entries cleared
   */
  clear() {
    const size = this.cache.size;
    this.cache.clear();
    logger.info("Cache cleared", { entriesCleared: size });
    return size;
  }

  /**
   * Get cache statistics
   * @returns {object} - Cache stats
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      ttlMinutes: this.ttl / 60000,
    };
  }

  /**
   * Get timestamp for a key (for logging purposes)
   * @param {string} key - Cache key
   * @returns {number|null} - Timestamp or null
   */
  getTimestamp(key) {
    const cached = this.cache.get(key);
    return cached?.timestamp || null;
  }
}

// Singleton instance for TMDB caching (shared across modules)
const tmdbCache = new TMDBCache(DEFAULT_TTL, DEFAULT_MAX_SIZE);

// Export both the class and singleton
export { TMDBCache, tmdbCache };

export default tmdbCache;

