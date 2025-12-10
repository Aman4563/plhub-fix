/**
 * Rate Limiter Middleware
 * Provides different rate limiting strategies for various endpoints
 */

import rateLimit from "express-rate-limit";
import { ipKeyGenerator } from "express-rate-limit";
import securityConfig from "../config/security.config.js";
import logger from "../config/logger.config.js";

/**
 * General rate limiter for all routes
 */
export const generalLimiter = rateLimit({
  ...securityConfig.rateLimit.general,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(securityConfig.rateLimit.general.message);
  },
});

/**
 * Strict rate limiter for authentication routes
 * Prevents brute-force attacks on login/signup
 */
export const authLimiter = rateLimit({
  ...securityConfig.rateLimit.auth,
  keyGenerator: (req, res) => {
    const ip = ipKeyGenerator(req, res);
    return `${ip}-${req.body?.username || "anonymous"}`;
  },
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}, username: ${req.body?.username}`);
    res.status(429).json(securityConfig.rateLimit.auth.message);
  },
  skip: (req) => {
    // Skip rate limiting for Google OAuth (has its own protection)
    return req.path.includes("google-signin");
  },
});

/**
 * API rate limiter for general API endpoints
 */
export const apiLimiter = rateLimit({
  ...securityConfig.rateLimit.api,
  handler: (req, res) => {
    logger.warn(`API rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json(securityConfig.rateLimit.api.message);
  },
});

/**
 * Password reset rate limiter
 * Very strict to prevent email enumeration attacks
 */
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per hour
  message: { status: 429, message: "Too many password reset attempts. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Password reset rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({ status: 429, message: "Too many password reset attempts. Please try again later." });
  },
});

export default {
  generalLimiter,
  authLimiter,
  apiLimiter,
  passwordResetLimiter,
};

