/**
 * Token Middleware
 * Handles JWT authentication with support for httpOnly cookies and Authorization header
 */

import jsonwebtoken from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";
import userModel from "../models/user.model.js";
import logger from "../config/logger.config.js";

/**
 * Decode JWT from request
 * Checks both httpOnly cookies and Authorization header for backward compatibility
 * @param {Object} req - Express request object
 * @returns {Object|boolean} - Decoded token payload if valid; otherwise, false
 */
const tokenDecode = (req) => {
  try {
    let token = null;

    // First, try to get token from httpOnly cookie (preferred method)
    if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
    // Fallback to Authorization header for backward compatibility
    else if (req.headers.authorization) {
      const bearerHeader = req.headers.authorization;
      if (bearerHeader.startsWith("Bearer ")) {
        token = bearerHeader.split(" ")[1];
      }
    }

    if (!token) {
      return false;
    }

    // Verify and decode the JWT token
    const decoded = jsonwebtoken.verify(token, process.env.TOKEN_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      logger.debug("Token expired", { error: error.message });
    } else {
      logger.warn("Token verification failed", { error: error.message });
    }
    return false;
  }
};

/**
 * Authentication Middleware
 * Verifies the JWT token and retrieves the associated user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 */
const auth = async (req, res, next) => {
  try {
    const tokenDecoded = tokenDecode(req);

    if (!tokenDecoded) {
      return responseHandler.unauthorize(res, "Authentication required. Please sign in.");
    }

    // Retrieve the user associated with the token
    const user = await userModel.findById(tokenDecoded.data);

    if (!user) {
      logger.warn("Token valid but user not found", { userId: tokenDecoded.data });
      return responseHandler.unauthorize(res, "User not found. Please sign in again.");
    }

    // Check if user is active
    if (!user.isActive) {
      logger.warn("Inactive user attempted access", { userId: user.id });
      return responseHandler.unauthorize(res, "Account is deactivated. Please contact support.");
    }

    // Check if user is permanently banned
    if (user.isPermanentlyBanned) {
      logger.warn("Banned user attempted access", { userId: user.id });
      return responseHandler.forbidden(
        res,
        `Your account has been permanently banned. Reason: ${user.banReason || "Policy violation"}`
      );
    }

    // Check if user is suspended
    if (user.isSuspended) {
      const suspendedUntil = user.suspendedUntil;
      
      // Check if suspension has expired
      if (suspendedUntil && new Date(suspendedUntil) <= new Date()) {
        // Auto-unsuspend if time has passed
        user.isSuspended = false;
        user.suspendedUntil = undefined;
        user.suspensionReason = undefined;
        await user.save();
        logger.info("User auto-unsuspended", { userId: user.id });
      } else {
        const until = suspendedUntil 
          ? new Date(suspendedUntil).toLocaleDateString() 
          : "indefinitely";
        
        logger.warn("Suspended user attempted access", { 
          userId: user.id,
          suspendedUntil,
        });
        
        return responseHandler.forbidden(
          res,
          `Your account is suspended until ${until}. Reason: ${user.suspensionReason || "Policy violation"}`
        );
      }
    }

    // Attach the user object to the request
    req.user = user;
    next();
  } catch (error) {
    logger.error("Authentication error", { error: error.message });
    responseHandler.error(res, "Authentication failed. Please try again.");
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user to request if token is valid, but doesn't require authentication
 * Useful for endpoints that behave differently for authenticated users
 */
const optionalAuth = async (req, res, next) => {
  try {
    const tokenDecoded = tokenDecode(req);

    if (tokenDecoded) {
      const user = await userModel.findById(tokenDecoded.data);
      if (user && user.isActive) {
        req.user = user;
      }
    }

    next();
  } catch (error) {
    // Continue without user for optional auth
    next();
  }
};

export default { auth, tokenDecode, optionalAuth };
