import mongoose from "mongoose";
import modelOptions from "./model.options.js";

const { Schema } = mongoose;

/**
 * Watchlist Schema
 * Represents a user's watchlist (separate from favorites)
 * Like Netflix's "My List" feature
 */
const watchlistSchema = new Schema(
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
    mediaBackdrop: {
      type: String,
    },
    mediaRate: {
      type: Number,
      min: [0, "Media rate must be at least 0."],
      max: [10, "Media rate cannot exceed 10."],
    },
    // Watch status
    status: {
      type: String,
      enum: ["want_to_watch", "watching", "completed", "on_hold", "dropped"],
      default: "want_to_watch",
    },
    // For TV shows - track progress
    currentSeason: {
      type: Number,
      default: null,
    },
    currentEpisode: {
      type: Number,
      default: null,
    },
    // User's personal notes
    notes: {
      type: String,
      maxlength: [500, "Notes cannot exceed 500 characters."],
    },
    // Priority/order in watchlist
    priority: {
      type: Number,
      default: 0,
    },
    // Reminder date
    reminderDate: {
      type: Date,
    },
  },
  modelOptions
);

// Compound indexes for efficient queries
watchlistSchema.index({ user: 1, mediaId: 1 }, { unique: true });
watchlistSchema.index({ user: 1, status: 1 });
watchlistSchema.index({ user: 1, mediaType: 1 });
watchlistSchema.index({ user: 1, priority: -1, createdAt: -1 });
watchlistSchema.index({ user: 1, reminderDate: 1 });

const Watchlist = mongoose.model("Watchlist", watchlistSchema);

export default Watchlist;

