/**
 * Response Handler
 * Provides consistent API response formatting
 */

/**
 * Send a JSON response with the provided status code and data
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {Object} data - JSON data to send
 */
const responseWithData = (res, statusCode, data) => {
  return res.status(statusCode).json(data);
};

/**
 * Internal Server Error Response (500)
 * @param {Object} res - Express response object
 * @param {string} [message] - Optional custom error message
 */
const error = (res, message = "Oops! Something went wrong!") => {
  return responseWithData(res, 500, {
    status: 500,
    message,
  });
};

/**
 * Bad Request Response (400)
 * @param {Object} res - Express response object
 * @param {string} [message] - Custom error message
 */
const badrequest = (res, message = "Bad Request") => {
  return responseWithData(res, 400, {
    status: 400,
    message,
  });
};

/**
 * OK Response (200)
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 */
const ok = (res, data) => {
  return responseWithData(res, 200, data);
};

/**
 * Created Response (201)
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 */
const created = (res, data) => {
  return responseWithData(res, 201, data);
};

/**
 * Unauthorized Response (401)
 * @param {Object} res - Express response object
 * @param {string} [message] - Custom unauthorized message
 */
const unauthorize = (res, message = "Unauthorized") => {
  return responseWithData(res, 401, {
    status: 401,
    message,
  });
};

/**
 * Forbidden Response (403)
 * @param {Object} res - Express response object
 * @param {string} [message] - Custom forbidden message
 */
const forbidden = (res, message = "Access forbidden") => {
  return responseWithData(res, 403, {
    status: 403,
    message,
  });
};

/**
 * Not Found Response (404)
 * @param {Object} res - Express response object
 * @param {string} [message] - Custom not found message
 */
const notfound = (res, message = "Resource not found") => {
  return responseWithData(res, 404, {
    status: 404,
    message,
  });
};

/**
 * Conflict Response (409)
 * @param {Object} res - Express response object
 * @param {string} [message] - Custom conflict message
 */
const conflict = (res, message = "Resource already exists") => {
  return responseWithData(res, 409, {
    status: 409,
    message,
  });
};

/**
 * Too Many Requests Response (429)
 * @param {Object} res - Express response object
 * @param {string} [message] - Custom rate limit message
 */
const tooManyRequests = (res, message = "Too many requests. Please try again later.") => {
  return responseWithData(res, 429, {
    status: 429,
    message,
  });
};

/**
 * Validation Error Response (422)
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors
 */
const validationError = (res, errors) => {
  return responseWithData(res, 422, {
    status: 422,
    message: "Validation failed",
    errors,
  });
};

export default {
  error,
  badrequest,
  ok,
  created,
  unauthorize,
  forbidden,
  notfound,
  conflict,
  tooManyRequests,
  validationError,
};
