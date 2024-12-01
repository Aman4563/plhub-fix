// Import required modules
import responseHandler from "../handlers/response.handler.js";
import reviewModel from "../models/review.model.js";

/**
 * Create a new review.
 *
 * @param {Object} req - Express request object containing user data and review details.
 * @param {Object} res - Express response object to send the result.
 */
const create = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Validate movieId
    if (!movieId) {
      return responseHandler.badrequest(res, "Movie ID is required");
    }

    // Create a new review document
    const review = await reviewModel.create({
      user: req.user.id, // Associate review with the authenticated user
      movieId, // Movie identifier from request parameters
      ...req.body, // Other review details from the request body
    });

    // Send response with the newly created review
    responseHandler.created(res, {
      ...review._doc,
      id: review.id,
      user: req.user, // Include user information in the response
    });
  } catch (error) {
    console.error("Error creating review:", error);
    responseHandler.error(res, "Failed to create review"); // Handle unexpected errors
  }
};

/**
 * Remove a review.
 *
 * @param {Object} req - Express request object containing review ID and user data.
 * @param {Object} res - Express response object to send the result.
 */
const remove = async (req, res) => {
  try {
    const { reviewId } = req.params;

    // Validate reviewId
    if (!reviewId) {
      return responseHandler.badrequest(res, "Review ID is required");
    }

    // Find and delete the review in a single operation
    const review = await reviewModel.findOneAndDelete({
      _id: reviewId,
      user: req.user.id,
    });

    if (!review) {
      return responseHandler.notfound(res, "Review not found or unauthorized");
    }

    responseHandler.ok(res, { message: "Review successfully removed" });
  } catch (error) {
    console.error("Error removing review:", error);
    responseHandler.error(res, "Failed to remove review"); // Handle unexpected errors
  }
};

/**
 * Get all reviews created by the authenticated user.
 *
 * @param {Object} req - Express request object containing user data.
 * @param {Object} res - Express response object to send the result.
 */
const getReviewsOfUser = async (req, res) => {
  try {
    // Fetch all reviews for the authenticated user, sorted by creation date
    const reviews = await reviewModel
      .find({ user: req.user.id }, "-__v") // Exclude unnecessary fields like `__v`
      .sort("-createdAt")
      .lean(); // Optimize for read-only operations

    responseHandler.ok(res, reviews); // Send response with the list of reviews
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    responseHandler.error(res, "Failed to fetch user reviews"); // Handle unexpected errors
  }
};

// Export the review controller functions
export default { create, remove, getReviewsOfUser };
