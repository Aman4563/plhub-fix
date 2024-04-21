import express from "express";
import { body } from "express-validator";
import requestHandler from "../handlers/request.handler.js";
import feedbackController from "../controllers/feedback.controller.js";
import tokenMiddleware from "../middlewares/token.middleware.js";

const router = express.Router();

router.post(
  "/submit-feedback",
  tokenMiddleware.auth,
  body("feedback")
    .exists().withMessage("Feedback is required"),
  requestHandler.validate,
  feedbackController.submitFeedback
);

router.get(
  "/submit-feedback",
  feedbackController.getFeedbackList
);

export default router;
