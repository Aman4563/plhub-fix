/**
 * Password Utilities
 * Contains helper functions for password security
 */

import crypto from "crypto";
import https from "https";
import logger from "../config/logger.config.js";
import { sanitizeDisplayName as sharedSanitizeDisplayName } from "./sanitization.js";

/**
 * Check if password has been exposed in data breaches using HaveIBeenPwned API
 * Uses k-anonymity model - only first 5 chars of SHA-1 hash are sent
 * @param {string} password - Password to check
 * @returns {Promise<{ breached: boolean, count: number }>}
 */
export const checkPasswordBreach = async (password) => {
  try {
    // Generate SHA-1 hash of password
    const sha1Hash = crypto
      .createHash("sha1")
      .update(password)
      .digest("hex")
      .toUpperCase();

    // Split hash for k-anonymity (first 5 chars sent to API)
    const prefix = sha1Hash.substring(0, 5);
    const suffix = sha1Hash.substring(5);

    // Query HIBP API
    const response = await new Promise((resolve, reject) => {
      const options = {
        hostname: "api.pwnedpasswords.com",
        path: `/range/${prefix}`,
        method: "GET",
        headers: {
          "User-Agent": "PLHub-PasswordCheck",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => resolve({ status: res.statusCode, data }));
      });

      req.on("error", reject);
      req.setTimeout(5000, () => {
        req.destroy();
        reject(new Error("HIBP API timeout"));
      });
      req.end();
    });

    if (response.status !== 200) {
      logger.warn("HIBP API returned non-200 status", { status: response.status });
      return { breached: false, count: 0 }; // Fail open - don't block signup
    }

    // Parse response - format: HASH_SUFFIX:COUNT
    const lines = response.data.split("\r\n");
    for (const line of lines) {
      const [hashSuffix, countStr] = line.split(":");
      if (hashSuffix === suffix) {
        const count = parseInt(countStr, 10);
        logger.info("Password found in breach database", { count });
        return { breached: true, count };
      }
    }

    return { breached: false, count: 0 };
  } catch (error) {
    logger.error("HIBP password check error", { error: error.message });
    // Fail open - don't block signup if API is unavailable
    return { breached: false, count: 0 };
  }
};

/**
 * Sanitize displayName to prevent XSS
 * Re-exports shared sanitization utility for backwards compatibility
 * @param {string} displayName - Display name to sanitize
 * @returns {string} - Sanitized display name
 */
export const sanitizeDisplayName = sharedSanitizeDisplayName;

export default {
  checkPasswordBreach,
  sanitizeDisplayName,
};

