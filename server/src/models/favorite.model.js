import mongoose from "mongoose";
import modelOptions from "./model.options.js";

const { Schema } = mongoose;

/**
 * Favorite Schema
 * Represents a user's favorite media item.
 */
const favoriteSchema = new Schema(
  {
    /**
     * User who marked the item as favorite.
     * References the User model.
     */
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
    },
    /**
     * Type of media being marked as favorite.
     * Values must be either "tv" or "movie".
     */
    mediaType: {
      type: String,
      enum: {
        values: ["tv", "movie"],
        message: "Media type must be either 'tv' or 'movie'.",
      },
      required: [true, "Media type is required."],
    },
    /**
     * Unique ID of the media item.
     */
    mediaId: {
      type: String,
      required: [true, "Media ID is required."],
      trim: true, // Remove leading/trailing spaces
    },
    /**
     * Title of the media item.
     */
    mediaTitle: {
      type: String,
      required: [true, "Media title is required."],
      trim: true,
      maxlength: [200, "Media title cannot exceed 200 characters."],
    },
    /**
     * URL for the media poster.
     */
    mediaPoster: {
      type: String,
      required: [true, "Media poster URL is required."],
      validate: {
        validator: function (v) {
          // Validate that mediaPoster contains a properly formatted URL
          return /^(https?:\/\/[^\s]+)$/i.test(v);
        },
        message: "Media poster must be a valid URL.",
      },
    },
    /**
     * User rating of the media item.
     * Must be between 0 and 10.
     */
    mediaRate: {
      type: Number,
      required: [true, "Media rate is required."],
      min: [0, "Media rate must be at least 0."],
      max: [10, "Media rate cannot exceed 10."],
    },
  },
  modelOptions
);

/**
 * Favorite Model
 * Represents the Favorite collection in MongoDB.
 */
const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;
