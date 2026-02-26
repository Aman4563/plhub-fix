/**
 * Validation Utilities
 * Contains helper functions for input validation
 */

import crypto from "crypto";

// Common disposable email domains
const DISPOSABLE_EMAIL_DOMAINS = [
  'mailinator.com', 'tempmail.com', 'throwaway.email', 'guerrillamail.com',
  'sharklasers.com', 'grr.la', 'guerrillamailblock.com', 'pokemail.net',
  'spam4.me', 'trash-mail.com', 'discard.email', 'discardmail.com',
  'mailnesia.com', 'mytempemail.com', 'tempr.email', 'throwawaymail.com',
  'temp-mail.org', 'tempail.com', 'fakeinbox.com', 'getnada.com',
  'mohmal.com', 'emailondeck.com', 'tempinbox.com', 'yopmail.com',
  'maildrop.cc', 'mailsac.com', 'burnermail.io', 'tempmailo.com',
  '10minutemail.com', '10minutemail.net', 'minutemail.com', 'spamgourmet.com',
  'trashmail.com', 'mailexpire.com', 'tempsky.com', 'inboxalias.com',
  'jetable.org', 'kasmail.com', 'spamobox.com', 'tempemail.co.za',
  'tmpmail.org', 'tmpmail.net', 'wegwerfemail.de', 'emailfake.com',
  'fakemailgenerator.com', 'crazymailing.com', 'tempail.com', 'tempmailaddress.com',
];

// Common profane words (basic list - consider using a library for production)
const PROFANE_WORDS = [
  'admin', 'administrator', 'moderator', 'support', 'help', 'system',
  'root', 'superuser', 'webmaster', 'postmaster', 'hostmaster',
  // Add actual profane words as needed - keeping it minimal here
  'fuck', 'shit', 'ass', 'bitch', 'damn', 'bastard', 'cunt', 'dick',
  'pussy', 'cock', 'fag', 'nigger', 'nigga', 'whore', 'slut',
];

// Reserved usernames that shouldn't be allowed
const RESERVED_USERNAMES = [
  'admin', 'administrator', 'mod', 'moderator', 'support', 'help',
  'system', 'root', 'superuser', 'webmaster', 'postmaster', 'hostmaster',
  'info', 'contact', 'sales', 'billing', 'abuse', 'security',
  'noreply', 'no-reply', 'mailer-daemon', 'nobody', 'anonymous',
  'user', 'test', 'testing', 'demo', 'example', 'sample',
  'plhub', 'pl-hub', 'official', 'verified', 'staff', 'team',
  'api', 'dev', 'developer', 'developers', 'app', 'apps',
  'null', 'undefined', 'true', 'false', 'login', 'signin', 'signup',
];

/**
 * Check if email is from a disposable email provider
 * @param {string} email - Email address to check
 * @returns {boolean} - True if email is disposable
 */
export const isDisposableEmail = (email) => {
  if (!email) return false;
  const domain = email.toLowerCase().split('@')[1];
  return DISPOSABLE_EMAIL_DOMAINS.includes(domain);
};

/**
 * Check if username contains profanity or reserved words
 * @param {string} username - Username to check
 * @returns {{ isProfane: boolean, isReserved: boolean, reason: string | null }}
 */
export const checkUsername = (username) => {
  if (!username) return { isProfane: false, isReserved: false, reason: null };
  
  const lowerUsername = username.toLowerCase();
  
  // Check if it's a reserved username
  if (RESERVED_USERNAMES.includes(lowerUsername)) {
    return {
      isProfane: false,
      isReserved: true,
      reason: 'This username is reserved',
    };
  }
  
  // Check for profane words
  for (const word of PROFANE_WORDS) {
    if (lowerUsername.includes(word)) {
      return {
        isProfane: true,
        isReserved: false,
        reason: 'Username contains inappropriate content',
      };
    }
  }
  
  return { isProfane: false, isReserved: false, reason: null };
};

/**
 * Mask email for logging (privacy)
 * @param {string} email - Email to mask
 * @returns {string} - Masked email (e.g., j***n@example.com)
 */
export const maskEmail = (email) => {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0]}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
};

/**
 * Generate a secure random token
 * @param {number} length - Length of the token
 * @returns {string} - Random hex token
 */
export const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

/**
 * Hash a token for storage
 * @param {string} token - Token to hash
 * @returns {string} - Hashed token
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

export default {
  isDisposableEmail,
  checkUsername,
  maskEmail,
  generateSecureToken,
  hashToken,
};

