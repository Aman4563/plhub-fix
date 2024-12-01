/**
 * Send a JSON response with the provided status code and data.
 *
 * @param {Object} res - Express response object.
 * @param {number} statusCode - HTTP status code.
 * @param {Object} data - JSON data to send in the response.
 */
const responseWithData = (res, statusCode, data) => res.status(statusCode).json(data);

/**
 * Internal Server Error Response
 * Sends a 500 error response.
 */
const error = (res) =>
  responseWithData(res, 500, {
    status: 500,
    message: "Oops! Something went wrong!",
  });

/**
 * Bad Request Response
 * Sends a 400 error response with a custom message.
 */
const badrequest = (res, message = "Bad Request") =>
  responseWithData(res, 400, {
    status: 400,
    message,
  });

/**
 * OK Response
 * Sends a 200 success response with data.
 */
const ok = (res, data) => responseWithData(res, 200, data);

/**
 * Created Response
 * Sends a 201 success response for resource creation.
 */
const created = (res, data) => responseWithData(res, 201, data);

/**
 * Unauthorized Response
 * Sends a 401 error response.
 */
const unauthorize = (res) =>
  responseWithData(res, 401, {
    status: 401,
    message: "Unauthorized",
  });

/**
 * Not Found Response
 * Sends a 404 error response.
 */
const notfound = (res) =>
  responseWithData(res, 404, {
    status: 404,
    message: "Resource not found",
  });

// Export all response handlers
export default {
  error,
  badrequest,
  ok,
  created,
  unauthorize,
  notfound,
};
