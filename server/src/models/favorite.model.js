import mongoose from "mongoose";
import modelOptions from "./model.options.js";

const { Schema } = mongoose;

/**
 * Favorite Schema
 * Represents a user's favorite media item
 */
const favoriteSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required."],
      index: true,
    },
    mediaType: {
      type: String,
      enum: {
        values: ["tv", "movie"],
        message: "Media type must be either 'tv' or 'movie'.",
      },
      required: [true, "Media type is required."],
    },
    mediaId: {
      type: String,
      required: [true, "Media ID is required."],
      trim: true,
    },
    mediaTitle: {
      type: String,
      required: [true, "Media title is required."],
      trim: true,
      maxlength: [200, "Media title cannot exceed 200 characters."],
    },
    mediaPoster: {
      type: String,
      required: [true, "Media poster URL is required."],
    },
    mediaRate: {
      type: Number,
      required: [true, "Media rate is required."],
      min: [0, "Media rate must be at least 0."],
      max: [10, "Media rate cannot exceed 10."],
    },
  },
  modelOptions
);

// Compound index for efficient queries - user + mediaId should be unique
favoriteSchema.index({ user: 1, mediaId: 1 }, { unique: true });

// Index for querying by mediaType
favoriteSchema.index({ user: 1, mediaType: 1 });

// Index for sorting by creation date
favoriteSchema.index({ user: 1, createdAt: -1 });

const Favorite = mongoose.model("Favorite", favoriteSchema);

export default Favorite;
