/**
 * Cache Middleware
 * Redis-based caching for API responses
 * Falls back to in-memory cache if Redis is not available
 */

import Redis from "ioredis";
import logger from "../config/logger.config.js";

// In-memory cache fallback
const memoryCache = new Map();
const memoryCacheExpiry = new Map();

// Redis client (optional - will use memory cache if not configured)
let redisClient = null;
let useRedis = false;
let redisErrorLogged = false;

// Check if Redis URL is properly configured (not empty or whitespace)
const redisUrl = process.env.REDIS_URL?.trim();
const isRedisConfigured = redisUrl && redisUrl.length > 0 && redisUrl.startsWith("redis");

// Initialize Redis if URL is properly provided
if (isRedisConfigured) {
  try {
    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      enableOfflineQueue: false,
      connectTimeout: 5000,
      retryStrategy: (times) => {
        if (times > 3) {
          if (!redisErrorLogged) {
            logger.info("Redis: Max retries reached, falling back to memory cache");
            redisErrorLogged = true;
          }
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    });

    redisClient.on("connect", () => {
      logger.info("Redis connected successfully");
      useRedis = true;
      redisErrorLogged = false;
    });

    redisClient.on("ready", () => {
      logger.info("Redis ready to accept commands");
      useRedis = true;
    });

    redisClient.on("error", (err) => {
      if (!redisErrorLogged) {
        const errorMsg = err.message || err.code || "Unknown error";
        logger.info(`Redis unavailable (${errorMsg}), using memory cache`);
        redisErrorLogged = true;
      }
      useRedis = false;
    });

    redisClient.on("close", () => {
      useRedis = false;
    });

    redisClient.connect().catch((err) => {
      if (!redisErrorLogged) {
        const errorMsg = err?.message || err?.code || "Connection refused";
        logger.info(`Redis connection failed (${errorMsg}), using memory cache`);
        redisErrorLogged = true;
      }
      useRedis = false;
    });
  } catch (error) {
    if (!redisErrorLogged) {
      const errorMsg = error.message || "Unknown error";
      logger.info(`Redis initialization failed (${errorMsg}), using memory cache`);
      redisErrorLogged = true;
    }
  }
} else {
  // Redis not configured - this is expected in many setups
  logger.info("Cache: Using in-memory cache (Redis not configured)");
}

/**
 * Cache configuration by route type
 */
const cacheConfig = {
  // Long cache for static data
  genres: { ttl: 86400, prefix: "genres" }, // 24 hours
  certifications: { ttl: 86400, prefix: "certs" }, // 24 hours
  
  // Medium cache for popular content
  trending: { ttl: 3600, prefix: "trending" }, // 1 hour
  popular: { ttl: 1800, prefix: "popular" }, // 30 minutes
  topRated: { ttl: 3600, prefix: "top_rated" }, // 1 hour
  
  // Short cache for dynamic content
  mediaList: { ttl: 900, prefix: "list" }, // 15 minutes
  mediaDetail: { ttl: 600, prefix: "detail" }, // 10 minutes
  search: { ttl: 300, prefix: "search" }, // 5 minutes
  
  // Very short cache for user-specific data
  watchProviders: { ttl: 3600, prefix: "providers" }, // 1 hour
  
  // Default
  default: { ttl: 300, prefix: "cache" }, // 5 minutes
};

/**
 * Generate cache key from request
 */
const generateCacheKey = (req, prefix = "cache") => {
  const { originalUrl, method } = req;
  // Remove query params that shouldn't affect cache
  const cleanUrl = originalUrl.split("?")[0];
  const queryParams = new URLSearchParams(req.query);
  
  // Sort query params for consistent keys
  queryParams.sort();
  
  return `plhub:${prefix}:${method}:${cleanUrl}:${queryParams.toString()}`;
};

/**
 * Get from cache (Redis or memory)
 */
const getFromCache = async (key) => {
  try {
    if (useRedis && redisClient) {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } else {
      // Memory cache fallback
      const expiry = memoryCacheExpiry.get(key);
      if (expiry && expiry < Date.now()) {
        memoryCache.delete(key);
        memoryCacheExpiry.delete(key);
        return null;
      }
      return memoryCache.get(key) || null;
    }
  } catch (error) {
    logger.error("Cache get error", { error: error.message, key });
    return null;
  }
};

/**
 * Set to cache (Redis or memory)
 */
const setToCache = async (key, data, ttl) => {
  try {
    if (useRedis && redisClient) {
      await redisClient.setex(key, ttl, JSON.stringify(data));
    } else {
      // Memory cache fallback with size limit
      if (memoryCache.size > 1000) {
        // Clear oldest entries
        const keysToDelete = Array.from(memoryCache.keys()).slice(0, 100);
        keysToDelete.forEach((k) => {
          memoryCache.delete(k);
          memoryCacheExpiry.delete(k);
        });
      }
      memoryCache.set(key, data);
      memoryCacheExpiry.set(key, Date.now() + ttl * 1000);
    }
  } catch (error) {
    logger.error("Cache set error", { error: error.message, key });
  }
};

/**
 * Delete from cache
 */
const deleteFromCache = async (pattern) => {
  try {
    if (useRedis && redisClient) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(...keys);
      }
    } else {
      // Memory cache - delete matching keys
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace("*", ""))) {
          memoryCache.delete(key);
          memoryCacheExpiry.delete(key);
        }
      }
    }
  } catch (error) {
    logger.error("Cache delete error", { error: error.message, pattern });
  }
};

/**
 * Routes that should NEVER be cached (user-specific data)
 * These endpoints return different data based on the authenticated user
 */
const USER_SPECIFIC_ROUTES = [
  "/api/v1/user",
  "/api/v1/reviews",
  "/api/v1/favorites",
  "/api/v1/watchlist",
  "/api/v1/chatbot/history",
];

/**
 * Check if route is user-specific (should not be cached)
 */
const isUserSpecificRoute = (path) => {
  return USER_SPECIFIC_ROUTES.some(route => path.includes(route));
};

/**
 * Cache middleware factory
 */
const cacheMiddleware = (configKey = "default") => {
  const config = cacheConfig[configKey] || cacheConfig.default;

  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== "GET") {
      return next();
    }

    // Skip caching ONLY for user-specific routes (not all authenticated requests)
    // Public content (trending, popular, genres, etc.) should be cached for everyone
    if (isUserSpecificRoute(req.originalUrl)) {
      return next();
    }

    const cacheKey = generateCacheKey(req, config.prefix);

    try {
      // Try to get from cache
      const cachedData = await getFromCache(cacheKey);

      if (cachedData) {
        logger.info("Cache hit", { key: cacheKey, ttl: config.ttl });
        return res.json(cachedData);
      }

      // Store original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache response
      res.json = (data) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          setToCache(cacheKey, data, config.ttl);
          logger.info("Cache set", { key: cacheKey, ttl: config.ttl });
        }
        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error", { error: error.message });
      next();
    }
  };
};

/**
 * Clear cache for specific patterns
 */
const clearCache = {
  all: () => deleteFromCache("plhub:*"),
  genres: () => deleteFromCache("plhub:genres:*"),
  trending: () => deleteFromCache("plhub:trending:*"),
  mediaDetail: (mediaId) => deleteFromCache(`plhub:detail:*${mediaId}*`),
  search: () => deleteFromCache("plhub:search:*"),
};

/**
 * Get cache statistics
 */
const getCacheStats = async () => {
  if (useRedis && redisClient) {
    const info = await redisClient.info("memory");
    const keys = await redisClient.dbsize();
    return {
      type: "redis",
      keys,
      info: info.split("\n").slice(0, 5),
    };
  } else {
    return {
      type: "memory",
      keys: memoryCache.size,
      maxSize: 1000,
    };
  }
};

export {
  cacheMiddleware,
  clearCache,
  getCacheStats,
  getFromCache,
  setToCache,
  deleteFromCache,
};

export default cacheMiddleware;

