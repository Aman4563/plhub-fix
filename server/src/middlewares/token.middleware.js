import jsonwebtoken from "jsonwebtoken";
import responseHandler from "../handlers/response.handler.js";
import userModel from "../models/user.model.js";

/**
 * Decode JWT from the request headers.
 *
 * @param {Object} req - Express request object containing the authorization header.
 * @returns {Object|boolean} - Decoded token payload if valid; otherwise, false.
 */
const tokenDecode = (req) => {
  try {
    const bearerHeader = req.headers["authorization"];

    if (bearerHeader) {
      // Extract token from the authorization header
      const token = bearerHeader.split(" ")[1];

      // Verify and decode the JWT token
      return jsonwebtoken.verify(token, process.env.TOKEN_SECRET);
    }

    return false;
  } catch (error) {
    console.error("Token decoding error:", error.message); // Log the error for debugging
    return false;
  }
};

/**
 * Authentication Middleware
 * Verifies the JWT token and retrieves the associated user.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const auth = async (req, res, next) => {
  try {
    // Decode the token from the request headers
    const tokenDecoded = tokenDecode(req);

    if (!tokenDecoded) {
      return responseHandler.unauthorize(res, "Invalid or missing token.");
    }

    // Retrieve the user associated with the token
    const user = await userModel.findById(tokenDecoded.data);

    if (!user) {
      return responseHandler.unauthorize(res, "User not found or unauthorized.");
    }

    // Attach the user object to the request for further use
    req.user = user;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message); // Log the error for debugging
    responseHandler.error(res, "Authentication failed. Please try again.");
  }
};

// Export the authentication functions for use in routes
export default { auth, tokenDecode };
