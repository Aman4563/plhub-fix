import { validationResult } from "express-validator";

/**
 * Validate Request Middleware
 * Processes validation results and handles errors from express-validator.
 *
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 * @param {Function} next - Express next middleware function.
 */
const validate = (req, res, next) => {
  // Retrieve validation errors from the request
  const errors = validationResult(req);

  // If there are validation errors, return the first error message
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg,
      errors: errors.array(), // Optionally include all validation errors for debugging
    });
  }

  // Proceed to the next middleware if validation passes
  next();
};

export default { validate };
