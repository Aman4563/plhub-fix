import mongoose from "mongoose";
import modelOptions from "./model.options.js";

const { Schema } = mongoose;

/**
 * Review Schema
 * Represents user-submitted reviews for media items.
 */
const reviewSchema = new Schema(
  {
    /**
     * Reference to the user who submitted the review.
     * Establishes a relationship with the User model.
     */
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
    },
    /**
     * Content of the review.
     */
    content: {
      type: String,
      required: [true, "Review content is required."],
      trim: true, // Ensures no leading/trailing spaces
      maxlength: [500, "Review content cannot exceed 500 characters."],
    },
    /**
     * Type of media being reviewed.
     * Must be either "tv" or "movie".
     */
    mediaType: {
      type: String,
      enum: ["tv", "movie"],
      required: [true, "Media type is required."],
    },
    /**
     * ID of the media being reviewed.
     */
    mediaId: {
      type: String,
      required: [true, "Media ID is required."],
    },
    /**
     * Title of the media being reviewed.
     */
    mediaTitle: {
      type: String,
      required: [true, "Media title is required."],
      trim: true,
      maxlength: [200, "Media title cannot exceed 200 characters."],
    },
    /**
     * Poster URL for the media being reviewed.
     */
    mediaPoster: {
      type: String,
      required: [true, "Media poster URL is required."],
      validate: {
        validator: function (v) {
          // Ensures mediaPoster contains a valid URL
          return /^(http|https):\/\/[^\s$.?#].[^\s]*$/.test(v);
        },
        message: "Media poster must be a valid URL.",
      },
    },
  },
  modelOptions
);

/**
 * Model: Review
 * Represents the Review collection in MongoDB.
 */
const Review = mongoose.model("Review", reviewSchema);

export default Review;
