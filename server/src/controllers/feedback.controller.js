// import responseHandler from "../handlers/response.handler.js";
// import feedbackModel from "../models/feedback.model.js";

// const submitFeedback = async (req, res) => {
//   try {
//     const { user, feedback } = req.body;

//     const newFeedback = new feedbackModel({
//       user,
//       feedback
//     });

//     await newFeedback.save();

//     responseHandler.created(res, newFeedback);
//   } catch (error) {
//     console.error(error);
//     responseHandler.error(res);
//   }
// };

// const getFeedbackList = async (req, res) => {
//   try {
//     const feedbackList = await feedbackModel.find();
//     responseHandler.ok(res, feedbackList);
//   } catch (error) {
//     console.log("entered error");
//     responseHandler.error(res);
//   }
// };

// export default { submitFeedback, getFeedbackList };


// backend/controllers/feedback.controller.js

import responseHandler from "../handlers/response.handler.js";
import feedbackModel from "../models/feedback.model.js";

const submitFeedback = async (req, res) => {
  try {
    const { user, feedback } = req.body;

    const newFeedback = new feedbackModel({
      user,
      feedback
    });

    await newFeedback.save();

    console.log('Feedback submitted successfully'); // Add console log for debugging

    responseHandler.created(res, newFeedback);
  } catch (error) {
    console.error('Error submitting feedback:', error); // Log any errors to console
    responseHandler.error(res);
  }
};

const getFeedbackList = async (req, res) => {
  try {
    const feedbackList = await feedbackModel.find();
    console.log('Feedback list:', feedbackList); // Add console log for debugging
    responseHandler.ok(res, feedbackList);
  } catch (error) {
    console.error('Error fetching feedback list:', error); // Log any errors to console
    responseHandler.error(res);
  }
};

export default { submitFeedback, getFeedbackList };
