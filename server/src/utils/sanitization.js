/**
 * Sanitization Utility Module
 * Shared input sanitization for user-provided content
 * Prevents XSS and injection attacks
 */

/**
 * Sanitize user input to prevent XSS and other injection attacks
 * @param {string} input - Raw user input
 * @param {number} maxLength - Maximum allowed length (default: 5000)
 * @returns {string} - Sanitized input
 */
export function sanitizeInput(input, maxLength = 5000) {
  if (typeof input !== "string") return "";
  
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, "")
    // Remove script content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Escape special characters that could be used for injection
    .replace(/[<>'"&]/g, (char) => {
      const escapeMap = {
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
        "&": "&amp;",
      };
      return escapeMap[char] || char;
    })
    // Limit length to prevent abuse
    .substring(0, maxLength)
    // Trim whitespace
    .trim();
}

/**
 * Sanitize notes input (shorter limit for watchlist/review notes)
 * @param {string} input - Raw notes input
 * @returns {string} - Sanitized notes
 */
export function sanitizeNotes(input) {
  return sanitizeInput(input, 500);
}

/**
 * Sanitize review content (medium limit)
 * @param {string} input - Raw review content
 * @returns {string} - Sanitized review
 */
export function sanitizeReview(input) {
  return sanitizeInput(input, 2000);
}

/**
 * Sanitize search query (short limit, preserve spaces)
 * @param {string} input - Raw search query
 * @returns {string} - Sanitized query
 */
export function sanitizeSearchQuery(input) {
  if (typeof input !== "string") return "";
  
  return input
    // Remove dangerous characters but keep search-friendly ones
    .replace(/[<>'"]/g, "")
    // Limit length
    .substring(0, 200)
    // Normalize whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Sanitize display name (for user profiles)
 * @param {string} input - Raw display name
 * @returns {string} - Sanitized display name
 */
export function sanitizeDisplayName(input) {
  // Use base sanitization with 100 char limit for display names
  const sanitized = sanitizeInput(input, 100);
  // Additional protection against script injections in names
  return sanitized
    .replace(/javascript:/gi, "")
    .replace(/on\w+=/gi, "");
}

export default {
  sanitizeInput,
  sanitizeNotes,
  sanitizeReview,
  sanitizeSearchQuery,
  sanitizeDisplayName,
};

