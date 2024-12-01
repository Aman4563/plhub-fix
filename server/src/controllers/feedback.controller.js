// Import required modules and dependencies
import responseHandler from "../handlers/response.handler.js"; // Custom response handler for consistent responses
import feedbackModel from "../models/feedback.model.js"; // Mongoose model for feedback data

/**
 * Submit Feedback
 * Handles user feedback submission.
 *
 * @param {Object} req - Express request object containing user and feedback details in the body.
 * @param {Object} res - Express response object to send the result.
 * @route POST /api/v1/feedback
 * @access Public
 */
const submitFeedback = async (req, res) => {
  try {
    const { user, feedback } = req.body;

    // Validate required fields
    if (!user || !feedback) {
      return responseHandler.badrequest(res, "User and feedback fields are required.");
    }

    // Create and save the feedback in one step
    const newFeedback = await feedbackModel.create({ user, feedback });

    // Log success and return the created feedback
    console.log("Feedback submitted successfully:", newFeedback._id);
    responseHandler.created(res, newFeedback);
  } catch (error) {
    console.error("Error submitting feedback:", error.message); // Improved error logging
    responseHandler.error(res, "Failed to submit feedback. Please try again.");
  }
};

/**
 * Get Feedback List
 * Retrieves the list of all submitted feedback with pagination support.
 *
 * @param {Object} req - Express request object containing optional query parameters for pagination.
 * @param {Object} res - Express response object to send the result.
 * @route GET /api/v1/feedback
 * @access Admin
 */
const getFeedbackList = async (req, res) => {
  try {
    // Optional pagination support
    const { page = 1, limit = 10 } = req.query;

    // Convert query params to integers
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const feedbackList = await feedbackModel
      .find()
      .sort("-createdAt") // Sort by newest first
      .skip(skip)
      .limit(parseInt(limit));

    const totalFeedback = await feedbackModel.countDocuments(); // Get total count for pagination metadata

    // Log and return the feedback list with metadata
    console.log(`Fetched ${feedbackList.length} feedback(s) (Page: ${page})`);
    responseHandler.ok(res, {
      total: totalFeedback,
      page: parseInt(page),
      limit: parseInt(limit),
      feedback: feedbackList,
    });
  } catch (error) {
    console.error("Error fetching feedback list:", error.message); // Improved error logging
    responseHandler.error(res, "Failed to fetch feedback list. Please try again.");
  }
};

// Export the controller functions for use in routes
export default { submitFeedback, getFeedbackList };
