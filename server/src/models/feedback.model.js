import mongoose from "mongoose";
import modelOptions from "./model.options.js";

const { Schema } = mongoose;

/**
 * Feedback Schema
 * Represents user-submitted feedback with references to the submitting user and content.
 */
const feedbackSchema = new Schema(
  {
    /**
     * Username of the user submitting the feedback.
     * Allows identification of the feedback author.
     */
    user: {
      type: String,
      required: [true, "User is required."],
      trim: true, // Prevent leading/trailing whitespace
      maxlength: [50, "Username cannot exceed 50 characters."], // Added length constraint for consistency
    },
    /**
     * Feedback content submitted by the user.
     * Captures user input or suggestions.
     */
    feedback: {
      type: String,
      required: [true, "Feedback content is required."],
      trim: true,
      maxlength: [1000, "Feedback content cannot exceed 1000 characters."], // Ensures reasonable content length
    },
    /**
     * Timestamp indicating when the feedback was created.
     * Defaults to the current date and time.
     */
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true, // Prevents modification after creation
    },
  },
  modelOptions
);

/**
 * Feedback Model
 * Represents the Feedback collection in the database.
 */
export default mongoose.model("Feedback", feedbackSchema);
